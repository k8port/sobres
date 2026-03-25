export interface StatementRange {
    start: string;
    end: string;
}

const STATEMENT_CYCLE_START_DAY = 8;

function isIsoDate(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseIsoDate(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatIsoDate(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getStatementCycleRange(date: Date): StatementRange {
    const cycleStart = new Date(date.getFullYear(), date.getMonth(), STATEMENT_CYCLE_START_DAY);
    if (date.getDate() < STATEMENT_CYCLE_START_DAY) {
        cycleStart.setMonth(cycleStart.getMonth() - 1);
    }

    const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, STATEMENT_CYCLE_START_DAY - 1);
    return {
        start: formatIsoDate(cycleStart),
        end: formatIsoDate(cycleEnd),
    };
}

export function buildStatementRangesFromRows(rows: Array<Record<string, unknown>>): StatementRange[] {
    const byUpload = new Map<string, { minStart: string; maxEnd: string }>();

    for (const row of rows) {
        const uploadId = row.uploadId;
        const date = row.date;
        if (typeof uploadId !== 'string' || !isIsoDate(date)) continue;

        const cycleRange = getStatementCycleRange(parseIsoDate(date));
        const existing = byUpload.get(uploadId);
        if (!existing) {
            byUpload.set(uploadId, { minStart: cycleRange.start, maxEnd: cycleRange.end });
            continue;
        }

        byUpload.set(uploadId, {
            minStart: cycleRange.start < existing.minStart ? cycleRange.start : existing.minStart,
            maxEnd: cycleRange.end > existing.maxEnd ? cycleRange.end : existing.maxEnd,
        });
    }

    const ranges: StatementRange[] = [];
    for (const range of byUpload.values()) {
        ranges.push({ start: range.minStart, end: range.maxEnd });
    }

    ranges.sort((a, b) => a.start.localeCompare(b.start));
    return ranges;
}
