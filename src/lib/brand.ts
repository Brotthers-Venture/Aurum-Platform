/**
 * White label. Everything a B2B client can make their own: names, logos, mark, colours, type, the sign-in
 * page, contact details and the colour of each firm workspace. The platform reads these through CSS variables
 * and the brand context, so no screen carries a fixed brand.
 *
 * Until tenants live in the database the active brand is kept in this browser; in production it is resolved
 * from the domain (e.g. portal.clientfirm.com) on the server and sent with the first page.
 */
import type { FirmId } from "./firm-colors";

export type MarkShape = "hexagon" | "circle" | "square" | "diamond" | "arch";
export type SerifFont = "source-serif" | "georgia" | "times" | "palatino";
export type SansFont = "hanken" | "helvetica" | "system" | "verdana";
export type AmbientMotion = "off" | "ambient" | "architectural" | "pulse";
export const AMBIENT_MOTIONS: { id: AmbientMotion; label: string; about: string }[] = [
  { id: "off", label: "Off", about: "Static illumination and composition, no animation." },
  { id: "ambient", label: "Ambient", about: "Soft breathing light behind the ecosystem." },
  { id: "architectural", label: "Architectural", about: "A fine hexagonal lattice with restrained light at its centre." },
  { id: "pulse", label: "Pulse", about: "Ambient light with an occasional, quiet transmission to one application." },
];
export type LoginBackdrop = "gold" | "ink" | "stone" | "image";

export type Brand = {
  id: string;
  name: string; // short name used in the interface, e.g. "Aurum"
  legalName: string; // e.g. "Aurum Asset Management"
  tagline: string; // under the wordmark when no logo is uploaded
  domain: string;
  supportEmail: string;
  city: string;
  logo?: string; // data URL or path — for light backgrounds
  logoLight?: string; // data URL or path — for dark backgrounds
  mark: MarkShape;
  markImage?: string; // optional favicon / app mark
  colors: {
    ink: string; // primary text, headers and dark surfaces
    accent: string; // primary buttons and the mark
    accentInk: string; // text on the accent
    metal: string; // secondary highlight (rules, progress, eyebrows)
    canvas: string; // page background
    surface: string; // cards and panels
    /** the accent on dark surfaces when the logo uses a different value there (Aurum: #FFCA00) */
    accentDark?: string;
  };
  modules: Record<FirmId, string>;
  /** What the tenant calls each firm workspace (falls back to MODULE_DEFAULTS). */
  moduleNames?: Partial<Record<FirmId, string>>;
  /** default motion on the ecosystem hub; each user can still switch motion off for themselves */
  ambientMotion?: AmbientMotion;
  fonts: { serif: SerifFont; sans: SansFont };
  login: { eyebrow: string; headline: string; text: string; backdrop: LoginBackdrop; image?: string };
  legal: { footer: string; privacyUrl: string; termsUrl: string };
};

