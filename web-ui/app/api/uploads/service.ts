// app/api/uploads/service.ts
import type { StatementRange } from '@/app/lib/statementCoverage';

export async function fetchSavedStatementRanges(): Promise<StatementRange[]> {
    const response = await fetch('/api/uploads/ranges', { method: 'GET', cache: 'no-store' });
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data?.ranges) ? data.ranges : [];
}
