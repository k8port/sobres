import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { computeDateCoverage, splitGapIntoStatementPeriods } from '@/app/lib/dateCoverage';

describe('computeDateCoverage', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-10T00:00:00Z'));
    });
    afterAll(() => {
        vi.useRealTimers();
    });

    it('returns 0% and full rolling-window gap when no transactions exist', () => {
        const result = computeDateCoverage([]);
        expect(result.percent).toBe(0);
        expect(result.windowStart).toBe('2025-03-08');
        expect(result.windowEnd).toBe('2026-03-07');
        expect(result.gaps).toEqual([{ start: '2025-03-08', end: '2026-03-07' }]);
        expect(result.complete).toBe(false);
    });

    it('returns 100% when transactions span every day in the rolling statement window', () => {
        const dates: string[] = [];
        let cursor = new Date('2025-03-08T00:00:00Z');
        const end = new Date('2026-03-07T00:00:00Z');
        while (cursor <= end) {
            const y = cursor.getUTCFullYear();
            const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
            const d = String(cursor.getUTCDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        const result = computeDateCoverage(dates);
        expect(result.percent).toBe(100);
        expect(result.gaps).toEqual([]);
        expect(result.complete).toBe(true);
    });

    it('calculates partial coverage with correct gaps in the rolling statement window', () => {
        // Only March statement month coverage window start: 2025-03-08..2025-04-07
        const dates: string[] = [];
        for (let d = 8; d <= 31; d++) {
            dates.push(`2025-03-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 7; d++) {
            dates.push(`2025-04-${String(d).padStart(2, '0')}`);
        }

        const result = computeDateCoverage(dates);
        // 31 days out of 365 = ~8%
        expect(result.percent).toBeGreaterThanOrEqual(8);
        expect(result.percent).toBeLessThanOrEqual(9);
        expect(result.complete).toBe(false);
        // Gap should start after first covered statement period.
        expect(result.gaps.length).toBe(1);
        expect(result.gaps[0].start).toBe('2025-04-08');
        expect(result.gaps[0].end).toBe('2026-03-07');
    });

    it('identifies a gap in the middle of the rolling window', () => {
        // Cover first and third statement months but miss the second.
        const dates: string[] = [];
        for (let d = 8; d <= 31; d++) {
            dates.push(`2025-03-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 7; d++) {
            dates.push(`2025-04-${String(d).padStart(2, '0')}`);
        }

        for (let d = 8; d <= 31; d++) {
            dates.push(`2025-05-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 7; d++) {
            dates.push(`2025-06-${String(d).padStart(2, '0')}`);
        }

        let cursor = new Date('2025-06-08T00:00:00Z');
        const end = new Date('2026-03-07T00:00:00Z');
        while (cursor <= end) {
            const y = cursor.getUTCFullYear();
            const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
            const d = String(cursor.getUTCDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        const result = computeDateCoverage(dates);
        expect(result.gaps).toEqual([{ start: '2025-04-08', end: '2025-05-07' }]);
        // 365 - 30 = 335 covered days => ~92%
        expect(result.percent).toBeGreaterThanOrEqual(92);
        expect(result.complete).toBe(false);
    });

    it('ignores transaction dates outside the rolling statement window', () => {
        // Only out-of-window dates: before 2025-03-08 and after 2026-03-07
        const dates = ['2025-03-07', '2026-03-08'];
        const result = computeDateCoverage(dates);
        expect(result.percent).toBe(0);
        expect(result.gaps).toEqual([{ start: '2025-03-08', end: '2026-03-07' }]);
    });

    it('handles multiple gaps correctly', () => {
        // Only first and last statement months are covered in the window.
        const dates: string[] = [];
        for (let d = 8; d <= 31; d++) {
            dates.push(`2025-03-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 7; d++) {
            dates.push(`2025-04-${String(d).padStart(2, '0')}`);
        }

        for (let d = 8; d <= 28; d++) {
            dates.push(`2026-02-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 7; d++) {
            dates.push(`2026-03-${String(d).padStart(2, '0')}`);
        }

        const result = computeDateCoverage(dates);
        expect(result.gaps).toEqual([{ start: '2025-04-08', end: '2026-02-07' }]);
        expect(result.complete).toBe(false);
    });

    it('uses statement coverage ranges rather than individual transaction days when ranges are provided', () => {
        // Sparse transaction days in statement month, but full statement period is known.
        const dates = ['2025-03-10', '2025-03-24'];
        const result = computeDateCoverage(dates, [
            { start: '2025-03-08', end: '2025-04-07' },
        ]);

        expect(result.percent).toBeGreaterThanOrEqual(8);
        expect(result.percent).toBeLessThanOrEqual(9);
        expect(result.gaps).toEqual([{ start: '2025-04-08', end: '2026-03-07' }]);
    });

    it('reports March-December as missing when uploads only cover Dec-to-Mar statement cycles', () => {
        const result = computeDateCoverage([], [
            { start: '2025-12-08', end: '2026-01-07' },
            { start: '2026-01-08', end: '2026-02-07' },
            { start: '2026-02-08', end: '2026-03-07' },
        ]);

        expect(result.percent).toBeGreaterThanOrEqual(24);
        expect(result.percent).toBeLessThanOrEqual(27);
        expect(result.gaps).toEqual([{ start: '2025-03-08', end: '2025-12-07' }]);
    });
});

describe('splitGapIntoStatementPeriods', () => {
    it('splits a 9-month gap into 9 individual statement periods', () => {
        const gap = { start: '2025-03-08', end: '2025-12-07' };
        const periods = splitGapIntoStatementPeriods(gap);

        expect(periods).toHaveLength(9);
        expect(periods[0]).toEqual({ start: '2025-03-08', end: '2025-04-07' });
        expect(periods[1]).toEqual({ start: '2025-04-08', end: '2025-05-07' });
        expect(periods[8]).toEqual({ start: '2025-11-08', end: '2025-12-07' });
    });

    it('splits an 11-month gap into 11 individual statement periods', () => {
        const gap = { start: '2025-04-08', end: '2026-03-07' };
        const periods = splitGapIntoStatementPeriods(gap);

        expect(periods).toHaveLength(11);
        expect(periods[0]).toEqual({ start: '2025-04-08', end: '2025-05-07' });
        expect(periods[10]).toEqual({ start: '2026-02-08', end: '2026-03-07' });
    });

    it('returns a single period for a single-month gap', () => {
        const gap = { start: '2025-06-08', end: '2025-07-07' };
        const periods = splitGapIntoStatementPeriods(gap);

        expect(periods).toHaveLength(1);
        expect(periods[0]).toEqual({ start: '2025-06-08', end: '2025-07-07' });
    });

    it('returns empty array when gap is empty', () => {
        const gap = { start: '2025-06-08', end: '2025-06-07' };
        const periods = splitGapIntoStatementPeriods(gap);

        expect(periods).toHaveLength(0);
    });

    it('handles year boundary correctly', () => {
        const gap = { start: '2025-11-08', end: '2026-02-07' };
        const periods = splitGapIntoStatementPeriods(gap);

        expect(periods).toHaveLength(3);
        expect(periods[0]).toEqual({ start: '2025-11-08', end: '2025-12-07' });
        expect(periods[1]).toEqual({ start: '2025-12-08', end: '2026-01-07' });
        expect(periods[2]).toEqual({ start: '2026-01-08', end: '2026-02-07' });
    });
});
