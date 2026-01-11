import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ___resetMswData, ___getPatchCount } from '@/__tests__/test-utils/msw/handlers';
import PaymentsTable from '@/app/components/transactions/payments/PaymentsTable';

describe('Payments selector integration', () => {
  beforeEach(() => ___resetMswData());

  it('changing selector calls PATCH and updates row', async () => {
    const user = userEvent.setup();
    render(<PaymentsTable />);

    const [selectEl] = await screen.findAllByLabelText('Spending Category', {}, { timeout: 3000 });
    const select = selectEl as HTMLSelectElement;
    expect(___getPatchCount()).toBe(0);

    // action
    await user.selectOptions(select, 'env_1');


    await waitFor(() => expect(___getPatchCount()).toBe(1));

    expect(select.value).toBe('env_1');
  });
});
