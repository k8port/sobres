import { useState } from 'react';

type AddStatementArgs = {
    accountId: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    text: string;
}

export function useOnboardingProgress({ primaryAccountId }: { primaryAccountId: string }) {
    const now = new Date();
    const prevCalendarYear = now.getFullYear() - 1;
    const requiredMonths = 12;

    const [coveredMonths, setCoveredMonths] = useState<Set<string>>(new Set());
    const [rawText, setRawText] = useState<string[]>([]);

    const addStatement = ({ accountId, periodStart, periodEnd, text }: AddStatementArgs) => {
        if (accountId !== primaryAccountId) return;
        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        // map any overlapping period to month keys withing previous calendar year
        const months: string[] = [];
        const cursor = new Date(start);
        cursor.setDate(1);
        while (cursor <= end) {
            const year = cursor.getFullYear();
            const month = String(cursor.getMonth() + 1).padStart(2, '0');
            if (year === prevCalendarYear) months.push(`${year}-${month}`);
            cursor.setMonth(cursor.getMonth() + 1);
        }

        setCoveredMonths(prev => {
            const next = new Set(prev);
            for (const m of months) next.add(m);
            return next;
        });

        // store raw text for later
        setRawText(prev => [...prev, text]);
    };
    const uploadedMonths = coveredMonths.size;
    const percent = Math.round((uploadedMonths / requiredMonths) * 100);
    const status = uploadedMonths >= requiredMonths ? 'COMPLETE' : 'isOnboarding';

    return { prevCalendarYear, requiredMonths, uploadedMonths, percent, status, addStatement, coveredMonths, rawText };
}