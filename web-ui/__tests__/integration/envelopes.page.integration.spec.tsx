import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';
import EnvelopesPage from '@/app/envelopes/page';

describe('/envelopes integration', () => {
  beforeEach(() => ___resetMswData());

  it('renders existing envelopes from GET /api/envelopes', async () => {
    render(<EnvelopesPage />);
    expect(await screen.findByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('submits form to POST /api/envelopes and renders new envelope', async () => {
    const user = userEvent.setup();
    render(<EnvelopesPage />);

    const nameInput = await screen.findByLabelText(/envelope name/i);
    await user.type(nameInput, 'Utilities');
    await user.click(screen.getByRole('button', { name: /add envelope/i }));

    expect(await screen.findByText('Utilities')).toBeInTheDocument();
  });
});
