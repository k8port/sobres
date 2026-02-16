import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page'; // adjust if the page file path differs
import { lastTransactionsBody } from '@/__tests__/test-utils/msw/server';
import { ___getLastTransactionsBody } from '@/__tests__/test-utils/msw/handlers';

describe('Onboarding upload flow (integration)', () => {
    it('uploads a PDF, renders table rows, allows notes, and posts transactions', async () => {
        render(<Home />);

        // Select a file
        const fileInput = screen.getByLabelText(/upload account statement/i) as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], 'test.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Click Upload
        const uploadBtn = screen.getByRole('button', { name: /upload account statement/i });
        fireEvent.click(uploadBtn);

        // Table appears (your table has role=table in <table> tag)
        const table = await screen.findByRole('table');
        expect(table).toBeDefined();

        // Verify "Transactions" header appears (from TransactionsTable)
        expect(screen.getByRole('heading', { name: /^transactions$/i })).toBeDefined();

        // Add a note for row 1 (label defined by TransactionsTable)
        const noteInput = screen.getByLabelText(/notes for row 1/i);
        fireEvent.change(noteInput, { target: { value: 'flag this' } });

        // Click "Save Transactions"
        const saveBtn = screen.getByRole('button', { name: /save transactions/i });
        fireEvent.click(saveBtn);

        // Assert the transactions POST captured by MSW backend was called with notes
        await waitFor(() => {
            expect(___getLastTransactionsBody()).toBeTruthy();
        });

        // Body should be an array that includes the note inline or via your "withNotes" merger
        const body = ___getLastTransactionsBody() as any[];
        expect(Array.isArray(body)).toBe(true);
        // find the first row (id:1) and verify note value present
        const row1 = body.find((r) => r.id === 1);
        expect(row1).toBeTruthy();
        expect(row1.notes ?? row1.note ?? row1['notes']).toBe('flag this');
    });
});
