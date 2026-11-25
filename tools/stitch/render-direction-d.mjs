#!/usr/bin/env node
/**
 * Direction D prototype renderer (design exploration only, not production code).
 *
 * Stitch composes each screen once, in Obsidian, with every colour as a CSS variable. This script renders that same
 * HTML in Obsidian, Platinum and a white-label tenant by swapping only token values. It proves the brief's rule:
 * one layout and one component set, with themes as token sets. It also places the official logo files.
 *
 *   node tools/stitch/render-direction-d.mjs            renders every deliverable into design/stitch/direction-d/
 *   ONLY=home-dark node tools/stitch/render-direction-d.mjs
 *
 * Sources: design/stitch/direction-d/src/<screen>.html (downloaded from Stitch, git-ignored).
 */
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(join(root, "package.json"));
const { chromium } = require("playwright-core");
const SRC = join(root, "design", "stitch", "direction-d", "src");
const OUT = join(root, "design", "stitch", "direction-d");
const dataUri = (p) => "data:image/png;base64," + readFileSync(join(root, p)).toString("base64");
const LOGO = { dark: dataUri("public/brand/aurum-logo-white.png"), light: dataUri("public/brand/aurum-logo-dark.png") };

/* ── Canonical semantic tokens (the proposal for src/lib/brand.ts) ─────────────────────────────── */
const THEMES = {
  dark: {
    bg: "#0B1015", header: "#0B1015", sidebar: "#0E141B", surface: "#10171F", elevated: "#161F29", border: "#25303C", borderSubtle: "#1A232E",
    text: "#F1F3F5", text2: "#98A4B3", text3: "#6B7887", accent: "#FFCA00", accentFill: "#FFCA00", accentOn: "#0B1015",
    accentSoft: "rgba(255,202,0,0.12)", accentLine: "rgba(255,202,0,0.35)", track: "#1E2833",
    pos: "#3DBE8B", warn: "#E8A93C", info: "#7AA7F2", neg: "#F2706A", neutral: "#98A4B3",
    sidebarText: "#F1F3F5", sidebarText2: "#98A4B3", sidebarBorder: "#1F2934", sponsor: "#9DB4CF",
  },
  light: {
    bg: "#F3F4F6", header: "#FFFFFF", sidebar: "#FFFFFF", surface: "#FFFFFF", elevated: "#FAFBFC", border: "#DFE3E8", borderSubtle: "#EBEEF1",
    text: "#101820", text2: "#5E6A77", text3: "#8A94A0", accent: "#8A6A00", accentFill: "#F8C618", accentOn: "#101820",
    accentSoft: "rgba(248,198,24,0.16)", accentLine: "rgba(138,106,0,0.35)", track: "#E6E9ED",
    pos: "#15803D", warn: "#B45309", info: "#1D4ED8", neg: "#B91C1C", neutral: "#5E6A77",
    sidebarText: "#101820", sidebarText2: "#5E6A77", sidebarBorder: "#DFE3E8", sponsor: "#1F3A5F",
  },
};
/** White-label tenant overrides (Northbridge preset from src/lib/brand.ts). Only brand tokens change. */
const TENANTS = {
  aurum: {},
  northbridge: {
    light: { accent: "#7A5F28", accentFill: "#C9A45C", accentOn: "#173A2E", accentLine: "rgba(122,95,40,0.35)", accentSoft: "rgba(201,164,92,0.16)",
      sidebar: "#173A2E", sidebarText: "#FFFFFF", sidebarText2: "#B7C7BF", sidebarBorder: "rgba(255,255,255,0.12)", sidebarAccent: "#C9A45C" },
    dark: { accent: "#C9A45C", accentFill: "#C9A45C", accentLine: "rgba(201,164,92,0.35)", accentSoft: "rgba(201,164,92,0.12)", sidebar: "#122B22", sidebarAccent: "#C9A45C" },
    wordmark: ["NORTHBRIDGE", "Fiduciary Partners"],
  },
};
const soft = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

