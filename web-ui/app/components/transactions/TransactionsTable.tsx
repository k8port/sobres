import React from "react";
import type { SpendingCategory } from "@/app/lib/types";

type Row = Record<string, unknown>;

export interface TransactionsTableProps {
    rows: Row[];
    notesById: Record<string | number, string>;
    isSaving: boolean;
    onNotesChange: (id: string | number, value: string) => void;

    envelopes?: SpendingCategory[];
    envelopeByTransId?: Record<string | number, string | null>
    onEnvelopeChange?: (transId: string | number, envelopeId: string | null) => void;
}

export default function TransactionsTable({
    rows,
    notesById,
    isSaving,
    onNotesChange,
    envelopes = [],
    envelopeByTransId = {},
    onEnvelopeChange
}: TransactionsTableProps) {
    if (!rows?.length) return null;

    const keys = Object.keys(rows[0]);
    const idOf = (row: Row) => (row.id as string | number) ?? JSON.stringify(row);
    const hasPayments = rows.some((r) => String(r.cat ?? "") === "payments");

    return (
        <div className="mt-10 w-full max-w-4xl bg-white shadow rounded p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Transactions</h2>
            <table className="min-w-full text-sm text-left text-gray-700 divide-y divide-gray-200">
                <thead className="bg-gray-200">
                    <tr>
                        {keys.map((key) => (
                            <th key={key} className="px-4 py-2 text-xs border-b">{key}</th>
                        ))}

                        {hasPayments && (
                            <th className="px-4 py-2 text-xs border-b">Envelope Spending Category</th>
                        )}

                        <th className="px-4 py-2 text-xs border-b">Jot a note</th>
                    </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row, i) => {
                        const id = idOf(row);
                        const isPayment = String(row.cat ?? "") === "payments";

                        return (
                            <tr key={i} className="even:bg-gray-50">
                                {keys.map((k) => (
                                    <td key={k} className="px-4 py-2 whitespace-nowrap border-b">
                                        {typeof row[k] === 'number' 
                                            ? (row[k] as number).toLocaleString()
                                            : String(row[k] ?? "")}
                                    </td>
                                ))}

                                {hasPayments && (
                                    <td className="px-4 py-2 whitespace-nowrap border-b">
                                        {isPayment ? (
                                            <select aria-label="Spending Category"
                                                    className="border rounded p-1 text-sm"
                                                    disabled={isSaving}
                                                    value={envelopeByTransId[id] ?? ""}
                                                    onChange={(e) => onEnvelopeChange?.(id, e.target.value || null)}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {envelopes.map((env) => (
                                                        <option key={env.id} value={env.id}>{env.name}</option>
                                                    ))}
                                            </select>
                                            ) : (
                                            <span aria-hidden>-</span>
                                        )}
                                    </td>
                                )} 

                                <td className="px-4 py-2 whitespace-nowrap border-b">
                                    <input aria-label={`notes for row ${i + 1}`}
                                            placeholder="Jot note..."
                                            className="w-56 border rounded p-1 text-sm"
                                            value={notesById[id] ?? ""}
                                            onChange={(e) => onNotesChange(id, e.target.value)}
                                            disabled={isSaving}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
