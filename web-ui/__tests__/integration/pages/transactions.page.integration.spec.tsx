import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import TransactionsPage from '@/app/transactions/page';

describe('/transactions page (integration)', () => {
  beforeEach(() => ___resetMswData());

  it('renders all rows', async () => {
    render(<TransactionsPage />);

    // wait for any known row
    expect(await screen.findByText('t_1', {}, { timeout: 3000 })).toBeInTheDocument();

    // should include all seeded rows
    expect(screen.getByText('t_2')).toBeInTheDocument();
    expect(screen.getByText('t_3')).toBeInTheDocument();
  });
});