/** Map each Stitch file's own token names onto the canonical tokens. */
function aliases(t) {
  const common = {
    "--bg": t.bg, "--header": t.header, "--sidebar": t.sidebar, "--border": t.border, "--border-subtle": t.borderSubtle,
    "--text": t.text, "--text-2": t.text2, "--text-3": t.text3, "--text-muted": t.text2, "--text-dim": t.text3,
    "--accent": t.accent, "--accent-muted": t.accentSoft, "--accent-glow": t.accentSoft, "--accent-soft": t.accentSoft, "--accent-border": t.accentLine,
    "--panel": t.surface, "--panel-hover": t.elevated, "--panel-header": t.elevated, "--card": t.surface, "--card-muted": t.elevated, "--bg-subtle": t.elevated,
    "--hover": soft(t.text.length === 7 ? t.text : "#000000", 0.04), "--neutral-track": t.track, "--chart-2": t.text2, "--chart-2-muted": soft(t.text2, 0.15),
    "--sidebar-text": t.sidebarText, "--sidebar-muted": t.sidebarText2,
    "--pos": t.pos, "--pos-bg": soft(t.pos, 0.12), "--warn": t.warn, "--warn-bg": soft(t.warn, 0.12), "--info": t.info, "--danger": t.neg, "--status-neutral": t.neutral,
    "--status-draft-bg": soft(t.neutral, 0.12), "--status-draft-text": t.neutral, "--status-pending-bg": soft(t.warn, 0.12), "--status-pending-text": t.warn,
    "--status-submitted-bg": soft(t.info, 0.12), "--status-submitted-text": t.info, "--status-partially-bg": soft(t.warn, 0.12), "--status-partially-text": t.warn,
    "--status-scheduled-bg": soft(t.neutral, 0.12), "--status-scheduled-text": t.neutral,
    "--status-investing-bg": soft(t.pos, 0.12), "--status-investing-text": t.pos, "--status-investing-border": soft(t.pos, 0.3),
    "--tag-bg": t.elevated, "--tag-border": t.border, "--tag-text": t.accent, "--sponsor": t.sponsor, "--sponsor-strong": "#1F3A5F",
  };
  return Object.entries(common).map(([k, v]) => `${k}:${v} !important;`).join("");
}

