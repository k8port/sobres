import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import TransactionsPage from '@/app/transactions/page';

describe('/transactions page (integration)', () => {
    beforeEach(() => ___resetMswData());

    it('displays the transaction count fetched from the backend', async () => {
        render(<TransactionsPage />);

        // MSW seeds 3 transactions — page should show the count
        expect(
            await screen.findByText(
                /user has 3 transactions to display here/i,
                {},
                { timeout: 3000 }
            )
        ).toBeInTheDocument();
    });
});
