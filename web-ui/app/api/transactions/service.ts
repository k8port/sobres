// api/transactions/service.ts

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function saveTransactions(rows: Record<string, unknown>[] | unknown[]) {
    const response = await fetch(`${BACKEND_URL}/api/transactions`,{
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(rows)
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(json?.detail || json?.error || "Failed to save transactions");
    }

    return json as { count: number };
}

export type TransactionRow = {
    id: string;
    date: string;
    payee: string;
    amount: number;
    cat: 'payments' | string;
    envelopeId?: string | null;
};

export async function getTransactions(cat: string): Promise<TransactionRow[]> {
    const response = await fetch(`/api/transactions?cat=${encodeURIComponent(cat)}`, { method: 'GET' });
    if (!response.ok) throw new Error(`GET /api/transactions failed: ${response.status}`);
    return (await response.json()) as TransactionRow[];
} 

export type PatchTransactionBody = { envelopeId: string | null };

export async function patchTransaction(id: string, body: PatchTransactionBody): Promise<TransactionRow> {
    const response = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'component-type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`PATCH /api/transactions/${id} failed: ${response.status}`);
    return (await response.json()) as TransactionRow;
}