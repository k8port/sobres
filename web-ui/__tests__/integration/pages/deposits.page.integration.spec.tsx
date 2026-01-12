import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import DepositsPage from '@/app/deposits/page';

describe('/deposits page (integration)', () => {
  beforeEach(() => ___resetMswData());

  it('renders only deposit rows and does not show Spending Category selector', async () => {
    render(<DepositsPage />);

    // Table appears (TransactionsTable heading)
    await screen.findByText(/transactions/i);

    // deposit row appears (from MSW seed)
    expect(screen.getByText('t_2')).toBeInTheDocument();

    // payment rows should not appear
    expect(screen.queryByText('t_1')).not.toBeInTheDocument();
    expect(screen.queryByText('t_3')).not.toBeInTheDocument();

    // no select exists because there are no payments rows
    expect(screen.queryByLabelText(/spending category/i)).not.toBeInTheDocument();

    // column header should also not exist
    expect(screen.queryByText(/envelope spending category/i)).not.toBeInTheDocument();
  });
});
