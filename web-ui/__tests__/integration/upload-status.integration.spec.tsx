import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';

describe('Upload status messaging (integration)', () => {
    it('shows stored + processed/savedCount messages after successful upload', async () => {
        const user = userEvent.setup();
        render(<Home />);

        // pick a PDF
        const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'statement.pdf', {
            type: 'application/pdf',
        });

        const input = screen.getByLabelText(/upload account statement/i);
        await user.upload(input, file);

        await user.click(screen.getByRole('button', { name: /upload account statement/i }));

        // Should show success notification with statement count and transaction count
        expect(
            await screen.findByText(/Upload Successful/i, {}, { timeout: 3000 })
        ).toBeInTheDocument();

        // Should show statement upload count
        expect(
            await screen.findByText(/statement.*uploaded to storage/i, {}, { timeout: 3000 })
        ).toBeInTheDocument();

        // Should show transaction count with persisted language
        expect(
            await screen.findByText(
                /transaction.*parsed, persisted and ready/i,
                {},
                { timeout: 3000 }
            )
        ).toBeInTheDocument();
    });

    it('shows stored and processed messages after upload', async () => {
        const user = userEvent.setup();
        render(<Home />);

        const file = new File(['x'], 'march.pdf', { type: 'application/pdf' });
        await user.upload(screen.getByLabelText(/upload/i), file);
        await user.click(screen.getByRole('button', { name: /upload/i }));

        // Should show upload success
        expect(await screen.findByText(/Upload Successful/i)).toBeInTheDocument();

        // Should show transaction count with persisted language
        expect(await screen.findByText(/parsed, persisted and ready/i)).toBeInTheDocument();
    });

    it('displays transactions from ALL uploaded statements, not just one', async () => {
        const user = userEvent.setup();
        render(<Home />);

        // Select two PDF files
        const file1 = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'january.pdf', {
            type: 'application/pdf',
        });
        const file2 = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'february.pdf', {
            type: 'application/pdf',
        });

        const input = screen.getByLabelText(/upload account statement/i);
        await user.upload(input, [file1, file2]);

        await user.click(screen.getByRole('button', { name: /upload account statement/i }));

        // Wait for success
        expect(
            await screen.findByText(/Upload Successful/i, {}, { timeout: 3000 })
        ).toBeInTheDocument();

        // MSW backend parse handler returns 5 rows per uploadId.
        // Two files → two upload IDs → two parse calls → 10 rows total.
        expect(
            await screen.findByText(/10 transaction/i, {}, { timeout: 3000 })
        ).toBeInTheDocument();

        // Table should render all 10 rows
        const table = screen.getByRole('table');
        const dataRows = table.querySelectorAll('tbody tr');
        expect(dataRows.length).toBe(10);

        // Button should say "Update Transactions" not "Save Transactions"
        expect(screen.getByRole('button', { name: /update transactions/i })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /save transactions/i })
        ).not.toBeInTheDocument();
    });
});
