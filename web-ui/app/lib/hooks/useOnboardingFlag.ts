import { useState, useEffect } from "react";

const KEY = 'onboardingFlag';

function getInitial(): boolean {
    if (typeof window === 'undefined') return true;

    try {
        const raw = window.localStorage.getItem(KEY);
        return raw === null ? true : raw === 'true';
    } catch {
        return true;
    }
}
export function useOnboardingFlag() {
    const [isOnboarding, setIsOnboarding] = useState<boolean>(() => getInitial());

    useEffect(() => {
        try { localStorage.setItem(KEY, String(isOnboarding)); } catch {}
    }, [isOnboarding]);

    const setOnboardingFlag = (value: boolean) => {
        setIsOnboarding(value);
    };

    return { isOnboarding, setOnboardingFlag };
}