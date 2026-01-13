import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import PaymentsPage from '@/app/payments/page';

describe('Transaction deletion (integration)', () => {
  beforeEach(() => ___resetMswData());

  it('deletes a transaction and removes it from the table', async () => {
    const user = userEvent.setup();
    render(<PaymentsPage />);

    // ensure rows loaded
    expect(await screen.findByText('t_1')).toBeInTheDocument();

    // click delete
    await user.click(screen.getByRole('button', { name: /delete transaction t_1/i }));

    // assert removed
    await waitFor(() => {
      expect(screen.queryByText('t_1')).not.toBeInTheDocument();
    });
  });
});
