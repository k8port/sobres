import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { ___resetMswData, ___getPatchCount } from '@/__tests__/test-utils/msw/handlers';
import PaymentsPage from '@/app/payments/page';

describe('Payments selector integration', () => {
    beforeEach(() => ___resetMswData());

    it('selecting a spending category PATCHes and updates the row', async () => {
        const user = userEvent.setup();
        render(
            <React.StrictMode>
                <PaymentsPage />
            </React.StrictMode>
        );

        // Wait for a specific payments row
        const row1 = await screen.findByText('t_1', {}, { timeout: 3000 });
        const tr = row1.closest('tr');
        expect(tr).not.toBeNull();

        expect(___getPatchCount()).toBe(0);

        const select = within(tr!).getByLabelText(/spending category/i) as HTMLSelectElement;

        // action
        await user.selectOptions(select, 'env_1');

        // request happened
        await waitFor(() => expect(___getPatchCount()).toBeGreaterThanOrEqual(1));

        // UI updated (select value reflects new envelope)
        expect(select.value).toBe('env_1');

        // Optional: envelopeId cell shows env_1 as well (your table renders envelopeId column)
        expect(within(tr!).getByText('env_1')).toBeInTheDocument();
    });
});
