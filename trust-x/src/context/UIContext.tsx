"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

type Theme = "light" | "dark";

interface UIContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tx_theme") as Theme | null;
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("tx_theme", next);
      } catch (e) {}
      console.log("Theme toggled to", next);
      return next;
    });
  };

  return (
    <UIContext.Provider value={{ theme, toggleTheme }}>{children}</UIContext.Provider>
  );
}

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUIContext must be used within a UIProvider");
  return ctx;
}