function css(theme, tenant) {
  const t = { ...THEMES[theme], ...(TENANTS[tenant][theme] ?? {}) };
  const sideAccent = t.sidebarAccent ?? t.accent;
  return `
  html:root { ${aliases(t)} color-scheme: ${theme}; }
  html, body { background: ${t.bg} !important; }
  body { font-variant-numeric: tabular-nums lining-nums; -webkit-font-smoothing: antialiased; }
  /* No monospace anywhere: account masks and numbers use the interface sans with tabular figures. */
  .font-mono, [class*="font-mono"], code, kbd, samp { font-family: Inter, system-ui, sans-serif !important; font-variant-numeric: tabular-nums; }
  /* Gold roles: a fill/indicator gold (logo gold) and a darker gold for text and chart lines on light surfaces. */
  [class~="bg-[var(--accent)]"], [style*="background-color: var(--accent)"], [style*="background: var(--accent)"] { background-color: ${t.accentFill} !important; color: ${t.accentOn} !important; }
  [class~="bg-[var(--accent)]"] * { color: ${t.accentOn} !important; }
  [class~="border-[var(--accent)]"], [class~="border-b-[var(--accent)]"], [class~="border-l-[var(--accent)]"], [class~="border-b-2"][class~="border-[var(--accent)]"] { border-color: ${t.accentFill} !important; }
  /* The sidebar re-scopes the text tokens, so a tenant can give it its own colour without breaking contrast. */
  aside, nav[class*="w-[220px]"] { --text:${t.sidebarText} !important; --text-2:${t.sidebarText2} !important; --text-muted:${t.sidebarText2} !important;
    --text-dim:${t.sidebarText2} !important; --text-3:${t.sidebarText2} !important; --border:${t.sidebarBorder} !important; --border-subtle:${t.sidebarBorder} !important;
    --header:${t.sidebar} !important; --sidebar-text:${t.sidebarText} !important; --sidebar-muted:${t.sidebarText2} !important;
    --accent:${sideAccent} !important; --panel:${soft(t.sidebarText.length === 7 ? t.sidebarText : "#FFFFFF", 0.06)} !important;
    --panel-hover:${soft(t.sidebarText.length === 7 ? t.sidebarText : "#FFFFFF", 0.06)} !important; background-color: ${t.sidebar} !important; }
  /* Tables: names wrap instead of truncating; compact horizontal padding so numeric columns fit at 1440. */
  td .truncate, td.truncate { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
  table th, table td { padding-left: 10px !important; padding-right: 10px !important; }
  img.brand-logo, .aurum-wordmark { flex-shrink: 0 !important; }
  header nav a, header button { white-space: nowrap; }
  /* Tablet: the header keeps logo, workspaces, search, theme, alerts and profile; layout and widget tools step back. */
  @media (max-width: 1279px) { .aurum-hide-tablet { display: none !important; } header nav a { padding-left: 8px !important; padding-right: 8px !important; }
    header nav, header nav > div { column-gap: 2px !important; } header nav > * , header nav > div > * { margin-left: 0 !important; margin-right: 0 !important; }
    header * { white-space: nowrap; } }
  /* Phones: every table becomes a stack of label / value records, so nothing overflows. */
  @media (max-width: 767px) {
    table, tbody, tfoot { display: block; width: 100% !important; min-width: 0 !important; }
    table thead { display: none; }
    table tr { display: block; height: auto !important; padding: 10px 14px; border-bottom: 1px solid var(--border); }
    table td { height: auto !important; white-space: normal !important; display: flex; justify-content: space-between; gap: 12px; padding: 2px 0 !important; border: 0 !important; position: static !important; text-align: right; background: transparent !important; }
    table td:first-child { font-weight: 600; text-align: left; padding-bottom: 4px !important; }
    table td:not(:first-child)::before { content: attr(data-label); color: var(--text-2, var(--text-muted)); font-weight: 400; text-align: left; }
    table td:empty { display: none; }
    [class*="overflow-x-auto"], div:has(> table) { overflow: visible !important; height: auto !important; max-height: none !important; }
    .aurum-hide-phone { display: none !important; }
  }
  .aurum-wordmark { display:flex; flex-direction:column; line-height:1.05; font-family:Inter,sans-serif; }
  .aurum-wordmark b { font-weight:600; letter-spacing:0.18em; font-size:13px; color:${t.text}; }
  .aurum-wordmark span { font-size:10px; color:${t.text2}; letter-spacing:0.02em; }
  `;
}

/** Remove content Stitch invented; the prototypes may show only demo data and agreed labels. */
const INVENTED = [/^Interval: 30 days \(daily discrete\)$/];

