import { describe, it, expect } from 'vitest';
import { buildStatementRangesFromRows } from '@/app/lib/statementCoverage';

describe('buildStatementRangesFromRows', () => {
    it('groups rows by uploadId and returns one min/max date range per statement upload', () => {
        const rows = [
            { id: 1, uploadId: 'u-1', date: '2025-03-10' },
            { id: 2, uploadId: 'u-1', date: '2025-03-25' },
            { id: 3, uploadId: 'u-2', date: '2025-04-08' },
            { id: 4, uploadId: 'u-2', date: '2025-05-06' },
            { id: 5, uploadId: 'u-2', date: 'not-a-date' },
            { id: 6, date: '2025-06-01' },
        ];

        const result = buildStatementRangesFromRows(rows as Array<Record<string, unknown>>);

        expect(result).toEqual([
            { start: '2025-03-08', end: '2025-04-07' },
            { start: '2025-04-08', end: '2025-05-07' },
        ]);
    });

    it('maps a statement with January dates to the Dec 8-Jan 7 statement cycle window', () => {
        const rows = [
            { id: 1, uploadId: 'u-jan', date: '2026-01-02' },
            { id: 2, uploadId: 'u-jan', date: '2026-01-05' },
        ];

        const result = buildStatementRangesFromRows(rows as Array<Record<string, unknown>>);
        expect(result).toEqual([{ start: '2025-12-08', end: '2026-01-07' }]);
    });
});
