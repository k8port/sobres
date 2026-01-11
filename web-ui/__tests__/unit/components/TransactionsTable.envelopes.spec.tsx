import TransactionsTable from "@/app/components/transactions/TransactionsTable";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

describe('TransactionsTable envelope column', () => {
    it('shows Envelope select for payments rows', () => {
        render(
            <TransactionsTable
                rows={[
                    { id: 1, cat: 'payments', amount: 10 },
                    { id: 2, cat: 'income', amount: 20 },
                ]}
                notesById={{}}
                isSaving={false}
                onNotesChange={() => {}}
            />
        );

        // header exists
        expect(screen.getByRole('columnheader', { name: /envelope/i })).toBeInTheDocument();

        // payments row has select
        const paymentsRow = screen.getByText('payments').closest('tr');
        expect(paymentsRow).not.toBeNull();
        expect(within(paymentsRow!).getByRole('combobox', { name: /spending category/i })).toBeInTheDocument();
        expect(within(paymentsRow!).getByRole('option', { name: /unassigned/i })).toBeInTheDocument();

        // income row does not have select
        const incomeRow = screen.getByText('income').closest('tr');
        expect(incomeRow).not.toBeNull();
        expect(within(incomeRow!).queryByRole('combobox', { name: /envelope/i })).toBeNull();
    })
})