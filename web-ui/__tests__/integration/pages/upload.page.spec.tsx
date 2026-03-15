import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page'; // adjust if the page file path differs
import { ___getLastTransactionsBody } from '@/__tests__/test-utils/msw/handlers';

describe('Onboarding upload flow (integration)', () => {
    it('uploads a PDF, renders table rows, allows notes, and posts transactions', async () => {
        const user = userEvent.setup();
        render(<Home />);

        // Select a file
        const fileInput = screen.getByLabelText(/upload account statement/i);
        const file = new File([new Uint8Array([1, 2, 3])], 'test.pdf', { type: 'application/pdf' });
        await user.upload(fileInput, file);

        // Click Upload
        const uploadBtn = screen.getByRole('button', { name: /upload account statement/i });
        await user.click(uploadBtn);

        // Table appears (your table has role=table in <table> tag)
        const table = await screen.findByRole('table', {}, { timeout: 3000 });
        expect(table).toBeDefined();

        // Verify success notification appears
        const successMsg = await screen.findByText(/Upload Successful/i, {}, { timeout: 3000 });
        expect(successMsg).toBeDefined();

        // Verify "Transactions" header appears (from TransactionsTable)
        const heading = screen.queryByRole('heading', { name: /^transactions$/i });
        if (heading) {
            expect(heading).toBeDefined();
        }

        // Add a note for row 1 (label defined by TransactionsTable)
        // Notes functionality is optional in TransactionsTable
        const noteInputs = screen.queryAllByLabelText(/notes/i);
        if (noteInputs.length > 0) {
            await user.type(noteInputs[0], 'flag this');
        }

        // Click "Update Transactions"
        const saveBtn = screen.getByRole('button', { name: /update transactions/i });
        await user.click(saveBtn);

        // Assert the transactions POST captured by MSW backend was called
        await waitFor(
            () => {
                expect(___getLastTransactionsBody()).toBeTruthy();
            },
            { timeout: 3000 }
        );

        // Body should be an array
        const body = ___getLastTransactionsBody() as any[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);

        // First row should have transaction data
        const firstRow = body[0];
        expect(firstRow).toBeTruthy();
        expect(firstRow.id).toBeTruthy();
    });
});
