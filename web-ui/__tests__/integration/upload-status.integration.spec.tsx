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

    // message 1
    expect(
      await screen.findByText(/Upload received and saved successfully/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    // message 2 (savedCount interpolated)
    expect(
      await screen.findByText((content) => 
        /Statement processed successfully/i.test(content) &&
        /transactions saved to database/i.test(content)
      , {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });
});