async function render(page, { screen, theme, tenant = "aurum", width, out }) {
  await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
  await page.goto(pathToFileURL(join(SRC, `${screen}.html`)).href, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: css(theme, tenant) });
  await page.evaluate(
    ({ logo, wordmark, invented }) => {
      for (const img of document.querySelectorAll("img.brand-logo, img[alt='Aurum']")) {
        if (wordmark && !img.closest("footer")) {
          const w = document.createElement("div");
          w.className = "aurum-wordmark";
          w.innerHTML = `<b>${wordmark[0]}</b><span>${wordmark[1]}</span>`;
          img.replaceWith(w);
          continue;
        }
        img.removeAttribute("onerror");
        img.src = logo;
        img.style.filter = "none";
        img.style.opacity = "1";
        img.style.width = "auto";
        img.style.objectFit = "contain";
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const kill = [];
      while (walker.nextNode()) if (invented.some((r) => new RegExp(r).test(walker.currentNode.textContent.trim()))) kill.push(walker.currentNode);
      for (const n of kill) n.parentElement?.remove();
    },
    { logo: LOGO[theme], wordmark: TENANTS[tenant].wordmark ?? null, invented: INVENTED.map((r) => r.source) },
  );
  // Reflect the selected theme in the header's Light | Dark | System control.
  await page.evaluate((theme) => {
    for (const el of document.querySelectorAll("button, span, a, div")) {
      if (el.children.length) continue;
      const txt = el.textContent.trim();
      if (txt === "Light" || txt === "Dark") {
        const group = el.closest("div");
        if (!group || !/Light/.test(group.textContent) || !/System/.test(group.textContent)) continue;
        const on = (txt === "Light") === (theme === "light");
        el.style.background = on ? "var(--panel-hover, var(--card-muted))" : "transparent";
        el.style.color = on ? "var(--accent)" : "var(--text-2, var(--text-muted))";
        el.style.fontWeight = on ? "600" : "400";
        el.style.borderRadius = "3px";
      }
    }
  }, theme);
  // Layout fixes for capture: label table cells for the phone layout, hide widget-customisation controls on phones,
  // wrap overflowing panel headers, and unroll inner scroll containers so a full-page capture shows every panel.
  await page.evaluate((width) => {
    for (const table of document.querySelectorAll("table")) {
      const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      for (const tr of table.querySelectorAll("tbody tr, tfoot tr")) [...tr.children].forEach((td, i) => td.setAttribute("data-label", heads[i] ?? ""));
    }
    for (const path of document.querySelectorAll("svg path")) {
      const d = path.getAttribute("d") ?? "";
      if (d.startsWith("M4 8h16") || d.startsWith("M4 8V4")) path.closest("span, button")?.classList.add("aurum-hide-phone");
    }
    for (const el of document.querySelectorAll("header div, header button"))
      if (/^(\+\s*)?(Layout:|Add widget)/.test(el.textContent.trim()) && el.textContent.trim().length < 40) el.classList.add("aurum-hide-tablet");
    for (const el of document.querySelectorAll(".cursor-grab, [title*='Drag' i], [title*='full' i], [aria-label*='full' i]")) el.classList.add("aurum-hide-phone");
    if (width < 768)
      for (const el of document.querySelectorAll("div, header")) {
        const cs = getComputedStyle(el);
        if (cs.display === "flex" && cs.flexDirection === "row" && el.scrollWidth > el.clientWidth + 2) Object.assign(el.style, { flexWrap: "wrap", height: "auto", rowGap: "6px" });
      }
    for (const el of [document.documentElement, document.body, ...document.querySelectorAll("body *")]) {
      const cs = getComputedStyle(el);
      if (el.closest("table") || el.querySelector?.(":scope > table")) continue;
      if (["auto", "scroll", "hidden"].includes(cs.overflowY) && el.scrollHeight > el.clientHeight + 4) Object.assign(el.style, { overflowY: "visible", height: "auto", maxHeight: "none" });
      if (cs.height && el.classList?.contains("h-screen")) Object.assign(el.style, { height: "auto", minHeight: "100vh" });
    }
  }, width);
  await page.waitForTimeout(400);
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log("rendered", out.replace(root, "."));
}

const JOBS = [
  ["01-home-dark", "home", "dark", "aurum", 1440],
  ["02-home-light", "home", "light", "aurum", 1440],
  ["03-fund-overview-dark", "fund", "dark", "aurum", 1440],
  ["04-fund-overview-light", "fund", "light", "aurum", 1440],
  ["05-banking-treasury-dark", "banking", "dark", "aurum", 1440],
  ["06-banking-treasury-light", "banking", "light", "aurum", 1440],
  ["07-investor-portal-dark", "portal", "dark", "aurum", 1440],
  ["08-investor-portal-light", "portal", "light", "aurum", 1440],
  ["09-home-northbridge-light", "home", "light", "northbridge", 1440],
  ["10a-home-tablet-1024", "home", "dark", "aurum", 1024],
  ["10b-home-phone-390", "home", "dark", "aurum", 390],
  ["10c-investor-portal-tablet-1024", "portal", "light", "aurum", 1024],
  ["10d-investor-portal-phone-390", "portal", "light", "aurum", 390],
  ["extra-home-dark-1920", "home", "dark", "aurum", 1920],
];
const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ deviceScaleFactor: 2 })).newPage();
for (const [name, screen, theme, tenant, width] of JOBS) {
  if (only && !only.some((o) => name.includes(o))) continue;
  await render(page, { screen, theme, tenant, width, out: join(OUT, `${name}.png`) });
}
await browser.close();
