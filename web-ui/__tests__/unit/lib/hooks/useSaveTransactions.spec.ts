// /__tests__/unit/lib/hooks/useSaveTransactions.spec.ts

import { renderHook, act } from "@testing-library/react";
import { useSaveTransactions } from "@/app/lib/hooks/useSaveTransactions";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as transactionService from "@/app/api/transactions/service";

const rowsMock = [{ id: 1, amount: 100 }];

beforeEach(() => {
    try { window.localStorage.clear(); } catch {}
});

it('sets successful save message', async () => {
    const saveSpy = vi.spyOn(transactionService, 'saveTransactions' as any).mockResolvedValue({ count: 1 }); 

    const { result } = renderHook(() => useSaveTransactions(rowsMock));

    await act(async () => {
        await result.current.save();
    });

    expect(saveSpy).toHaveBeenCalledWith(rowsMock);

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toMatch(/Saved 1 transactions/i);
    expect(result.current.saveError).toBeNull();
});


it('sets error message', async () => {
    const saveSpy = vi.spyOn(transactionService, 'saveTransactions' as any).mockResolvedValue({ count: 1 }); 

    const { result } = renderHook(() => useSaveTransactions(rowsMock));

    await act(async () => {
        await result.current.save();
    });

    expect(saveSpy).toHaveBeenCalledWith(rowsMock);

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toMatch(/Saved 1 transactions/i);
    expect(result.current.saveError).toBeNull();
});

it('save error sets error message', async () => {
    const saveSpy = vi.spyOn(transactionService, 'saveTransactions').mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useSaveTransactions(rowsMock));

    await act(async () => {
        await result.current.save();
    });

    expect(saveSpy).toHaveBeenCalledWith(rowsMock);

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBeNull();
    expect(result.current.saveError).toBe('Save failed');
});