// web-ui/__tests__/integration/onboarding-flow.integration.spec.tsx

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import Home from '@/app/page';
import { test, expect, describe, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { server } from '@/__tests__/test-utils/msw/server';
import { ___setSavedUploadRanges } from '@/__tests__/test-utils/msw/handlers';

beforeEach(() => {
    try {
        window.localStorage.clear();
    } catch {}
});

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    pushMock.mockReset();
});

// Removed: 'progress bar increases as statements are added'
// Encoded the old contract: progressbar visible to anonymous users on landing.
// Replaced by the four new contract tests below.

describe('new contract: onboarding behavior', () => {
    // Test 1
    // OnboardingPrompt is post-auth only. Anonymous users must not see it.
    // FAILs until AuthContext is wired into Home
    test('onboarding prompt is NOT visible to anonymous users', async () => {
        // Anonymous session: /api/auth/me returns 401
        server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })));

        render(<Home />);

        // Give any auth-check effects time to settle, then assert no progressbar
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
    });

    // Test 2
    // NavMenu must render regardless of onboarding completion state.
    // FAILS until navEnabled gate is removed from Home (Phase 4d).
    test('onboarding prompt is NOT blocking -- nav links are reachable before onboarding completes', async () => {
        // Authenticated, but no saved ranges → 0% coverage → onboarding not complete
        server.use(
            http.get('/api/auth/me', () =>
                HttpResponse.json({ id: 'dev-user-1', name: 'Dev User' })
            )
        );

        render(<Home />);

        // NavMenu must be present even though coverage is 0% and onboarding is incomplete
        await waitFor(() => {
            expect(screen.getByRole('navigation', { name: /Primary/i })).toBeDefined();
        });
    });

    // Test 3
    // useOnboardingFlag must read localStorage on mount so a previously dismissed
    // prompt stays dismissed after remount.
    // FAILs until useState(() => getInitial()) is used in useOnboardingFlag (Phase 4e).
    test('onboarding dismissal persists across remount when user is authenticated', async () => {
        // Simulate a prior session where the user dismissed the onboarding prompt
        window.localStorage.setItem('onboardingFlag', 'false');

        server.use(
            http.get('/api/auth/me', () =>
                HttpResponse.json({ id: 'dev-user-1', name: 'Dev User' })
            )
        );

        const { unmount } = render(<Home />);

        // On first mount, flag is read from localStorage — progressbar must not appear
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        unmount();

        // After remount, localStorage is read again — still dismissed
        render(<Home />);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
    });

    // Test 4
    // OnboardingPrompt progress must reflect ranges from GET /api/uploads/ranges, not manufactured local state.
    test('onboarding progress reflects saved upload ranges from backend, not local state', async () => {
        // Authenticated user with partial backend coverage (2 out of 12 months)
        server.use(
            http.get('/api/auth/me', () =>
                HttpResponse.json({ id: 'dev-user-1', name: 'Dev User' })
            )
        );

        ___setSavedUploadRanges([
            { start: '2025-03-08', end: '2025-04-07' },
            { start: '2025-04-08', end: '2025-05-07' },
        ]);

        render(<Home />);

        // Progress bar value must be > 0 (ranges present) and < 100 (not fully covered)
        await waitFor(() => {
            const bar = screen.getByRole('progressbar') as HTMLProgressElement;
            expect(Number(bar.value)).toBeGreaterThan(0);
            expect(Number(bar.value)).toBeLessThan(100);
        });
    });
});

