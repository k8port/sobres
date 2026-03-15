import React from 'react';
import type { SpendingCategory } from '@/app/lib/types';

type Row = Record<string, unknown>;

export interface TransactionsTableProps {
    rows: Row[];
    notesById: Record<string | number, string>;
    isSaving: boolean;
    onNotesChange: (id: string | number, value: string) => void;

    envelopes?: SpendingCategory[];
    envelopeByTransId?: Record<string | number, string | null>;
    onEnvelopeChange?: (transId: string | number, envelopeId: string | null) => void;
    onDeleteTransaction?: (transId: string | number) => void | Promise<void>;
    onSaveRow?: (transId: string | number) => void | Promise<void>;
    showUploadIdColumn?: boolean;
    showCompositeKeyColumn?: boolean;
}

export default function TransactionsTable({
    rows,
    notesById,
    isSaving,
    onNotesChange,
    envelopes = [],
    envelopeByTransId = {},
    onEnvelopeChange,
    onDeleteTransaction,
    onSaveRow,
    showUploadIdColumn = false,
    showCompositeKeyColumn = false,
}: TransactionsTableProps) {
    if (!rows?.length) return null;

    let keyCounter = 0;

    function getUploadKey(counter: number) {
        return `${counter}_upload`;
    }

    const uploadIdKey = getUploadKey(keyCounter);

    // collect keys across all rows
    const keySet = new Set<string>();
    for (const r of rows) {
        for (const k of Object.keys(r ?? {})) {
            if (k && k !== uploadIdKey) keySet.add(k);
        }
    }
    console.log('rows', rows);

    const preferredOrder = ['id', 'date', 'payee', 'description', 'amount', 'cat', 'envelopeId'];
    const remaining = [...keySet].filter(k => !preferredOrder.includes(k)).sort();

    const baseKeys = [...preferredOrder.filter(k => keySet.has(k)), ...remaining];
    console.log('base keys: ', baseKeys);
    const showUploadId = rows.some(r => {
        const id = getUploadKey(++keyCounter);
        const v = r[id];
        return v != null && String(r[id]).trim() !== '';
    });
    const hasPayments = rows.some(r => String(r.cat ?? '') === 'payments');
    const showActions = typeof onDeleteTransaction === 'function';

    return (
        <div className="mt-10 w-full max-w-4xl bg-white shadow rounded p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Transactions</h2>
            <table className="min-w-full text-sm text-left text-gray-700 divide-y divide-gray-200">
                <thead className="bg-gray-200">
                    <tr>
                        {baseKeys.map(key => (
                            <th key={`col-${key}`} className="px-4 py-2 text-xs border-b">
                                {key}
                            </th>
                        ))}

                        {showUploadId && (
                            <th className="px-4 py-2 whitespace-nowrap border-b">uploadId</th>
                        )}

                        {showCompositeKeyColumn && (
                            <th className="px-4 py-2 whitespace-nowrap border-b">compositeKey</th>
                        )}

                        {hasPayments && (
                            <th className="px-4 py-2 text-xs border-b">
                                Envelope Spending Category
                            </th>
                        )}

                        {showActions && <th className="px-4 py-2 text-xs border-b">Remove</th>}

                        <th className="px-4 py-2 text-xs border-b">Jot a note</th>
                        <th className="px-4 py-2 text-xs border-b">Save</th>
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row, i) => {
                        const isPayment = String(row.cat ?? '') === 'payments';
                        const rowId = row.id as string | number | undefined;
                        console.log('---', row.Id);
                        const uploadId = row.uploadId ? String(row.uploadId) : '';
                        // Use composite key to ensure uniqueness across multiple uploads
                        const compositeKey =
                            rowId != null
                                ? uploadId
                                    ? `${uploadId}-${String(rowId)}`
                                    : String(rowId)
                                : String(i);

                        console.log('compositeKey', compositeKey);

                        return (
                            <tr key={compositeKey} className="even:bg-gray-50">
                                {baseKeys.map(k => (
                                    <td
                                        key={`cell-${compositeKey}-${k}`}
                                        className="px-4 py-2 whitespace-nowrap border-b"
                                    >
                                        {typeof row[k] === 'number'
                                            ? (row[k] as number).toLocaleString()
                                            : String(row[k] ?? '')}
                                    </td>
                                ))}

                                {showUploadId && (
                                    <td className="px-4 py-2 whitespace-nowrap border-b">
                                        {String(row[uploadIdKey] ?? '')}
                                    </td>
                                )}

                                {showCompositeKeyColumn && (
                                    <td className="px-4 py-2 whitespace-nowrap border-b text-xs text-gray-600">
                                        {compositeKey}
                                    </td>
                                )}

                                {hasPayments && (
                                    <td className="px-4 py-2 whitespace-nowrap border-b">
                                        {isPayment ? (
                                            <select
                                                aria-label="Spending Category"
                                                className="border rounded p-1 text-sm"
                                                disabled={isSaving}
                                                value={rowId != null ? (envelopeByTransId[rowId] ?? '') : ''}
                                                onChange={e =>
                                                    onEnvelopeChange?.(
                                                        rowId as string | number,
                                                        e.target.value || null
                                                    )
                                                }
                                            >
                                                <option value="">Unassigned</option>
                                                {envelopes.map(env => (
                                                    <option
                                                        key={`${compositeKey}-${env.id}`}
                                                        value={env.id}
                                                    >
                                                        {env.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span aria-hidden>-</span>
                                        )}
                                    </td>
                                )}

                                {showActions && (
                                    <td className="px-4 py-2 whitespace-nowrap border-b">
                                        {typeof rowId === 'string' || typeof rowId === 'number' ? (
                                            <button
                                                type="button"
                                                className="text-sm text-yellowjasmine font-bold bg-duckblue py-1 px-2 mx-3 rounded-full border-[0.5] border-albescentwhite cursor-pointer"
                                                onClick={() =>
                                                    onDeleteTransaction?.(rowId as string | number)
                                                }
                                                disabled={isSaving}
                                                aria-label={`delete transaction ${String(rowId)}`}
                                            >
                                                x
                                            </button>
                                        ) : (
                                            <span aria-hidden>-</span>
                                        )}
                                    </td>
                                )}

                                <td className="px-4 py-2 whitespace-nowrap border-b">
                                    <input
                                        aria-label={`notes for row ${i + 1}`}
                                        placeholder="Jot note..."
                                        className="w-56 border rounded p-1 text-sm"
                                        value={rowId != null ? (notesById[rowId] ?? '') : ''}
                                        onChange={e => rowId != null && onNotesChange(rowId, e.target.value)}
                                        disabled={isSaving}
                                    />
                                </td>

                                <td className="px-4 py-2 whitespace-nowrap border-b">
                                    <button
                                        type="button"
                                        onClick={() => rowId != null && onSaveRow?.(rowId)}
                                        disabled={isSaving}
                                    >
                                        Save
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
