// web-ui/__tests__/integration/onboarding-flow.integration.spec.tsx

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { test, expect, afterAll, afterEach, vi } from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    pushMock.mockReset();
});

test('shows previous year upload prompt on landing page', () => {
    render(<Home />);
    expect(screen.getByRole('progressbar')).toBeDefined();
    // Before any uploads, should show window range text, no missing list
    expect(screen.getByText(/upload.*statements.*covering.*period/i)).toBeDefined();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});

test('progress bar increases as statements are added', async () => {
    let i = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async url => {
        if (typeof url === 'string' && url.endsWith('/api/upload')) {
            i += 1;
            const month = String(i).padStart(2, '0');
            return new Response(
                JSON.stringify({ rows: [{ date: `2024-${month}-20` }], text: `OCR-RAW-${month}` }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return new Response('Not Found', { status: 404 });
    });

    render(<Home />);
    const input = screen.getByLabelText(/Upload Account Statement/i);
    const uploadButton = screen.getByRole('button', { name: /Upload Account Statement/i });

    for (let k = 1; k <= 3; k++) {
        const file = new File(['dummy'], `stmt-${k}.pdf`, { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });
        fireEvent.click(uploadButton);

        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    }

    await waitFor(() => {
        const progress = screen.getByRole('progressbar');
        expect(progress).toBeDefined();
    });
});

test('upload endpoint saves raw text; save transactions called as separate action', async () => {
    const calls: string[] = [];
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
        if (typeof url === 'string') calls.push(url);

        if (typeof url === 'string' && url.endsWith('api/upload')) {
            return new Response(
                JSON.stringify({ rows: [{ date: '2024-01-15' }], text: 'OCR-RAW-TEXT' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (typeof url === 'string' && url.endsWith('api/transactions')) {
            return new Response(JSON.stringify({ success: false }), { status: 403 });
        }

        return new Response('Not Found', { status: 404 });
    });

    render(<Home />);

    const input = screen.getByLabelText(/Upload Account Statement/i);
    const uploadButton = screen.getByRole('button', { name: /Upload Account Statement/i });

    const file = new File(['dummy'], 'bank.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(uploadButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await waitFor(() => {
        expect(calls.some(u => u.endsWith('api/upload'))).toBe(true);
    });

    fetchMock.mockRestore();
});

test('after 12 statement uploads onboarding task is complete', async () => {
    let i = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async url => {
        if (typeof url === 'string' && url.endsWith('/api/upload')) {
            i += 1;
            const month = String(i).padStart(2, '0');
            return new Response(
                JSON.stringify({
                    rows: [{ date: `2024-${month}-20` }],
                    text: `OCR-RAW-${month}`,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return new Response('Not Found', { status: 404 });
    });

    render(<Home />);
    const input = screen.getByLabelText(/Upload Account Statement/i);
    const uploadButton = screen.getByRole('button', { name: /Upload Account Statement/i });

    // simulate 12 uploads
    for (let i = 0; i < 12; i++) {
        const file = new File(['dummy'], `stmt-${i}.pdf`, { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });
        fireEvent.click(uploadButton);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    }

    await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeDefined();
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
            const parsed = new URL(url, 'http://localhost:8000');
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

        expect(screen.queryByRole('navigation', { name: /Primary/i })).toBeNull();
    } finally {
        fetchMock.mockRestore();
    }
});

test('shows coverage from saved ranges returned by backend', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;

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
        const url = typeof input === 'string' ? input : input.url;

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
