// __tests__/unit/lib/components/OnboardingPrompt.spec.tsx

import { render, screen } from '@testing-library/react';
import OnboardingPrompt from '@/app/components/OnboardingPrompt';
import { it, expect } from 'vitest';

it("displays onboarding prompt when uploaded months is less than 12", () => {
    render(
        <OnboardingPrompt
            uploadedMonths={8}
            prevCalendarYear={2024}
            percent={75}
        />
    );

    const prompt = screen.getByTestId("onboarding-prompt");
    expect(prompt).toBeDefined();
});