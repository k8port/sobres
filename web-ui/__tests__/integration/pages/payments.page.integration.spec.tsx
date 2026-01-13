import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import PaymentsPage from '@/app/payments/page';

describe('/payments page (integration)', () => {
  beforeEach(() => ___resetMswData());

  it('renders only payment rows and shows Spending Category selector', async () => {
    render(<PaymentsPage />);

    // Table appears
    expect(await screen.findByText('t_1', {}, { timeout: 3000 })).toBeInTheDocument();

    // Payment rows from MSW seed should appear
    expect(screen.getByText('t_1')).toBeInTheDocument();
    expect(screen.getByText('t_3')).toBeInTheDocument();

    // Non-payment row should NOT appear
    expect(screen.queryByText('t_2')).not.toBeInTheDocument();

    // Payment rows should each have a selector
    const row1 = screen.getByText('t_1').closest('tr');
    const row3 = screen.getByText('t_3').closest('tr');
    expect(row1).not.toBeNull();
    expect(row3).not.toBeNull();

    expect(within(row1!).getByLabelText(/spending category/i)).toBeInTheDocument();
    expect(within(row3!).getByLabelText(/spending category/i)).toBeInTheDocument();
  });
});
