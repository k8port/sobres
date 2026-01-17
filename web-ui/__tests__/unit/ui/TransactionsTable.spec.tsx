// __tests__/unit/ui/TransactionsTable.spec.tsx

import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import TransactionsTable from '@/app/ui/transactions/TransactionsTable';
import { it, vi, expect } from 'vitest';
import { ___getPatchCount } from '@/__tests__/test-utils/msw/handlers';

const user = userEvent.setup();

it("expects input field for notes", () => {
    const rows = [
        { id: 1, date: '2024-01-01', description: 'Coffee', amount: 3.5, payee: 'Kroger' },
    ];

    render(
        <TransactionsTable
            rows={rows}
            notesById={{1: 'bustelo coffee'}}
            isSaving={true}
            onNotesChange={() => {}}
        />
    );

    const table = screen.getByRole('table');
    const input = within(table).getByPlaceholderText("Jot note...");
    expect(input).toBeDefined();
});

it("shows Save button per row and invokes onSaveRow for that row", async () => {
    const onSaveRow = vi.fn();
    const rows = [
        {id: 101, date: '2025-01-01', description: 'gas bill', amount: 209.00, payee: 'Atmos Energy', envelopeId: 'env_00', uploadId: 'up_00'},
        {id: 102, date: '2025-01-05', description: 'internet bill', amount: 59.00, payee: 'Spectrum', envelopeId: 'env_01', uploadId: 'up_00'},
        {id: 103, date: '2025-01-09', description: 'takeout', amount: 40.00, payee: 'Takeout Trash', envelopeId: 'env_02', uploadId: 'up_00'},
        {id: 104, date: '2025-01-09', description: 'car payment', amount: 209.00, payee: 'Financial Douche Brothers', envelopeId: 'env_04', uploadId: 'up_00'},
        {id: 105, date: '2025-01-11', description: 'drugstore', amount: 89.00, payee: 'Walgreens', envelopeId: 'env_08', uploadId: 'up_00'},
    ]; 

    render(
        <TransactionsTable 
            rows={rows}
            notesById={{103: 'bad meat'}}
            isSaving={true}
            onNotesChange={() => {}}
            onSaveRow={onSaveRow}
        />
    );

    const saveButtons = screen.getAllByRole('button', { name: /^save$/i });
    await user.click(saveButtons[0]);

    expect(onSaveRow).toHaveBeenCalledTimes(1);
    expect(onSaveRow).toHaveBeenCalledWith('101');
})

