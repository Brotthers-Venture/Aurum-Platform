/**
 * Light / Dark / System, kept per user in this browser until profiles live in the database.
 * The resolved theme is written to <html data-theme="dark|light"> before first paint (THEME_BOOT),
 * and every Direction D surface (`.ws`) reads it through CSS variables — switching never re-lays out a page.
 */
export type ThemePref = "light" | "dark" | "system";
export const THEME_KEY = "aurum-theme-v1";

export function readThemePref(): ThemePref {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Inline in <head>. Obsidian (dark) is the default. */
export const THEME_BOOT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_KEY)})||"dark";var t=p==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
