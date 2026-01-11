// /app/lib/formatting.ts

export function formatCurrency(amount: number) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
}