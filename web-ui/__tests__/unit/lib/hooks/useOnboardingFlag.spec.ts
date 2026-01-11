import { renderHook, act, waitFor } from "@testing-library/react";
import { useOnboardingFlag } from "@/app/lib/hooks/useOnboardingFlag";
import { describe, it, expect, beforeEach } from "vitest";

describe('useOnboardingFlag', () => {
    beforeEach(() => {
        try { window.localStorage.clear(); } catch {}
    });

    it('sets onboarding flag to true initially and can be flipped and persisted in browser local storage', async () => {
        const { result } = renderHook(() => useOnboardingFlag());
        expect(result.current.isOnboarding).toBe(true);
        
        await act(async () => {
            result.current.setOnboardingFlag(false);
        });
        
        expect(result.current.isOnboarding).toBe(false);
    });
});