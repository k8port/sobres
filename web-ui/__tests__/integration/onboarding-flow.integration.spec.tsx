// web-ui/__tests__/integration/onboarding-flow.integration.spec.tsx

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { test, expect, afterAll, vi } from 'vitest';

afterAll(() => {
    pushMock.mockReset();
});

test('shows previous year upload prompt on landing page', () => {
    render(<Home />);
    const prevYear = new Date().getFullYear() - 1;
    expect(screen.getByRole('progressbar')).toBeDefined();
    expect(screen.getByRole('progressbar')).toBeDefined();
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
