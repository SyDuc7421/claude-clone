"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type User = {
    id: string;
    name: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let initialUser: User | null = null;
        const storedUser = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
        if (storedUser) {
            try {
                initialUser = JSON.parse(storedUser);
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(initialUser);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Basic route protection
        if (!isLoading) {
            const isAuthRoute = pathname === "/login" || pathname === "/register";
            if (!user && !isAuthRoute) {
                router.replace("/login");
            } else if (user && isAuthRoute) {
                router.replace("/");
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem("auth_user", JSON.stringify(newUser));
        router.push("/");
    };

    const logout = async () => {
        try {
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
        } catch (e) {
            console.error('Logout error', e);
        }
        setUser(null);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
