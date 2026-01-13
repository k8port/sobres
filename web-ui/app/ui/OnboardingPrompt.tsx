// __tests__/integration/onboarding-flow.integration.spec.tsx

import React from 'react';

export default function OnboardingPrompt({
    uploadedMonths,
    prevCalendarYear,
    percent,
}: {
    uploadedMonths: number;
    prevCalendarYear: number;
    percent: number;
}) {
    const total = 12;
    percent = percent || Math.min(100, Math.round((uploadedMonths / total) * 100));
    if (uploadedMonths >= total) return null;

    return (
        <div className="flex flex-col items-center gap-4">
            <p data-testid="onboarding-prompt" className="text-white font-inter">
                Begin by uploading all primary bank account statements from <strong> {prevCalendarYear} </strong>.
            </p>
            <progress
                title={`${percent}% complete`}
                role="progressbar"
                value={percent}
                max={100}
                className="w-64"
            />
        </div>
    );
}