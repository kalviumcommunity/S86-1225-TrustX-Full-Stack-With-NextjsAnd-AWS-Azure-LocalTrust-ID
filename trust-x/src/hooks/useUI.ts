import { useUIContext } from "@/context/UIContext";

export function useUI() {
  const { theme, toggleTheme } = useUIContext();

  return { theme, toggleTheme };
}
