// // app/__tests__/unit/SaveButton.spec.tsx
// import { vi, describe, it, expect } from 'vitest';
// import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import SaveButton from '../../app/ui/SaveButton';

// describe('<SaveButton>', () => {
//     it('calls POST and emits success message', async () => {
//         const user = userEvent.setup();
//         const rows = [{ id: 1, amount: 10 }];
//         const onSuccess = vi.fn();
//         render(<SaveButton rows={rows} onSuccess={onSuccess} onError={vi.fn()} />);

//         await user.click(screen.getByRole('button', { name: /save/i }));

//         expect(await screen.findByText(/saving\.\.\./i)).toBeInTheDocument();
//         await screen.findByText(/save transactions/i, {}, { timeout: 1500 }); // back to normal
//         expect(onSuccess).toHaveBeenCalledWith('Saved 1 transactions to database');
//     });
// });
