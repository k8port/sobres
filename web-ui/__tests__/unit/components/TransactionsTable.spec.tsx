// __tests__/unit/lib/components/TransactionsTable.spec.tsx

import { render, screen, within } from '@testing-library/react';
import TransactionsTable from '@/app/ui/transactions/TransactionsTable';
import { it, vi, expect } from 'vitest';

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

