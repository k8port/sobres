import { useEffect, useState, useCallback } from "react";

const KEY = 'onboardingFlag';

function getInitial(): boolean {
    if (typeof window === 'undefined') return true;

    try {
        const raw = window.localStorage.getItem(KEY);
        return raw === 'true' ? true : raw === 'true';
    } catch {
        return true;
    }
}
export function useOnboardingFlag() {
    const [isOnboarding, setIsOnboarding] = useState(true);

    const setOnboardingFlag = (value: boolean) => {
        setIsOnboarding(value);
    };

    return { isOnboarding, setOnboardingFlag };
}