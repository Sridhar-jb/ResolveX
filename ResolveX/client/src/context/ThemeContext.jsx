import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const THEME_KEY = "resolvex.theme";
const ThemeContext = createContext(null);

const systemTheme = () =>
  window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => localStorage.getItem(THEME_KEY) || "dark");

  const resolved = preference === "system" ? systemTheme() : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem(THEME_KEY, preference);
  }, [preference, resolved]);

  useEffect(() => {
    if (preference !== "system") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setPreference("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const toggle = useCallback(() => {
    setPreference((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(
    () => ({ theme: resolved, preference, setPreference, toggle }),
    [resolved, preference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};
