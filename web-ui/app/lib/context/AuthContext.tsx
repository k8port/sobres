'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AuthUser { id: string; name: string; }
interface AuthContextValue { user: AuthUser | null; isLoadingAuth: boolean; }

const AuthContext = createContext<AuthContextValue>({ user: null, isLoadingAuth: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoadingAuth, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => { setUser(data); setLoading(false); })
            .catch(() => { setUser(null); setLoading(false); });
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoadingAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext);