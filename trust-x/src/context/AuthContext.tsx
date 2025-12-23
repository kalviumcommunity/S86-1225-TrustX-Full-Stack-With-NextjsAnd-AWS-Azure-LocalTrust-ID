"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

interface AuthContextType {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tx_user");
      if (stored) setUser(stored);
    } catch (e) {
      // ignore (server-side or private mode)
    }
  }, []);

  const login = (username: string) => {
    setUser(username);
    try {
      localStorage.setItem("tx_user", username);
    } catch (e) {}
    console.log("User logged in:", username);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("tx_user");
    } catch (e) {}
    console.log("User logged out");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
