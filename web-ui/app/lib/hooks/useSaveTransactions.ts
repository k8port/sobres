// /app/lib/hooks/useSaveTransactions.ts

import { useState, useCallback } from "react";
import { saveTransactions } from '@/app/api/transactions/service';

export function useSaveTransactions(rowsFromHook: unknown[]) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const save = useCallback(async (rowsOverride?: unknown[]) => {
        const payload = rowsOverride ?? rowsFromHook ?? [];
        
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);

        try {
            const result = await saveTransactions(payload);
            const saved = result?.count ?? payload.length;
            setSaveSuccess(`Saved ${saved} transactions to database`);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Failed to save transactions");
        } finally {
            setIsSaving(false);
        }
    }, [rowsFromHook]);

    return { isSaving, saveError, saveSuccess, save };
}