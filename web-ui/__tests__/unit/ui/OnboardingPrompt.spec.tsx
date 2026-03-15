// __tests__/unit/ui/OnboardingPrompt.spec.tsx

import { render, screen } from '@testing-library/react';
import OnboardingPrompt from '@/app/ui/OnboardingPrompt';
import { it, expect, vi, beforeAll, afterAll } from 'vitest';

beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T00:00:00Z'));
});
afterAll(() => {
    vi.useRealTimers();
});

it('displays progress bar with subtitle when dates have partial coverage', () => {
    // Only January 2025 dates → partial coverage
    const dates: string[] = [];
    for (let d = 1; d <= 31; d++) {
        dates.push(`2025-01-${String(d).padStart(2, '0')}`);
    }
    render(<OnboardingPrompt dates={dates} />);

    expect(screen.getByRole('progressbar')).toBeDefined();
    expect(screen.getByText(/upload primary account statements/i)).toBeDefined();
});

it('shows uncovered date ranges as gap messages', () => {
    // Only January 2025 → gap from Feb 1 - Dec 31
    const dates: string[] = [];
    for (let d = 1; d <= 31; d++) {
        dates.push(`2025-01-${String(d).padStart(2, '0')}`);
    }
    render(<OnboardingPrompt dates={dates} />);

    expect(screen.getByText(/2025-02-01/)).toBeDefined();
    expect(screen.getByText(/2025-12-31/)).toBeDefined();
});

it('returns null when full year is covered', () => {
    const dates: string[] = [];
    for (let m = 1; m <= 12; m++) {
        const daysInMonth = new Date(2025, m, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            dates.push(`2025-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
    }
    const { container } = render(<OnboardingPrompt dates={dates} />);
    expect(container.innerHTML).toBe('');
});
