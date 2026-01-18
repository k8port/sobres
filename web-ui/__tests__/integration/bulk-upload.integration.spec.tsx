import Home from "@/app/page";
import { render, screen } from "@testing-library/react";
import { it } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { lastUploadCount } from "../test-utils/msw/handlers";

it('allows selecting multiple statements and uploads them together', async () => {
  const user = userEvent.setup();
  render(<Home />);

  const fileInput = screen.getByLabelText(/upload/i);

  const files = [
    new File(['a'], 'jan.pdf', { type: 'application/pdf' }),
    new File(['b'], 'feb.pdf', { type: 'application/pdf' }),
  ];

  await user.upload(fileInput, files);

  const submit = screen.getByRole('button', { name: /upload/i });
  await user.click(submit);

  await screen.findByText(/upload has been received/i);
  expect(lastUploadCount).toBe(2);
});
