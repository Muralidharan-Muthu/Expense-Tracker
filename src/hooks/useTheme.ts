import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

/**
 * Light/dark theme, persisted on this device. Starts as "light" so the
 * server-rendered page and the first client render match; the real saved
 * theme is read after mount (the anti-flash script in __root already
 * applied the right class to <html> before then).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("xpense-theme");
    const initial: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("xpense-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, toggle };
}
