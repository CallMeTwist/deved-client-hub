// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi, type AuthUser } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); // ← export it

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // true on mount so we can hydrate from token

  // On app load, if a token exists re-fetch the user
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      authApi.getUser()
        .then(setUser)
        .catch(() => sessionStorage.removeItem('auth_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, token } = await authApi.login(email, password);
      sessionStorage.setItem('auth_token', token);
      setUser(user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}