// web-ui/__tests__/integration/upload-status.integration.spec.tsx
//
// Integration boundary:
//   Real: Home (page.tsx), handleUpload, handleSave, useSaveTransactions, JSX rendering
//   Mocked: network only (MSW). Auth state is controlled per-test via server.use() overrides.
//
// These tests will FAIL until page.tsx differentiates draft vs saved messaging (Phase 4d).

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

import React from 'react';
import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import Home from '@/app/page';
import { server } from '@/__tests__/test-utils/msw/server';

beforeEach(() => {
    try {
        window.localStorage.clear();
    } catch {}
});

afterAll(() => {
    pushMock.mockReset();
});

const PDF_FILE = () =>
    new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'statement.pdf', {
        type: 'application/pdf',
    });

async function uploadFile() {
    const user = userEvent.setup();
    const input = screen.getByLabelText(/upload account statement/i);
    await user.upload(input, PDF_FILE());
    await user.click(screen.getByRole('button', { name: /upload account statement/i }));
    return user;
}

describe('Upload status messaging (integration)', () => {
    // -------------------------------------------------------------------------
    // Test 1
    // Anonymous user uploads → draft-only message: "X transactions ready to review"
    // Will FAIL until page.tsx uses auth state to choose message (Phase 4d).
    // -------------------------------------------------------------------------
    test('anonymous upload shows draft success message: "X transactions ready to review"', async () => {
        // No auth — /api/auth/me returns 401
        server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })));

        render(<Home />);
        await uploadFile();

        // Draft message must mention count and "ready to review"
        expect(
            await screen.findByText(/transactions ready to review/i, {}, { timeout: 3000 })
        ).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // Test 2
    // Draft upload success must NOT use the word "persisted" — that implies DB write.
    // Will FAIL until page.tsx removes "persisted" from the anonymous message (Phase 4d).
    // -------------------------------------------------------------------------
    test('draft success message does NOT say "persisted"', async () => {
        server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })));

        render(<Home />);
        await uploadFile();

        // Wait for any success message to appear, then assert "persisted" is absent
        await screen.findByText(/ready to review/i, {}, { timeout: 3000 });
        expect(screen.queryByText(/persisted/i)).not.toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // Test 3
    // Authenticated user uploads then saves → persisted message: "X transactions saved"
    // Will FAIL until page.tsx gates save messaging on auth state (Phase 4d).
    // -------------------------------------------------------------------------
    test('authenticated save shows saved success message: "X transactions saved"', async () => {
        // Authenticated session
        server.use(
            http.get('/api/auth/me', () =>
                HttpResponse.json({ id: 'dev-user-1', name: 'Dev User' })
            )
        );

        render(<Home />);
        const user = await uploadFile();

        // Rows appear in the table after upload — wait for the save button
        const saveButton = await screen.findByRole(
            'button',
            { name: /update transactions/i },
            { timeout: 3000 }
        );
        await user.click(saveButton);

        // After save completes, success message must say "X transactions saved"
        expect(
            await screen.findByText(/transactions saved/i, {}, { timeout: 3000 })
        ).toBeInTheDocument();

        // "persisted" language must not appear in the save success message either
        expect(screen.queryByText(/persisted/i)).not.toBeInTheDocument();
    });
});
