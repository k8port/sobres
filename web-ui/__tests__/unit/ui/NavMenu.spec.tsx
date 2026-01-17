import { render, screen } from '@testing-library/react';
import NavMenu from '@/app/ui/NavMenu';

describe('NavMenu', () => {
  it('does not render when not enabled', () => {
    render(<NavMenu enabled={false} />);
    expect(screen.queryByRole('navigation', { name: /primary/i })).toBeNull();
  });

  it('renders links when enabled', () => {
    render(<NavMenu enabled />);
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /transactions/i })).toHaveAttribute('href', '/transactions');
    expect(screen.getByRole('link', { name: /payments/i })).toHaveAttribute('href', '/payments');
    expect(screen.getByRole('link', { name: /deposits/i })).toHaveAttribute('href', '/deposits');
    expect(screen.getByRole('link', { name: /envelopes/i })).toHaveAttribute('href', '/envelopes');
  });
});