export const SERIF: Record<SerifFont, { label: string; stack: string }> = {
  "source-serif": { label: "Source Serif", stack: '"Source Serif 4 Variable", Georgia, serif' },
  georgia: { label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  times: { label: "Times", stack: "'Times New Roman', Times, serif" },
  palatino: { label: "Palatino", stack: "'Palatino Linotype', Palatino, 'Book Antiqua', serif" },
};
export const SANS: Record<SansFont, { label: string; stack: string }> = {
  hanken: { label: "Hanken Grotesk", stack: '"Hanken Grotesk Variable", "Helvetica Neue", Arial, sans-serif' },
  helvetica: { label: "Helvetica", stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  system: { label: "System", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  verdana: { label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
};

export const AURUM: Brand = {
  id: "aurum",
  name: "Aurum",
  legalName: "Aurum Asset Management",
  tagline: "Asset Management",
  domain: "aurumasset.us",
  supportEmail: "clientservices@aurumasset.us",
  city: "Orlando, Florida",
  logo: "/brand/aurum-logo-dark.png",
  logoLight: "/brand/aurum-logo-white.png",
  mark: "hexagon",
  colors: { ink: "#0F2340", accent: "#F8C618", accentInk: "#0F2340", metal: "#B8975A", canvas: "#F1EDE4", surface: "#FFFFFF", accentDark: "#FFCA00" },
  modules: { sales: "#C46A1E", pmo: "#8A4A9E", communication: "#1F8A84", dataroom: "#3558C0", billing: "#4F8A2B", compliance: "#9B2F3F" },
  fonts: { serif: "source-serif", sans: "hanken" },
  login: {
    eyebrow: "Aurum Asset Management",
    headline: "Built to endure.",
    text: "Fiduciary administration for funds, offerings, companies and families across the United States, Brazil and offshore jurisdictions.",
    backdrop: "gold",
  },
  legal: { footer: "Aurum Asset Management · Orlando, Florida", privacyUrl: "#", termsUrl: "#" },
};

/** Sample client brands, fictional, to show the range a tenant can reach. */
export const PRESETS: Brand[] = [
  AURUM,
  {
    ...AURUM,
    id: "northbridge",
    name: "Northbridge",
    legalName: "Northbridge Fiduciary Partners",
    tagline: "Fiduciary Partners",
    domain: "northbridgefp.com",
    supportEmail: "service@northbridgefp.com",
    city: "Boston, Massachusetts",
    logo: undefined,
    logoLight: undefined,
    mark: "arch",
    colors: { ink: "#173A2E", accent: "#C9A45C", accentInk: "#173A2E", metal: "#9C7B3C", canvas: "#EEF0EA", surface: "#FFFFFF" },
    modules: { sales: "#B0652A", pmo: "#6E4C8C", communication: "#2E7D74", dataroom: "#2F5D8C", billing: "#5E7F2F", compliance: "#8E2F3A" },
    fonts: { serif: "georgia", sans: "helvetica" },
    login: {
      eyebrow: "Northbridge Fiduciary Partners",
      headline: "Stewardship, in writing.",
      text: "Administration and reporting for private funds and family holding structures.",
      backdrop: "ink",
    },
    legal: { footer: "Northbridge Fiduciary Partners · Boston, Massachusetts", privacyUrl: "#", termsUrl: "#" },
  },
  {
    ...AURUM,
    id: "halcyon",
    name: "Halcyon",
    legalName: "Halcyon Corporate Services",
    tagline: "Corporate Services",
    domain: "halcyoncs.com",
    supportEmail: "desk@halcyoncs.com",
    city: "Miami, Florida",
    logo: undefined,
    logoLight: undefined,
    mark: "circle",
    colors: { ink: "#1E2228", accent: "#2FA3A0", accentInk: "#FFFFFF", metal: "#2FA3A0", canvas: "#F2F3F4", surface: "#FFFFFF" },
    modules: { sales: "#C4682B", pmo: "#7B55A6", communication: "#1F8A84", dataroom: "#3B63C4", billing: "#4C8A33", compliance: "#A1384A" },
    fonts: { serif: "palatino", sans: "system" },
    login: {
      eyebrow: "Halcyon Corporate Services",
      headline: "Calm administration.",
      text: "Entities, compliance and records for companies operating across the Americas.",
      backdrop: "stone",
    },
    legal: { footer: "Halcyon Corporate Services · Miami, Florida", privacyUrl: "#", termsUrl: "#" },
  },
];

/** Default workspace names. A tenant can rename any of them in Brand & white label. */
export const MODULE_DEFAULTS: Record<FirmId, string> = {
  sales: "Sales",
  pmo: "PMO",
  communication: "Corporate Chat",
  dataroom: "Data rooms",
  billing: "Treasury",
  compliance: "Compliance",
};
/** Seed and demo text carries {tenant}; it is resolved to the tenant’s name when shown. */
export const withTenant = (text: string, name: string) => text.replace(/{tenant}/g, name);
export const moduleName = (b: Pick<Brand, "moduleNames">, id: FirmId) => b.moduleNames?.[id]?.trim() || MODULE_DEFAULTS[id];

/* ───────────────────────── colour helpers ───────────────────────── */

export function hexOk(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}
function lum(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  if (!hexOk(a) || !hexOk(b)) return 1;
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** Readable text colour on a background: the brand ink or white, whichever contrasts more. */
export function textOn(bg: string, ink: string) {
  return contrast(bg, "#FFFFFF") >= contrast(bg, ink) ? "#FFFFFF" : ink;
}

function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
}
/** The brand colour itself if it reads on this background, else the nearest shade (towards black or white) that meets the ratio. */
export function readableOn(color: string, bg: string, min = 4.5) {
  if (!hexOk(color) || !hexOk(bg)) return color;
  const toward = contrast(bg, "#000000") > contrast(bg, "#FFFFFF") ? "#000000" : "#FFFFFF";
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const c = mixHex(color, toward, Math.min(t, 1));
    if (contrast(c, bg) >= min) return c;
  }
  return toward;
}

/** The CSS variables a brand sets on the page. Tailwind's ink, gold and stone scales are rebuilt from them. */
export function brandVars(b: Brand): Record<string, string> {
  const c = b.colors;
  const mix = (a: string, w: number, z: string) => `color-mix(in oklab, ${a} ${w}%, ${z})`;
  const v: Record<string, string> = {
    "--tenant-ink": c.ink,
    "--tenant-accent": c.accent,
    "--tenant-accent-ink": c.accentInk,
    "--tenant-metal": c.metal,
    "--tenant-canvas": c.canvas,
    "--tenant-surface": c.surface,
    // Direction D: brand text and lines on the Obsidian and Platinum surfaces, AA-checked
    "--tenant-accent-dark": c.accentDark ?? c.accent,
    "--tenant-accent-on-dark": readableOn(c.accentDark ?? c.accent, "#10161D"),
    "--tenant-accent-on-light": readableOn(c.accent, "#FFFFFF"),
    "--color-ink-950": mix(c.ink, 82, "black"),
    "--color-ink-900": c.ink,
    "--color-ink-800": mix(c.ink, 88, "white"),
    "--color-ink-700": mix(c.ink, 76, "white"),
    "--color-ink-600": mix(c.ink, 64, "white"),
    "--color-gold-50": mix(c.metal, 8, "white"),
    "--color-gold-100": mix(c.metal, 20, "white"),
    "--color-gold-400": mix(c.metal, 60, "white"),
    "--color-gold-500": c.metal,
    "--color-gold-700": mix(c.metal, 70, "black"),
    "--color-stone-50": c.canvas,
    "--color-champagne": mix(c.metal, 32, c.canvas),
    "--color-positive": c.ink,
    "--font-serif": SERIF[b.fonts.serif].stack,
    "--font-sans": SANS[b.fonts.sans].stack,
  };
  for (const [k, col] of Object.entries(b.modules)) v[`--module-${k}`] = col;
  return v;
}

export const BRAND_KEY = "aurum-tenant-brand";
/** Serialise a brand, keeping empty fields as null so they override the defaults on load. */
export const serialiseBrand = (b: Brand) => JSON.stringify({ ...b, vars: brandVars(b) }, (_k, v) => (v === undefined ? null : v));
export function loadBrand(): Brand {
  try {
    const raw = window.localStorage.getItem(BRAND_KEY);
    if (!raw) return AURUM;
    const b = JSON.parse(raw) as Brand;
    return {
      ...AURUM,
      ...b,
      colors: { ...AURUM.colors, ...b.colors },
      modules: { ...AURUM.modules, ...b.modules },
      moduleNames: { ...b.moduleNames },
      fonts: { ...AURUM.fonts, ...b.fonts },
      login: { ...AURUM.login, ...b.login },
      legal: { ...AURUM.legal, ...b.legal },
    };
  } catch {
    return AURUM;
  }
}

/** Runs before first paint (inline in <head>) so a saved brand never flashes the default colours. */
export const BRAND_BOOT = `(function(){try{var b=JSON.parse(localStorage.getItem(${JSON.stringify(BRAND_KEY)})||"null");if(!b||!b.vars)return;var s=document.documentElement.style;for(var k in b.vars)s.setProperty(k,b.vars[k]);}catch(e){}})();`;
