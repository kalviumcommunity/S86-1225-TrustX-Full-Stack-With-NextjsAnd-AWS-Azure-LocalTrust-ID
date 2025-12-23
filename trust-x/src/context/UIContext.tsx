"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

type Theme = "light" | "dark";

interface UIContextType {
  theme: Theme;
  toggleTheme: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarOpen((p) => {
      const next = !p;
      console.log(next ? "Sidebar opened" : "Sidebar closed");
      return next;
    });
  };

  return (
    <UIContext.Provider value={{ theme, toggleTheme, sidebarOpen, toggleSidebar }}>{children}</UIContext.Provider>
  );
}

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUIContext must be used within a UIProvider");
  return ctx;
}