test('dec-to-mar uploads show about 25% completion and missing march-to-dec range', async () => {
    const uploadIds = ['u-dec', 'u-jan', 'u-feb'];
    let uploadIndex = 0;

    // Track saved ranges as uploads accumulate (simulates backend behavior)
    const rangesByUpload: Record<string, { start: string; end: string }> = {
        'u-dec': { start: '2025-12-08', end: '2026-01-07' },
        'u-jan': { start: '2026-01-08', end: '2026-02-07' },
        'u-feb': { start: '2026-02-08', end: '2026-03-07' },
    };
    const completedUploads: string[] = [];

    const parseRowsByUpload: Record<string, Array<Record<string, unknown>>> = {
        'u-dec': [
            {
                id: 'd1',
                date: '2025-12-08',
                payee: 'Payee Dec 1',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-dec',
            },
            {
                id: 'd2',
                date: '2026-01-05',
                payee: 'Payee Dec 2',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-dec',
            },
        ],
        'u-jan': [
            {
                id: 'j1',
                date: '2026-01-08',
                payee: 'Payee Jan 1',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-jan',
            },
            {
                id: 'j2',
                date: '2026-02-04',
                payee: 'Payee Jan 2',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-jan',
            },
        ],
        'u-feb': [
            {
                id: 'f1',
                date: '2026-02-09',
                payee: 'Payee Feb 1',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-feb',
            },
            {
                id: 'f2',
                date: '2026-03-06',
                payee: 'Payee Feb 2',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-feb',
            },
        ],
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;

        if (url.includes('/api/uploads/ranges')) {
            const ranges = completedUploads.map(id => rangesByUpload[id]).filter(Boolean);
            return new Response(JSON.stringify({ ranges }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (url.endsWith('/api/upload')) {
            const id = uploadIds[uploadIndex++] ?? `u-extra-${uploadIndex}`;
            return new Response(
                JSON.stringify({ id, datetime: new Date().toISOString(), stored: true }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (url.includes('/api/upload/parse')) {
            const parsed = new URL(url.toString(), 'http://localhost:8000');
            const uploadId = parsed.searchParams.get('uploadId') ?? '';
            completedUploads.push(uploadId);
            return new Response(JSON.stringify({ rows: parseRowsByUpload[uploadId] ?? [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (url.endsWith('/api/transactions')) {
            return new Response(JSON.stringify({ count: 6 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response('Not Found', { status: 404 });
    });

    try {
        render(<Home />);
        const input = screen.getByLabelText(/Upload Account Statement/i);
        const uploadButton = screen.getByRole('button', { name: /Upload Account Statement/i });

        const uploadExpectPayees = ['Payee Dec 2', 'Payee Jan 2', 'Payee Feb 2'];
        for (let i = 0; i < uploadExpectPayees.length; i++) {
            const file = new File(['dummy'], `stmt-${i}.pdf`, { type: 'application/pdf' });
            fireEvent.change(input, { target: { files: [file] } });
            fireEvent.click(uploadButton);

            await waitFor(() => {
                expect(screen.getByText(uploadExpectPayees[i])).toBeDefined();
            });
        }

        await waitFor(() => {
            const bars = screen.getAllByRole('progressbar');
            expect(bars[0].getAttribute('title')).toBe('25% complete');
        });

        // Should show 9 individual missing statement periods, not one contiguous gap
        await waitFor(() => {
            const items = screen.getAllByRole('listitem');
            expect(items).toHaveLength(9);
            // First missing: Mar 8, 2025 - Apr 7, 2025
            expect(items[0].textContent).toContain('2025-03-08');
            expect(items[0].textContent).toContain('2025-04-07');
            // Last missing: Nov 8, 2025 - Dec 7, 2025
            expect(items[8].textContent).toContain('2025-11-08');
            expect(items[8].textContent).toContain('2025-12-07');
        });
    } finally {
        fetchMock.mockRestore();
    }
});

test('shows coverage from saved ranges returned by backend', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof Request
                  ? input.url
                  : input.toString();

        // Return saved ranges from backend
        if (url.includes('/api/uploads/ranges')) {
            return new Response(
                JSON.stringify({
                    ranges: [
                        { start: '2025-03-08', end: '2025-04-07' },
                        { start: '2025-04-08', end: '2025-05-07' },
                    ],
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (url.endsWith('/api/upload')) {
            return new Response(
                JSON.stringify({ id: 'u-test', datetime: new Date().toISOString(), stored: true }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (url.includes('/api/upload/parse')) {
            return new Response(
                JSON.stringify({
                    rows: [
                        {
                            id: 'r1',
                            date: '2025-03-10',
                            payee: 'Test',
                            amount: -5,
                            cat: 'payments',
                            uploadId: 'u-test',
                        },
                    ],
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (url.endsWith('/api/transactions')) {
            return new Response(JSON.stringify({ count: 1 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response('Not Found', { status: 404 });
    });

    try {
        render(<Home />);

        // Upload a statement to trigger onboarding
        const input = screen.getByLabelText(/Upload Account Statement/i);
        const uploadButton = screen.getByRole('button', { name: /Upload Account Statement/i });
        const file = new File(['dummy'], 'stmt.pdf', { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByText('Test')).toBeDefined();
        });

        // Single progress bar showing coverage from saved ranges
        await waitFor(() => {
            const bars = screen.getAllByRole('progressbar');
            expect(bars).toHaveLength(1);
        });
    } finally {
        fetchMock.mockRestore();
    }
});

test('multi-file upload updates progress bar from saved ranges', async () => {
    const uploadIds = ['u-a', 'u-b', 'u-c'];
    let uploadIndex = 0;
    const completedParses: string[] = [];

    const rangesByUpload: Record<string, { start: string; end: string }> = {
        'u-a': { start: '2025-12-08', end: '2026-01-07' },
        'u-b': { start: '2026-01-08', end: '2026-02-07' },
        'u-c': { start: '2026-02-08', end: '2026-03-07' },
    };

    const rowsByUpload: Record<string, Array<Record<string, unknown>>> = {
        'u-a': [
            {
                id: 'a1',
                date: '2025-12-10',
                payee: 'P-A',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-a',
            },
        ],
        'u-b': [
            {
                id: 'b1',
                date: '2026-01-10',
                payee: 'P-B',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-b',
            },
        ],
        'u-c': [
            {
                id: 'c1',
                date: '2026-02-10',
                payee: 'P-C',
                amount: -1,
                cat: 'payments',
                uploadId: 'u-c',
            },
        ],
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async input => {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof Request
                  ? input.url
                  : input.toString();

        if (url.includes('/api/uploads/ranges')) {
            const ranges = completedParses.map(id => rangesByUpload[id]).filter(Boolean);
            return new Response(JSON.stringify({ ranges }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (url.endsWith('/api/upload')) {
            const id = uploadIds[uploadIndex++];
            return new Response(
                JSON.stringify({ id, datetime: new Date().toISOString(), stored: true }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (url.includes('/api/upload/parse')) {
            const parsed = new URL(url, 'http://localhost:8000');
            const uploadId = parsed.searchParams.get('uploadId') ?? '';
            completedParses.push(uploadId);
            return new Response(JSON.stringify({ rows: rowsByUpload[uploadId] ?? [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (url.endsWith('/api/transactions')) {
            return new Response(JSON.stringify({ count: 3 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response('Not Found', { status: 404 });
    });

    try {
        render(<Home />);

        // BEFORE upload: should show window text, NO missing periods list
        expect(screen.getByText(/upload.*statements.*covering.*period/i)).toBeDefined();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        expect(screen.getByRole('progressbar').getAttribute('title')).toBe('0% complete');

        // Select 3 files at once (multi-select) and upload in a single click
        const input = screen.getByLabelText(/Upload Account Statement/i);
        const uploadButton = screen.getByRole('button', { name: /Upload Account Statement/i });

        const files = [
            new File(['a'], 'dec.pdf', { type: 'application/pdf' }),
            new File(['b'], 'jan.pdf', { type: 'application/pdf' }),
            new File(['c'], 'feb.pdf', { type: 'application/pdf' }),
        ];
        fireEvent.change(input, { target: { files } });
        fireEvent.click(uploadButton);

        // AFTER upload completes: progress should reflect saved ranges (25%)
        await waitFor(() => {
            const bars = screen.getAllByRole('progressbar');
            expect(bars[0].getAttribute('title')).toBe('25% complete');
        });

        // Should now show 9 missing periods (two-phase: list appears after upload)
        await waitFor(() => {
            const items = screen.getAllByRole('listitem');
            expect(items).toHaveLength(9);
        });
    } finally {
        fetchMock.mockRestore();
    }
});
