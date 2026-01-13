// app/lib/transactionsCache.ts
// Minimal “shortest path to done” cache so other routes can render after an upload.
// Uses sessionStorage so it survives navigation but resets when the tab closes.

export type TransactionRow = Record<string, unknown>;

const KEY = "sobres:lastParsedRows:v1";

export function setCachedRows(rows: TransactionRow[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(rows ?? []));
  } catch {
    // ignore (private mode / storage disabled)
  }
}

export function getCachedRows(): TransactionRow[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TransactionRow[]) : [];
  } catch {
    return [];
  }
}
