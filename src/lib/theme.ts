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

/* ───────────────────────── ambient motion (ecosystem hub) ───────────────────────── */

/** Each user can switch decorative motion off for themselves; the tenant default lives in the brand. */
export type MotionPref = "auto" | "off";
export const MOTION_KEY = "aurum-motion-v1";
/** Key used by the retired review switcher; cleared on the hub so an old choice never lingers. */
export const ECO_PREVIEW_KEY = "aurum-eco-preview-v1";
/** The first-arrival sequence plays once per browser session. */
export const ECO_ENTERED_KEY = "aurum-eco-entered";

export function readMotionPref(): MotionPref {
  try {
    return window.localStorage.getItem(MOTION_KEY) === "off" ? "off" : "auto";
  } catch {
    return "auto";
  }
}

/**
 * Before first paint: mark <html data-eco-enter> when the hub's entrance should play this session — not if the OS asks
 * for reduced motion, the user switched motion off, or the chosen variation is Off. Fails silently without storage.
 */
export const ECO_BOOT = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem(${JSON.stringify(ECO_ENTERED_KEY)}))return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(localStorage.getItem(${JSON.stringify(MOTION_KEY)})==="off")return;var b=JSON.parse(localStorage.getItem("aurum-tenant-brand")||"null");var v=(b&&b.ambientMotion)||"ambient";if(v==="off")return;d.setAttribute("data-eco-enter","");}catch(e){}})();`;
