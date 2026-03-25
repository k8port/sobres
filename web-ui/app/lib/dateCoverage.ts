export interface DateCoverageResult {
    percent: number;
    gaps: Array<{ start: string; end: string }>;
    complete: boolean;
    windowStart: string;
    windowEnd: string;
}

export interface CoverageRange {
    start: string;
    end: string;
}

export interface CoverageWindowInput {
    dates: string[];
    statementRanges?: CoverageRange[];
    windowStart: string;
    windowEnd: string;
}

/**
 * Given an array of transaction date strings (YYYY-MM-DD),
 * compute coverage for the latest fully-completed 12-month statement window
 * and identify uncovered date ranges (gaps).
 */
export function computeDateCoverage(dates: string[], statementRanges: CoverageRange[] = []): DateCoverageResult {
    const now = new Date();
    const statementCycleStartDay = 8;
    const { windowStartDate, windowEndDate } = getCoverageWindow(now, statementCycleStartDay);
    return computeCoverageForWindow({
        dates,
        statementRanges,
        windowStart: formatDate(windowStartDate),
        windowEnd: formatDate(windowEndDate),
    });
}

export function computeCoverageForWindow({
    dates,
    statementRanges = [],
    windowStart,
    windowEnd,
}: CoverageWindowInput): DateCoverageResult {
    const windowStartDate = new Date(windowStart + 'T00:00:00');
    const windowEndDate = new Date(windowEnd + 'T00:00:00');
    const totalDays = Math.round((windowEndDate.getTime() - windowStartDate.getTime()) / 86400000) + 1;

    // Build a Set of day offsets (0-based) that have transactions inside the rolling window.
    const coveredDays = new Set<number>();
    for (const d of dates) {
        const parsed = new Date(d + 'T00:00:00');
        const dayIndex = Math.round((parsed.getTime() - windowStartDate.getTime()) / 86400000);
        if (dayIndex >= 0 && dayIndex < totalDays) {
            coveredDays.add(dayIndex);
        }
    }

    if (statementRanges.length > 0) {
        coveredDays.clear();
        for (const range of statementRanges) {
            const start = new Date(range.start + 'T00:00:00');
            const end = new Date(range.end + 'T00:00:00');
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

            const clampedStart = new Date(Math.max(start.getTime(), windowStartDate.getTime()));
            const clampedEnd = new Date(Math.min(end.getTime(), windowEndDate.getTime()));
            if (clampedStart > clampedEnd) continue;

            const startIndex = Math.round((clampedStart.getTime() - windowStartDate.getTime()) / 86400000);
            const endIndex = Math.round((clampedEnd.getTime() - windowStartDate.getTime()) / 86400000);
            for (let i = startIndex; i <= endIndex; i++) {
                coveredDays.add(i);
            }
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
                    start: formatDayIndex(windowStartDate, gapStart),
                    end: formatDayIndex(windowStartDate, i - 1),
                });
                gapStart = null;
            }
        }
    }
    // Close trailing gap
    if (gapStart !== null) {
        gaps.push({
            start: formatDayIndex(windowStartDate, gapStart),
            end: formatDayIndex(windowStartDate, totalDays - 1),
        });
    }

    return {
        percent,
        gaps,
        complete: gaps.length === 0,
        windowStart,
        windowEnd,
    };
}

function getCoverageWindow(now: Date, statementCycleStartDay: number): {
    windowStartDate: Date;
    windowEndDate: Date;
} {
    // Determine current statement cycle start, then back up one day to get the latest fully closed cycle end.
    const currentCycleStart = new Date(now.getFullYear(), now.getMonth(), statementCycleStartDay);
    if (now.getDate() < statementCycleStartDay) {
        currentCycleStart.setMonth(currentCycleStart.getMonth() - 1);
    }

    const windowEndDate = new Date(currentCycleStart);
    windowEndDate.setDate(windowEndDate.getDate() - 1);

    const windowStartDate = new Date(currentCycleStart);
    windowStartDate.setFullYear(windowStartDate.getFullYear() - 1);

    return { windowStartDate, windowEndDate };
}

function formatDayIndex(yearStart: Date, dayIndex: number): string {
    const d = new Date(yearStart.getTime() + dayIndex * 86400000);
    return formatDate(d);
}

function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

/**
 * Split a contiguous gap into individual statement-cycle periods.
 * Statement cycles run from the 8th of month M to the 7th of month M+1.
 */
export function splitGapIntoStatementPeriods(
    gap: { start: string; end: string }
): Array<{ start: string; end: string }> {
    const periods: Array<{ start: string; end: string }> = [];
    let cursor = new Date(gap.start + 'T00:00:00');
    const endDate = new Date(gap.end + 'T00:00:00');

    while (cursor <= endDate) {
        // Each period: from cursor (8th of month M) to 7th of month M+1
        const periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 7);
        const actualEnd = periodEnd <= endDate ? periodEnd : endDate;

        periods.push({
            start: formatDate(cursor),
            end: formatDate(actualEnd),
        });

        // Next period starts the day after periodEnd
        cursor = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 8);
    }

    return periods;
}
