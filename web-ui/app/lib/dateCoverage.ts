export interface DateCoverageResult {
    percent: number;
    gaps: Array<{ start: string; end: string }>;
    complete: boolean;
}

/**
 * Given an array of transaction date strings (YYYY-MM-DD),
 * compute how much of the previous calendar year is covered
 * and identify uncovered date ranges (gaps).
 */
export function computeDateCoverage(dates: string[]): DateCoverageResult {
    const now = new Date();
    const prevYear = now.getFullYear() - 1;
    const yearStart = new Date(prevYear, 0, 1);   // Jan 1
    const yearEnd = new Date(prevYear, 11, 31);    // Dec 31
    const totalDays = Math.round((yearEnd.getTime() - yearStart.getTime()) / 86400000) + 1;

    // Build a Set of day-of-year indices (0-based) that have transactions
    const coveredDays = new Set<number>();
    for (const d of dates) {
        const parsed = new Date(d + 'T00:00:00');
        if (parsed.getFullYear() !== prevYear) continue;
        const dayIndex = Math.round((parsed.getTime() - yearStart.getTime()) / 86400000);
        if (dayIndex >= 0 && dayIndex < totalDays) {
            coveredDays.add(dayIndex);
        }
    }

    const percent = coveredDays.size === 0
        ? 0
        : Math.round((coveredDays.size / totalDays) * 100);

    // Find contiguous gaps
    const gaps: Array<{ start: string; end: string }> = [];
    let gapStart: number | null = null;

    for (let i = 0; i < totalDays; i++) {
        if (!coveredDays.has(i)) {
            if (gapStart === null) gapStart = i;
        } else {
            if (gapStart !== null) {
                gaps.push({
                    start: formatDayIndex(yearStart, gapStart),
                    end: formatDayIndex(yearStart, i - 1),
                });
                gapStart = null;
            }
        }
    }
    // Close trailing gap
    if (gapStart !== null) {
        gaps.push({
            start: formatDayIndex(yearStart, gapStart),
            end: formatDayIndex(yearStart, totalDays - 1),
        });
    }

    return { percent, gaps, complete: gaps.length === 0 };
}

function formatDayIndex(yearStart: Date, dayIndex: number): string {
    const d = new Date(yearStart.getTime() + dayIndex * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}
