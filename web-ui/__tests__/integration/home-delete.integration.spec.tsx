import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/__tests__/test-utils/msw/server';
import Home from '@/app/page';

describe('Home transaction delete behavior', () => {
    async function uploadOneStatement() {
        const user = userEvent.setup();
        render(<Home />);

        const input = screen.getByLabelText(/upload account statement/i);
        const uploadButton = screen.getByRole('button', { name: /upload account statement/i });

        const file = new File(['dummy'], 'statement.pdf', { type: 'application/pdf' });
        await user.upload(input, file);
        await user.click(uploadButton);

        await screen.findByText('Coffee Shop');
        return user;
    }

    it('removes a row from Home table on successful delete', async () => {
        const user = await uploadOneStatement();

        const rowText = 'Coffee Shop';
        expect(screen.getByText(rowText)).toBeInTheDocument();

        const deleteButtons = screen.getAllByRole('button', {
            name: /delete transaction/i,
        });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.queryByText(rowText)).not.toBeInTheDocument();
        });
    });

    it('rolls back Home table delete when API delete fails', async () => {
        server.use(
            http.delete('/api/transactions/:id', async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return HttpResponse.json({ error: 'boom' }, { status: 500 });
            })
        );

        const user = await uploadOneStatement();

        const rowText = 'Coffee Shop';
        expect(screen.getByText(rowText)).toBeInTheDocument();

        const deleteButtons = screen.getAllByRole('button', {
            name: /delete transaction/i,
        });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.queryByText(rowText)).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(rowText)).toBeInTheDocument();
        });
    });
});
