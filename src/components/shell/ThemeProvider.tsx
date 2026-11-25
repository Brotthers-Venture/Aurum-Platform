"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { THEME_KEY, readThemePref, resolveTheme, type ThemePref } from "@/lib/theme";

type Ctx = { pref: ThemePref; theme: "light" | "dark"; setPref: (p: ThemePref) => void };
const ThemeCtx = createContext<Ctx>({ pref: "dark", theme: "dark", setPref: () => {} });

/** Holds the user's theme preference and keeps <html data-theme> in step (including "System" changes). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("dark");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const p = readThemePref();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefState(p);
    setTheme(resolveTheme(p));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => setTheme(mq.matches ? "light" : "dark");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [pref]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    setTheme(resolveTheme(p));
    try {
      window.localStorage.setItem(THEME_KEY, p);
    } catch {
      /* storage unavailable: the choice lasts for this visit */
    }
  }, []);

  return <ThemeCtx.Provider value={{ pref, theme, setPref }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
