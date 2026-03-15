import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { computeDateCoverage } from '@/app/lib/dateCoverage';

describe('computeDateCoverage', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-10T00:00:00Z'));
    });
    afterAll(() => {
        vi.useRealTimers();
    });

    it('returns 0% and full year gap when no transactions exist', () => {
        const result = computeDateCoverage([]);
        expect(result.percent).toBe(0);
        expect(result.gaps).toEqual([{ start: '2025-01-01', end: '2025-12-31' }]);
        expect(result.complete).toBe(false);
    });

    it('returns 100% when transactions span every day of the previous year', () => {
        // Provide at least one transaction per day for all of 2025
        const dates: string[] = [];
        for (let m = 0; m < 12; m++) {
            for (let d = 1; d <= 28; d++) {
                const mm = String(m + 1).padStart(2, '0');
                const dd = String(d).padStart(2, '0');
                dates.push(`2025-${mm}-${dd}`);
            }
        }
        // Add remaining days to cover 29-31 of months
        dates.push('2025-01-29', '2025-01-30', '2025-01-31');
        dates.push('2025-03-29', '2025-03-30', '2025-03-31');
        dates.push('2025-05-29', '2025-05-30', '2025-05-31');
        dates.push('2025-07-29', '2025-07-30', '2025-07-31');
        dates.push('2025-08-29', '2025-08-30', '2025-08-31');
        dates.push('2025-10-29', '2025-10-30', '2025-10-31');
        dates.push('2025-12-29', '2025-12-30', '2025-12-31');
        dates.push('2025-04-29', '2025-04-30');
        dates.push('2025-06-29', '2025-06-30');
        dates.push('2025-09-29', '2025-09-30');
        dates.push('2025-11-29', '2025-11-30');

        const result = computeDateCoverage(dates);
        expect(result.percent).toBe(100);
        expect(result.gaps).toEqual([]);
        expect(result.complete).toBe(true);
    });

    it('calculates partial coverage with correct gaps', () => {
        // Every day of January 2025
        const dates: string[] = [];
        for (let d = 1; d <= 31; d++) {
            dates.push(`2025-01-${String(d).padStart(2, '0')}`);
        }
        const result = computeDateCoverage(dates);
        // Jan 1-31 = 31 days out of 365 = ~8%
        expect(result.percent).toBeGreaterThanOrEqual(8);
        expect(result.percent).toBeLessThanOrEqual(9);
        expect(result.complete).toBe(false);
        // Gap should start from Feb 1
        expect(result.gaps.length).toBe(1);
        expect(result.gaps[0].start).toBe('2025-02-01');
        expect(result.gaps[0].end).toBe('2025-12-31');
    });

    it('identifies a gap in the middle of the year', () => {
        // Jan + Mar covered, Feb missing
        const dates: string[] = [];
        for (let d = 1; d <= 31; d++) {
            dates.push(`2025-01-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 31; d++) {
            dates.push(`2025-03-${String(d).padStart(2, '0')}`);
        }
        // Also cover Apr-Dec to make the only gap February
        for (let m = 4; m <= 12; m++) {
            for (let d = 1; d <= 28; d++) {
                dates.push(`2025-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
            }
        }
        // fill remaining days for Apr-Dec
        dates.push('2025-04-29', '2025-04-30');
        dates.push('2025-05-29', '2025-05-30', '2025-05-31');
        dates.push('2025-06-29', '2025-06-30');
        dates.push('2025-07-29', '2025-07-30', '2025-07-31');
        dates.push('2025-08-29', '2025-08-30', '2025-08-31');
        dates.push('2025-09-29', '2025-09-30');
        dates.push('2025-10-29', '2025-10-30', '2025-10-31');
        dates.push('2025-11-29', '2025-11-30');
        dates.push('2025-12-29', '2025-12-30', '2025-12-31');

        const result = computeDateCoverage(dates);
        expect(result.gaps).toEqual([{ start: '2025-02-01', end: '2025-02-28' }]);
        // 365 - 28 = 337 covered days => ~92%
        expect(result.percent).toBeGreaterThanOrEqual(92);
        expect(result.complete).toBe(false);
    });

    it('ignores transaction dates outside the previous year', () => {
        // Only 2024 and 2026 dates — none in 2025
        const dates = ['2024-06-15', '2026-01-01'];
        const result = computeDateCoverage(dates);
        expect(result.percent).toBe(0);
        expect(result.gaps).toEqual([{ start: '2025-01-01', end: '2025-12-31' }]);
    });

    it('handles multiple gaps correctly', () => {
        // Only Jan and Dec covered
        const dates: string[] = [];
        for (let d = 1; d <= 31; d++) {
            dates.push(`2025-01-${String(d).padStart(2, '0')}`);
        }
        for (let d = 1; d <= 31; d++) {
            dates.push(`2025-12-${String(d).padStart(2, '0')}`);
        }
        const result = computeDateCoverage(dates);
        expect(result.gaps).toEqual([{ start: '2025-02-01', end: '2025-11-30' }]);
        expect(result.complete).toBe(false);
    });
});
