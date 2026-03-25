// __tests__/unit/ui/OnboardingPrompt.spec.tsx

import { render, screen } from '@testing-library/react';
import OnboardingPrompt from '@/app/ui/OnboardingPrompt';
import { it, expect, vi, beforeAll, afterAll, describe } from 'vitest';

beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T00:00:00Z'));
});
afterAll(() => {
    vi.useRealTimers();
});

describe('progress bar basics', () => {
    it('returns null when full year is covered by statement ranges', () => {
        const ranges = [
            { start: '2025-03-08', end: '2025-04-07' },
            { start: '2025-04-08', end: '2025-05-07' },
            { start: '2025-05-08', end: '2025-06-07' },
            { start: '2025-06-08', end: '2025-07-07' },
            { start: '2025-07-08', end: '2025-08-07' },
            { start: '2025-08-08', end: '2025-09-07' },
            { start: '2025-09-08', end: '2025-10-07' },
            { start: '2025-10-08', end: '2025-11-07' },
            { start: '2025-11-08', end: '2025-12-07' },
            { start: '2025-12-08', end: '2026-01-07' },
            { start: '2026-01-08', end: '2026-02-07' },
            { start: '2026-02-08', end: '2026-03-07' },
        ];
        const { container } = render(<OnboardingPrompt statementRanges={ranges} />);
        expect(container.innerHTML).toBe('');
    });

    it('shows 0% progress when no statement ranges exist', () => {
        render(<OnboardingPrompt statementRanges={[]} />);

        const bar = screen.getByRole('progressbar');
        expect(bar.getAttribute('title')).toBe('0% complete');
    });
});

describe('before any uploads (no ranges)', () => {
    it('shows coverage window range text instead of missing periods list', () => {
        render(<OnboardingPrompt statementRanges={[]} />);

        // Should show the full window range
        expect(
            screen.getByText(/upload.*statements.*covering.*March 8, 2025.*March 7, 2026/i)
        ).toBeDefined();

        // Should NOT show any missing period list items
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
});

describe('after uploads (has ranges) — missing periods shown', () => {
    it('shows 11 individual missing statement periods when only Mar 8-Apr 7 is covered', () => {
        render(<OnboardingPrompt statementRanges={[{ start: '2025-03-08', end: '2025-04-07' }]} />);

        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(11);
        expect(items[0].textContent).toContain('2025-04-08');
        expect(items[0].textContent).toContain('2025-05-07');
        expect(items[10].textContent).toContain('2026-02-08');
        expect(items[10].textContent).toContain('2026-03-07');
    });

    it('lists 9 missing statement periods when Dec-Feb ranges cover only 3 months', () => {
        render(
            <OnboardingPrompt
                statementRanges={[
                    { start: '2025-12-08', end: '2026-01-07' },
                    { start: '2026-01-08', end: '2026-02-07' },
                    { start: '2026-02-08', end: '2026-03-07' },
                ]}
            />
        );

        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(9);

        expect(items[0].textContent).toContain('2025-03-08');
        expect(items[0].textContent).toContain('2025-04-07');

        expect(items[8].textContent).toContain('2025-11-08');
        expect(items[8].textContent).toContain('2025-12-07');
    });

    it('lists specific 9 missing periods matching the user scenario (Jan/Feb/Mar 2026 uploaded)', () => {
        render(
            <OnboardingPrompt
                statementRanges={[
                    { start: '2025-12-08', end: '2026-01-07' },
                    { start: '2026-01-08', end: '2026-02-07' },
                    { start: '2026-02-08', end: '2026-03-07' },
                ]}
            />
        );

        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(9);

        const expectedPeriods = [
            { start: '2025-03-08', end: '2025-04-07' },
            { start: '2025-04-08', end: '2025-05-07' },
            { start: '2025-05-08', end: '2025-06-07' },
            { start: '2025-06-08', end: '2025-07-07' },
            { start: '2025-07-08', end: '2025-08-07' },
            { start: '2025-08-08', end: '2025-09-07' },
            { start: '2025-09-08', end: '2025-10-07' },
            { start: '2025-10-08', end: '2025-11-07' },
            { start: '2025-11-08', end: '2025-12-07' },
        ];
        expectedPeriods.forEach((period, i) => {
            expect(items[i].textContent).toContain(period.start);
            expect(items[i].textContent).toContain(period.end);
        });
    });
});
