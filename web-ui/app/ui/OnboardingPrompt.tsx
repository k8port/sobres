import { computeDateCoverage } from '@/app/lib/dateCoverage';

export default function OnboardingPrompt({ dates }: { dates: string[] }) {
    const { percent, gaps, complete } = computeDateCoverage(dates);

    if (complete) return null;

    return (
        <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-white">
                Upload primary account statements from the previous year.
            </p>
            <progress
                title={`${percent}% complete`}
                role="progressbar"
                value={percent}
                max={100}
                className="w-64"
            />
            {gaps.length > 0 && (
                <ul className="text-sm text-white list-disc list-inside">
                    {gaps.map((g, i) => (
                        <li key={i}>
                            Missing: {g.start} to {g.end}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
