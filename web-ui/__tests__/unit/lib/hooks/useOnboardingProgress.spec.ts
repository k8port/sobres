import { describe, test, expect, beforeAll, afterAll, vi} from 'vitest';
import { useOnboardingProgress } from '@/app/lib/hooks/useOnboardingProgress';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

describe('useOnboardingProgress to count months of statements', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T00:00:00Z'));
    })
    afterAll(() => {
        vi.useRealTimers();
    });

    test('computes previous calendar year and establishes starting point for onboarding progress (0/12)', () => {
        const { result } = renderHook(() => useOnboardingProgress({ primaryAccountId: 'acct-1' }));
        expect(result.current.uploadedMonths).toBe(0);
        expect(result.current.coveredMonths.size).toBe(0);
        expect(result.current.percent).toBe(0);
    });
    
    test('counts month in which statement period falls within previous calendar year', () => {
        const { result } = renderHook(() => useOnboardingProgress({ primaryAccountId: 'acct-1' }));

        // add Dec 23-Feb 24 as Jan 2024 + Feb 2024
        act(() => {
            result.current.addStatement({
                accountId: 'acct-1',
                periodStart: new Date('2023-12-15'),
                periodEnd: new Date('2024-02-04'),
                text: 'RAW-DEC23-FEB24',
            });
        });
        expect(result.current.uploadedMonths).toBe(2);
        expect(result.current.percent).toBe(17);
        expect(result.current.coveredMonths.has('2024-01')).toBe(true);
        expect(result.current.coveredMonths.has('2024-02')).toBe(true);
    });

    test('edge overlaps contribute to months within previous calendar year only', () => {
        const { result } = renderHook(() => useOnboardingProgress({ primaryAccountId: 'acct-1' }));

        // Statement spanning Dec 2024 - Jan 2025 only counts DEC 2024
        act(() => {
            result.current.addStatement({
                accountId: 'acct-1',
                periodStart: new Date('2024-12-05'),
                periodEnd: new Date('2025-01-04'),
                text: 'RAW-DEC24-JAN25',
            });
        });
        expect(result.current.uploadedMonths).toBe(1);
        expect(result.current.coveredMonths.has('2024-12')).toBe(true);
        expect(result.current.coveredMonths.has('2025-01')).toBe(false);

        act(() => {
            result.current.addStatement({
                accountId: 'acct-1',
                periodStart: new Date('2023-12-15'),
                periodEnd: new Date('2024-01-04'),
                text: 'RAW-DEC23-JAN24',
            });
        });
        expect(result.current.uploadedMonths).toBe(2);
        expect(result.current.coveredMonths.has('2024-01')).toBe(true);
    });

    test('does not duplicate months for same account statement and completes at 12 months of spanned progress', () => {
        const { result } = renderHook(() => useOnboardingProgress({ primaryAccountId: 'acct-1' }));

        const months = [
            '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
            '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
        ];

        for (const ym of months) {
            const [year, month] = ym.split('-').map(Number);
            act(() => {
                result.current.addStatement({
                    accountId: 'acct-1',
                    periodStart: new Date(year, month - 1, 1),
                    periodEnd: new Date(year, month, 0),
                    text: `RAW-${ym}`,
                });
            });
        }
        expect(result.current.uploadedMonths).toBe(12);
        expect(result.current.percent).toBe(100);
    });
});