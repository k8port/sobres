import { computeDateCoverage, splitGapIntoStatementPeriods } from '@/app/lib/dateCoverage';
import type { StatementRange } from '@/app/lib/statementCoverage';

function formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function OnboardingPrompt({
    statementRanges = [],
}: {
    statementRanges?: StatementRange[];
}) {
    const { percent, gaps, complete, windowStart, windowEnd } = computeDateCoverage(
        [],
        statementRanges
    );

    if (complete) return null;

    const hasUploads = statementRanges.length > 0;
    const missingPeriods = hasUploads ? gaps.flatMap(g => splitGapIntoStatementPeriods(g)) : [];

    return (
        <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-bold text-rosewhite">
                {hasUploads
                    ? 'Upload primary account statements covering the last 12 months.'
                    : `Upload statements covering the period from ${formatDate(windowStart)} to ${formatDate(windowEnd)}.`}
            </p>
            <progress
                title={`${percent}% complete`}
                role="progressbar"
                value={percent}
                max={100}
                className="progress-themed w-64 h-3 rounded-full overflow-hidden"
            />
            {missingPeriods.length > 0 && (
                <ul className="text-sm text-lightyellow font-bold font-inter list-disc list-inside">
                    {missingPeriods.map((p, i) => (
                        <li key={i}>
                            Missing: {p.start} to {p.end}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
