#!/usr/bin/env node
/**
 * Direction D — refined prototypes (design exploration only; not production code).
 * Builds HTML prototypes on the Direction D token system with figures read from src/lib, then renders them with Chrome.
 *
 *   node --experimental-strip-types --no-warnings --import ./tools/stitch/ts-loader.mjs tools/stitch/direction-d-refined.mjs
 *
 * Output: design/stitch/direction-d/refined/*.png (and the HTML sources in refined/src/). Fonts are the self-hosted
 * @fontsource packages (Inter, Manrope, IBM Plex Sans, Source Serif 4), loaded from node_modules.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(join(root, "package.json"));
const OUT = join(root, "design", "stitch", "direction-d", "refined");
const SRC = join(OUT, "src");
mkdirSync(SRC, { recursive: true });

const D = await import(pathToFileURL(join(root, "src/lib/data.ts")).href);
const E = await import(pathToFileURL(join(root, "src/lib/accounting/engine.ts")).href);
const G = await import(pathToFileURL(join(root, "src/lib/gps.ts")).href);

/* ───────────────────────── data (all from src/lib) ───────────────────────── */
const FX = D.INDICATIVE_BRL_USD; // indicative BRL per USD, labelled wherever used
const usd = (v, cur) => (cur === "BRL" ? v / FX : v);
const live = D.funds.filter((f) => D.fundTotals(f.id).investors);
const firm = live.reduce(
  (a, f) => {
    const t = D.fundTotals(f.id);
    for (const k of ["commitment", "called", "contributed", "receivable", "unfunded", "distributed", "nav"]) a[k] += usd(t[k], f.currency);
    return a;
  },
  { commitment: 0, called: 0, contributed: 0, receivable: 0, unfunded: 0, distributed: 0, nav: 0 },
);
const navByVehicle = live.map((f) => ({ name: f.shortName, cur: f.currency, nav: D.fundTotals(f.id).nav, usd: usd(D.fundTotals(f.id).nav, f.currency) })).sort((a, b) => b.usd - a.usd);
const flows = D.quarterlyFlowsUSD(() => FX);
const call = (fund, n) => D.capitalCalls.find((c) => c.fundId === fund && c.number === n);
const c7 = call("cordillera-infra-i", 7), c2 = call("atlantico-vp-ii", 2), c3 = call("stx-anchor", 3);
const fipDist = D.distributions.find((x) => x.fundId === "fip-horizonte" && x.status === "Scheduled");
const inv = (id) => D.investorById(id).name;
const pcr = (id) => D.profileChangeRequests.find((p) => p.id === id);
const ob = (id) => D.onboarding.find((o) => o.id === id);
const cash = live.map((f) => {
  const tb = E.trialBalance(E.buildBooks(f.id).journal);
  return { fund: f.shortName, cur: f.currency, cash: (tb.find((r) => r.account === "1000")?.balance ?? 0) / 100 };
});
const ledgerCashUSD = cash.reduce((a, c) => a + usd(c.cash, c.cur), 0);
const calloway = D.capitalAccounts.find((c) => c.fundId === "cordillera-infra-i" && c.investorId === "inv-calloway");
const callowayC7 = c7.allocations.find((a) => a.investorId === "inv-calloway");
const cordillera = G.gpById("cordillera");
const docsCord = D.documents.filter((d) => d.fundId === "cordillera-infra-i");
const TODAY = E.TODAY; // 2026-11-24 — the demo ledger's "today"

/* ───────────────────────── formatting ───────────────────────── */
const n0 = (v) => Math.round(v).toLocaleString("en-US");
const money = (v, cur = "USD") => (v < 0 ? "−" : "") + (cur === "BRL" ? "R$ " : "$") + n0(Math.abs(v));
const mm = (v) => "$" + (v / 1e6).toFixed(1) + "M";
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const date = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return `${d} ${MON[m - 1]} ${y}`; };
const day = (iso) => { const [, m, d] = iso.slice(0, 10).split("-").map(Number); return `${d} ${MON[m - 1]}`; };
const time = (iso) => iso.slice(11, 16);

/* ───────────────────────── icons (lucide paths) ───────────────────────── */
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  apps: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
  expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>',
  collapse: '<path d="M5 12h14"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  queue: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  config: '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  resize: '<path d="M21 3 9 15"/><path d="M12 3H3v18h18v-9"/><path d="M16 3h5v5"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
};
const ic = (k, s = 16, cls = "") => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
const hex = (cls = "hexmark") => `<svg class="${cls}" width="7" height="8" viewBox="0 0 7 8" aria-hidden="true"><path d="M3.5 0 7 2v4L3.5 8 0 6V2z" fill="currentColor"/></svg>`;

/* ───────────────────────── fonts & tokens ───────────────────────── */
const nm = (p) => pathToFileURL(join(root, "node_modules", p)).href;
const FONTS = ["@fontsource-variable/inter/index.css", "@fontsource-variable/manrope/index.css", "@fontsource/ibm-plex-sans/300.css", "@fontsource/ibm-plex-sans/400.css", "@fontsource-variable/source-serif-4/index.css"]
  .map((p) => `<link rel="stylesheet" href="${nm(p)}">`).join("");
const LOGO = { dark: pathToFileURL(join(root, "public/brand/aurum-logo-white.png")).href, light: pathToFileURL(join(root, "public/brand/aurum-logo-dark.png")).href };

const CSS = `
/* Obsidian — tonal depth through four surface steps, not shadows */
[data-theme="dark"] { color-scheme: dark;
  --bg:#0A0E12; --chrome:#0C1116; --surface:#10161D; --surface-2:#131A22; --raise:#18202A; --line:#212A34; --line-soft:#19212A; --line-strong:#2E3946;
  --text:#EEF1F4; --text-2:#97A3B1; --text-3:#6A7684; --accent:#FFCA00; --accent-fill:#FFCA00; --on-accent:#0A0E12; --accent-soft:rgba(255,202,0,.10); --accent-edge:#FFCA00;
  --pos:#3DBE8B; --warn:#E3A33B; --info:#83ABF0; --neg:#EF6F68; --neutral:#97A3B1; --s2:#8592A1; --s3:#4A5664; --grid:#1A222B;
  --sheen: inset 0 1px 0 rgba(255,255,255,.028); --menu-shadow: 0 16px 40px rgba(0,0,0,.45), 0 0 0 1px var(--line-strong);
  --focus:#EEF1F4; --sponsor:#9DB4CF; --on-sponsor:#0A0E12; --logo:url("${LOGO.dark}"); }
/* Platinum — a private-bank statement: warm neutrals, understated borders */
[data-theme="light"] { color-scheme: light;
  --bg:#F2F1EE; --chrome:#FBFAF8; --surface:#FFFFFF; --surface-2:#FAF9F6; --raise:#F4F2EE; --line:#E3E0DA; --line-soft:#EDEBE6; --line-strong:#D2CEC6;
  --text:#14181D; --text-2:#5A6069; --text-3:#8A8F96; --accent:#7D5F00; --accent-fill:#F8C618; --on-accent:#14181D; --accent-soft:rgba(248,198,24,.16); --accent-edge:#9C7500;
  --pos:#15803D; --warn:#A6570B; --info:#1D4ED8; --neg:#B42318; --neutral:#5A6069; --s2:#7C828B; --s3:#C9C5BD; --grid:#EEECE7;
  --sheen: 0 1px 0 rgba(20,24,29,.03); --menu-shadow: 0 16px 40px rgba(20,24,29,.12), 0 0 0 1px var(--line);
  --focus:#14181D; --sponsor:#1F3A5F; --on-sponsor:#FFFFFF; --logo:url("${LOGO.light}"); }
[data-type="a"] { --font-figure:"Manrope Variable", Inter, sans-serif; --figure-weight:300; --figure-track:-0.025em; }
[data-type="b"] { --font-figure:"IBM Plex Sans", Inter, sans-serif; --figure-weight:300; --figure-track:-0.02em; }
:root { --font-ui:"Inter Variable", system-ui, sans-serif; --font-serif:"Source Serif 4 Variable", Georgia, serif; }

* { box-sizing:border-box; margin:0; padding:0; }
body { background:var(--bg); color:var(--text); font:400 13px/1.45 var(--font-ui); font-feature-settings:"cv11","ss01"; -webkit-font-smoothing:antialiased; }
.num, td.r, .fig { font-variant-numeric: tabular-nums lining-nums; font-feature-settings:"tnum","lnum"; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
.ic { flex:none; display:block; }
.muted { color:var(--text-2); } .faint { color:var(--text-3); }
:focus-visible, .is-focus { outline:2px solid var(--focus); outline-offset:2px; border-radius:3px; }

/* ── Global header: applications only ── */
.top { height:52px; display:flex; align-items:center; gap:18px; padding:0 16px 0 18px; background:var(--chrome); border-bottom:1px solid var(--line); position:relative; z-index:5; }
.logo { width:104px; height:22px; background:var(--logo) left center / contain no-repeat; flex:none; }
.apps { display:flex; align-self:stretch; gap:2px; margin-left:8px; }
.apps a { display:flex; align-items:center; padding:0 11px; color:var(--text-2); font-weight:500; position:relative; white-space:nowrap; }
.apps a.on { color:var(--text); }
.apps a.on::after { content:""; position:absolute; left:11px; right:11px; bottom:-1px; height:2px; background:var(--text); }
.iconbtn { width:30px; height:30px; display:grid; place-items:center; border-radius:4px; color:var(--text-2); position:relative; }
.iconbtn:hover, .iconbtn.is-hover { background:var(--raise); color:var(--text); }
.badge-dot { position:absolute; top:4px; right:4px; min-width:15px; height:15px; padding:0 4px; border-radius:8px; background:var(--text); color:var(--bg); font-size:9.5px; font-weight:600; display:grid; place-items:center; }
.sel { display:flex; align-items:center; gap:7px; height:30px; padding:0 9px 0 11px; border:1px solid var(--line); border-radius:4px; color:var(--text); background:var(--surface); white-space:nowrap; }
.sel .k { color:var(--text-3); }
.search { flex:1; max-width:440px; display:flex; align-items:center; gap:8px; height:30px; padding:0 8px 0 10px; border:1px solid var(--line); border-radius:4px; background:var(--bg); color:var(--text-3); }
.search > span:first-of-type { flex:1; } .kbd { font-size:10.5px; padding:1px 5px; border:1px solid var(--line); border-radius:3px; color:var(--text-3); }
.acct { display:flex; align-items:center; gap:6px; padding:3px 6px 3px 3px; border-radius:16px; }
.avatar { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:10.5px; font-weight:600; background:var(--raise); border:1px solid var(--line-strong); color:var(--text); }
.spacer { flex:1; }

/* ── Shell ── */
.shell { display:grid; grid-template-columns:220px 1fr; min-height:calc(100vh - 52px); }
.side { background:var(--chrome); border-right:1px solid var(--line); padding:14px 10px; display:flex; flex-direction:column; gap:2px; }
.side h6 { font:600 11px/1 var(--font-ui); color:var(--text-3); padding:6px 10px 8px; letter-spacing:.01em; }
.side a { display:flex; align-items:center; gap:10px; height:32px; padding:0 10px; border-radius:4px; color:var(--text-2); font-weight:500; position:relative; }
.side a.on { color:var(--text); background:var(--raise); }
.side a.on .hexmark { position:absolute; left:-6px; color:var(--text); }
.side a .count { margin-left:auto; font-size:11px; color:var(--text-3); }
.side .foot { margin-top:auto; border-top:1px solid var(--line-soft); padding:12px 10px 2px; font-size:12px; }
main { padding:14px 16px 20px; display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:12px; align-content:start; }
@media (max-width:1279px) { .shell{grid-template-columns:56px 1fr} .side h6,.side a span,.side .foot{display:none} .side a{font-size:0;justify-content:center;padding:0} .side a .ic{width:18px;height:18px}
  .search{max-width:220px} .sel .k{display:none} .apps a{padding:0 8px} main .s4,main .s8{grid-column:span 12} main .s6{grid-column:span 6} }
@media (max-width:1099px) { .apps a:nth-child(n+4){display:none} .search span:first-of-type{display:none} .search{flex:0;width:34px;padding:0 9px} .search .kbd{display:none} main .s6{grid-column:span 12} td.s:nth-child(2){white-space:normal} }
.s3 { grid-column:span 3; } .s4 { grid-column:span 4; } .s5 { grid-column:span 5; } .s6 { grid-column:span 6; } .s7 { grid-column:span 7; } .s8 { grid-column:span 8; } .s12 { grid-column:span 12; }

/* ── Panels: layered surface, sheen, refined separators; controls on hover / focus / touch ── */
.panel { background:var(--surface); border:1px solid var(--line); border-radius:6px; box-shadow:var(--sheen); display:flex; flex-direction:column; min-width:0; position:relative; }
.ph { height:42px; display:flex; align-items:center; gap:10px; padding:0 8px 0 16px; border-bottom:1px solid var(--line-soft); }
.ph h3 { font:600 13px/1 var(--font-ui); letter-spacing:-.005em; white-space:nowrap; }
.ph .sub { color:var(--text-3); font-size:11.5px; white-space:nowrap; }
.ctl { display:flex; gap:2px; margin-left:auto; opacity:0; transition:opacity .12s; }
.ctl button { width:26px; height:26px; display:grid; place-items:center; border-radius:4px; color:var(--text-3); }
.ctl button:hover { background:var(--raise); color:var(--text); }
.panel:hover .ctl, .panel:focus-within .ctl, .panel.is-hover .ctl { opacity:1; }
.panel.is-hover { border-color:var(--line-strong); }
@media (hover:none) { .ctl { opacity:1; } .ctl .d-only { display:none; } }
.pb { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; min-height:0; }
.seg { display:inline-flex; border:1px solid var(--line); border-radius:4px; padding:2px; gap:2px; background:var(--bg); }
.seg button { padding:2px 8px; border-radius:3px; font-size:11.5px; color:var(--text-3); }
.seg button.on { background:var(--raise); color:var(--text); font-weight:500; box-shadow:0 0 0 1px var(--line-strong); }
.chip { display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 9px 0 7px; border:1px solid var(--line); border-radius:4px; font-size:11.5px; color:var(--text-2); }
.chip .sw { width:10px; height:2px; border-radius:1px; }
.chip.off { opacity:.5; }

/* ── Figures ── */
.label { font-size:12px; color:var(--text-2); }
.fig-xl { font:var(--figure-weight) 46px/1.05 var(--font-figure); letter-spacing:var(--figure-track); font-variant-numeric:tabular-nums lining-nums; }
.fig-l { font:var(--figure-weight) 32px/1.1 var(--font-figure); letter-spacing:var(--figure-track); font-variant-numeric:tabular-nums lining-nums; }
.fig-m { font:400 20px/1.2 var(--font-figure); letter-spacing:-.01em; font-variant-numeric:tabular-nums lining-nums; }
.kv { display:flex; justify-content:space-between; align-items:baseline; padding:8px 0; border-top:1px solid var(--line-soft); }
.kv:first-child { border-top:0; } .kv span:last-child { font-variant-numeric:tabular-nums; font-weight:500; }
.note { font-size:11.5px; color:var(--text-3); line-height:1.45; }

/* ── Tables ── */
table { width:100%; border-collapse:collapse; }
th { font:500 11.5px/1 var(--font-ui); color:var(--text-3); text-align:left; padding:0 10px 9px; white-space:nowrap; }
td { padding:9px 10px; border-top:1px solid var(--line-soft); white-space:nowrap; vertical-align:middle; }
th.r, td.r { text-align:right; }
tr:hover td, tr.is-hover td { background:var(--surface-2); }
td .t { font-weight:500; } td .s { color:var(--text-2); }
.rowact { color:var(--text-2); font-weight:500; font-size:12px; padding:3px 6px; border-radius:3px; }
.rowact:hover, .rowact:focus-visible, tr.is-hover .rowact { color:var(--accent); background:var(--accent-soft); }
.status { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:500; white-space:nowrap; }
.status::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
.st-neutral { color:var(--neutral); } .st-warn { color:var(--warn); } .st-info { color:var(--info); } .st-pos { color:var(--pos); } .st-neg { color:var(--neg); }
.tabs { display:flex; gap:18px; padding:0 16px; border-bottom:1px solid var(--line-soft); }
.tabs button { height:36px; color:var(--text-2); font-weight:500; position:relative; display:flex; align-items:center; gap:6px; }
.tabs button .n { font-size:11px; color:var(--text-3); font-variant-numeric:tabular-nums; }
.tabs button.on { color:var(--text); } .tabs button.on::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--text); }

/* ── Buttons ── */
.btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:32px; padding:0 13px; border-radius:4px; font-weight:500; white-space:nowrap; border:1px solid var(--line-strong); background:var(--surface); color:var(--text); }
.btn.primary { background:var(--accent-fill); border-color:var(--accent-edge); color:var(--on-accent); }
.btn.sponsor { background:var(--sponsor); border-color:var(--sponsor); color:var(--on-sponsor); }
.btn.ghost { border-color:transparent; background:transparent; color:var(--text-2); }

/* ── Lists ── */
.dl { display:grid; grid-template-columns:64px 1fr auto; column-gap:0; align-items:baseline; } .dl > div:not(:nth-child(3n)) { padding-right:14px; }
.dl > div { padding:10px 0; border-top:1px solid var(--line-soft); }
.dl > div:nth-child(-n+3) { border-top:0; }
.when { font-weight:600; font-variant-numeric:tabular-nums; } .when small { display:block; font-weight:400; color:var(--text-3); font-size:11px; }
.kind { font-size:11px; color:var(--text-3); }
.alloc { display:grid; grid-template-columns:1fr auto; row-gap:5px; column-gap:12px; }
.bar { grid-column:1 / -1; height:4px; border-radius:2px; background:var(--line-soft); overflow:hidden; margin-bottom:6px; }
.bar i { display:block; height:100%; background:var(--s2); border-radius:2px; }
.bar i.lead { background:var(--accent-fill); box-shadow:inset 0 0 0 1px var(--accent-edge); }

/* ── Menus ── */
.menu { position:absolute; background:var(--surface); border-radius:6px; box-shadow:var(--menu-shadow); padding:6px; width:260px; z-index:20; font-size:12.5px; }
.menu h6 { font:600 11px/1 var(--font-ui); color:var(--text-3); padding:8px 10px 6px; }
.menu .it { display:flex; align-items:center; gap:10px; height:32px; padding:0 10px; border-radius:4px; color:var(--text); }
.menu .it .ic { color:var(--text-2); } .menu .it.on { background:var(--raise); } .menu .it .tick { margin-left:auto; color:var(--text); }
.menu hr { border:0; border-top:1px solid var(--line-soft); margin:5px 2px; }
.menu .kbd { margin-left:auto; }
`;

const page = (title, body, { theme = "dark", type = "a", extraCss = "" } = {}) =>
  `<!doctype html><html lang="en" data-theme="${theme}" data-type="${type}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${FONTS}<style>${CSS}${extraCss}</style></head><body>${body}</body></html>`;

/* ───────────────────────── chart language ───────────────────────── */
/** Quarterly area/line chart. The last quarter is partial (to the ledger date) and drawn as "to date". */
function activityChart(w, h, { crosshair = "Q3 2026" } = {}) {
  const pad = { l: 46, r: 40, t: 14, b: 26 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b, max = 25;
  const X = (i) => pad.l + (iw * i) / (flows.length - 1), Y = (v) => pad.t + ih - (ih * v) / max;
  const pts = (k) => flows.map((q, i) => [X(i), Y(q[k])]);
  const path = (a) => a.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const c = pts("contributions"), d = pts("distributions"), n = flows.length;
  const grid = [0, 5, 10, 15, 20, 25].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${pad.l - 10}" y="${Y(v) + 3.5}" text-anchor="end" class="ax">$${v}M</text>`).join("");
  const xl = flows.map((q, i) => `<text x="${X(i)}" y="${h - 6}" text-anchor="middle" class="ax${q.q === crosshair ? " on" : ""}">${q.q}${i === n - 1 ? "*" : ""}</text>`).join("");
  const ci = flows.findIndex((q) => q.q === crosshair), q = flows[ci];
  const area = path(c.slice(0, n - 1)) + ` L${c[n - 2][0]} ${Y(0)} L${c[0][0]} ${Y(0)} Z`;
  const tipX = X(ci) - 196;
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" class="chart">
  <defs><linearGradient id="gA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent-fill)" stop-opacity=".16"/><stop offset="1" stop-color="var(--accent-fill)" stop-opacity="0"/></linearGradient></defs>
  ${grid}${xl}
  <path d="${area}" fill="url(#gA)"/>
  <path d="${path(d.slice(0, n - 1))}" fill="none" stroke="var(--s2)" stroke-width="1.5"/>
  <path d="${path(d.slice(n - 2))}" fill="none" stroke="var(--s2)" stroke-width="1.5" stroke-dasharray="3 3"/>
  <path d="${path(c.slice(0, n - 1))}" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <path d="${path(c.slice(n - 2))}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3"/>
  <circle cx="${c[n - 1][0]}" cy="${c[n - 1][1]}" r="3.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/>
  <circle cx="${d[n - 1][0]}" cy="${d[n - 1][1]}" r="3" fill="var(--surface)" stroke="var(--s2)" stroke-width="1.5"/>
  <line x1="${X(ci)}" x2="${X(ci)}" y1="${pad.t}" y2="${Y(0)}" stroke="var(--text-3)" stroke-dasharray="2 3"/>
  <circle cx="${c[ci][0]}" cy="${c[ci][1]}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
  <circle cx="${d[ci][0]}" cy="${d[ci][1]}" r="3.5" fill="var(--s2)" stroke="var(--surface)" stroke-width="2"/>
  <g transform="translate(${tipX},${pad.t + 6})"><rect width="184" height="66" rx="5" fill="var(--raise)" stroke="var(--line-strong)"/>
   <text x="12" y="20" class="tt-h">${q.q} · quarter</text>
   <line x1="12" x2="24" y1="36" y2="36" stroke="var(--accent)" stroke-width="2"/><text x="30" y="40" class="tt">Contributions</text><text x="172" y="40" text-anchor="end" class="tt-v">$${q.contributions.toFixed(1)}M</text>
   <line x1="12" x2="24" y1="53" y2="53" stroke="var(--s2)" stroke-width="2"/><text x="30" y="57" class="tt">Distributions</text><text x="172" y="57" text-anchor="end" class="tt-v">$${q.distributions.toFixed(1)}M</text></g>
  </svg>`;
}
const CHART_CSS = `.chart .ax { font:500 10.5px var(--font-ui); fill:var(--text-3); font-variant-numeric:tabular-nums; } .chart .ax.on { fill:var(--text); font-weight:600; }
.chart .tt-h { font:600 11.5px var(--font-ui); fill:var(--text); } .chart .tt { font:400 11px var(--font-ui); fill:var(--text-2); } .chart .tt-v { font:600 11px var(--font-ui); fill:var(--text); font-variant-numeric:tabular-nums; }`;

/* ───────────────────────── shared blocks ───────────────────────── */
const header = ({ app = "Home", entity = "All vehicles", layout = "Operations" } = {}) => `
<header class="top">
  <div class="logo" role="img" aria-label="Aurum"></div>
  <nav class="apps" aria-label="Applications">${["Home", "Fund", "Corporate", "Data rooms", "Billing", "Compliance"].map((a) => `<a href="#" class="${a === app ? "on" : ""}">${a}</a>`).join("")}</nav>
  <button class="iconbtn" title="More applications: Sales, PMO, Chat Room" aria-label="More applications">${ic("apps")}</button>
  <div class="sel"><span class="k">Entity</span>${entity}${ic("down", 14, "faint")}</div>
  <div class="search">${ic("search", 15)}<span>Search or run a command</span><span class="kbd">Ctrl K</span></div>
  <div class="spacer"></div>
  <div class="sel" data-menu="layout"><span class="k">Layout</span>${layout}${ic("down", 14, "faint")}</div>
  <button class="iconbtn" aria-label="Notifications, 6 new">${ic("bell", 17)}<span class="badge-dot">6</span></button>
  <button class="acct" data-menu="account" aria-label="Account"><span class="avatar">LA</span>${ic("down", 14, "faint")}</button>
</header>`;
const controls = `<div class="ctl" role="toolbar" aria-label="Widget controls"><button class="d-only" aria-label="Move">${ic("grip", 14)}</button><button class="d-only" aria-label="Full screen">${ic("expand", 14)}</button><button aria-label="Widget menu">${ic("more", 14)}</button></div>`;
const panel = (cls, title, body, { sub = "", tools = "", hover = false, id = "" } = {}) =>
  `<section class="panel ${cls}${hover ? " is-hover" : ""}" ${id ? `id="${id}"` : ""}><div class="ph"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}${tools}${controls}</div>${body}</section>`;

const queue = [
  { type: "Approval", item: "Capital Call No. 2", ent: "Atlântico Venture II", amt: money(c2.amount), date: "Due " + date(c2.dueDate), st: ["Draft", "neutral"] },
  { type: "Approval", item: "Capital Call No. 3", ent: "STX-Anchor Capital Formation", amt: money(c3.amount), date: "Due " + date(c3.dueDate), st: ["Draft", "neutral"] },
  { type: "Approval", item: "Distribution bank account change", ent: inv(pcr("pcr-311").investorId), amt: "—", date: date(pcr("pcr-311").submitted), st: ["Pending review", "warn"] },
  { type: "Approval", item: "Mailing address change", ent: inv(pcr("pcr-309").investorId), amt: "—", date: date(pcr("pcr-309").submitted), st: ["Pending review", "warn"] },
  { type: "Approval", item: "Subscription documents", ent: ob("ob-1038").investorName, amt: money(ob("ob-1038").commitment), date: date(ob("ob-1038").lastActivity), st: ["Submitted", "info"] },
  { type: "Approval", item: "Subscription documents", ent: ob("ob-1030").investorName, amt: money(ob("ob-1030").commitment), date: date(ob("ob-1030").lastActivity), st: ["Submitted", "info"] },
  { type: "Due", item: "Capital Call No. 7 receivable", ent: "Cordillera Infrastructure I", amt: money(c7.amount - c7.received), date: "Due " + date(c7.dueDate), st: ["Partially funded", "warn"] },
  { type: "Due", item: "Income distribution", ent: "FIP Horizonte", amt: money(fipDist.amount, "BRL"), date: date(fipDist.date), st: ["Scheduled", "neutral"] },
];
const queueTable = (rows, hoverRow = -1) => `<table><thead><tr><th>Item</th><th>Entity</th><th class="r">Amount</th><th>Date</th><th>Status</th><th class="r"><span class="sr">Action</span></th></tr></thead><tbody>${rows
  .map((r, i) => `<tr class="${i === hoverRow ? "is-hover" : ""}"><td><span class="t">${r.item}</span></td><td class="s">${r.ent}</td><td class="r t">${r.amt}</td><td class="s num">${r.date}</td><td><span class="status st-${r.st[1]}">${r.st[0]}</span></td><td class="r"><a href="#" class="rowact">Review</a></td></tr>`)
  .join("")}</tbody></table>`;

const obligations = [
  { d: c7.dueDate, what: "Capital Call No. 7 receivable", who: "Cordillera Infrastructure I · 5 of 9 partners outstanding", amt: "+" + money(c7.amount - c7.received), kind: ["Scheduled", "neutral"] },
  { d: c2.dueDate, what: "Capital Call No. 2", who: "Atlântico Venture II · awaiting approval", amt: "+" + money(c2.amount), kind: ["Draft", "neutral"] },
  { d: c3.dueDate, what: "Capital Call No. 3", who: "STX-Anchor Capital Formation · awaiting approval", amt: "+" + money(c3.amount), kind: ["Draft", "neutral"] },
  { d: fipDist.date, what: "Income distribution", who: "FIP Horizonte · " + fipDist.source, amt: "−" + money(fipDist.amount, "BRL"), kind: ["Scheduled", "neutral"] },
];
const obligationList = `<div class="dl">${obligations
  .map((o) => `<div class="when">${day(o.d)}<small>${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(o.d + "T12:00:00Z").getUTCDay()]}</small></div><div><div class="t" style="font-weight:500">${o.what}</div><div class="kind">${o.who}</div></div><div style="text-align:right"><div class="num" style="font-weight:500">${o.amt}</div><span class="status st-${o.kind[1]}" style="font-size:11px">${o.kind[0]}</span></div>`)
  .join("")}</div>`;
const activityList = (k = 4) => `<div class="dl" style="grid-template-columns:auto 1fr auto">${D.activity.slice(0, k)
  .map((a) => `<div><span style="display:block;width:6px;height:6px;border-radius:50%;margin-top:6px;background:${a.actor === "System" ? "var(--text-3)" : "var(--s2)"}"></span></div><div><span class="t" style="font-weight:500">${a.actor}</span> <span class="muted">${a.text}</span></div><div class="faint num" style="font-size:11.5px">${day(a.at)} ${time(a.at)}</div>`)
  .join("")}</div>`;

/* ───────────────────────── 1. Home (1920) ───────────────────────── */
function home({ theme, type = "a", menus = false }) {
  const aua = `<div class="pb" style="gap:14px"><div><div class="label">Net asset value under administration</div><div class="fig-xl" style="margin-top:6px">${money(firm.nav)}</div></div>
   <div>${[["Commitments", firm.commitment], ["Called capital", firm.called], ["Contributed capital", firm.contributed], ["Unfunded commitments", firm.unfunded], ["Distributions", firm.distributed]].map(([k, v]) => `<div class="kv"><span class="muted">${k}</span><span>${money(v)}</span></div>`).join("")}</div>
   <p class="note" style="margin-top:auto">${live.length} vehicles · USD, BRL at indicative ${FX.toFixed(2)} · NAV includes ${money(firm.receivable)} called and not yet received.</p></div>`;
  const act = `<div class="pb" style="padding:10px 16px 12px; gap:8px"><div style="display:flex;gap:8px;align-items:center"><span class="chip"><span class="sw" style="background:var(--accent)"></span>Contributions</span><span class="chip"><span class="sw" style="background:var(--s2)"></span>Distributions</span><span class="faint" style="margin-left:auto;font-size:11.5px">USD millions, from the general ledger</span></div>
   <div style="flex:1;min-height:0">${activityChart(1076, 268)}</div><p class="note">* ${flows.at(-1).q} to date — receipts and distributions recorded up to ${date(TODAY)}; the quarter is still open.</p></div>`;
  const wq = `<div class="tabs" role="tablist"><button class="on">All <span class="n">11</span></button><button>Approvals <span class="n">6</span></button><button>Due <span class="n">2</span></button><button>Exceptions <span class="n">2</span></button><button>Tasks <span class="n">1</span></button></div><div style="padding:6px 6px 4px">${queueTable(queue, menus ? 2 : -1)}</div>`;
  const nav = `<div class="pb"><div class="alloc">${navByVehicle.map((v, i) => `<span>${v.name}</span><span class="num" style="font-weight:500">${money(v.usd)}${v.cur === "BRL" ? `<span class="faint" style="font-weight:400"> ¹</span>` : ""}</span><div class="bar"><i style="width:${((v.usd / navByVehicle[0].usd) * 100).toFixed(1)}%"></i></div>`).join("")}</div>
   <p class="note" style="margin-top:auto">¹ ${money(navByVehicle.find((v) => v.cur === "BRL").nav, "BRL")} at indicative ${FX.toFixed(2)}.</p></div>`;
  const seg = `<div class="seg" style="margin-left:8px"><button>1Y</button><button class="on">9Q</button><button>All</button></div>`;
  const body = `${header({ app: "Home", entity: "All vehicles", layout: "Operations" })}
  <div class="shell"><aside class="side" aria-label="Home"><h6>Home</h6>
    <a href="#" class="on">${hex()}${ic("home")}Overview</a><a href="#">${ic("queue")}Work queue<span class="count">11</span></a><a href="#">${ic("calendar")}Calendar</a><a href="#">${ic("activity")}Activity</a>
    <div class="foot"><div style="font-weight:500">L. Andrade</div><div class="faint">Fund operations</div></div></aside>
  <main>
    ${panel("s4", "Assets under administration", aua)}
    ${panel("s8", "Capital activity", act, { tools: seg, hover: menus })}
    ${panel("s8", "Work queue", wq, { sub: "Approvals, due dates, exceptions and tasks" })}
    ${panel("s4", "NAV by vehicle", nav, { sub: "USD" })}
    ${panel("s6", "Upcoming obligations", `<div class="pb" style="padding-top:6px">${obligationList}</div>`, { sub: "Next 30 days" })}
    ${panel("s6", "Recent activity", `<div class="pb" style="padding-top:6px">${activityList()}</div>`)}
  </main></div>`;
  return page("Home", body, { theme, type, extraCss: CHART_CSS + ".sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}" });
}

/* ───────────────────────── 2. Header menus & interaction states ───────────────────────── */
function menusFrame(theme) {
  const layoutMenu = `<div class="menu" style="right:306px;top:48px"><h6>Layouts</h6>${["Operations", "Executive overview", "Fund review", "Treasury"].map((l, i) => `<div class="it ${i === 0 ? "on" : ""}">${ic("layers", 15)}${l}${i === 0 ? `<span class="tick">${ic("check", 14)}</span>` : ""}</div>`).join("")}<hr><div class="it">${ic("plus", 15)}Add widget…</div><div class="it">${ic("config", 15)}Save layout as…</div><div class="it">${ic("reset", 15)}Reset to default</div></div>`;
  const acctMenu = `<div class="menu" style="right:10px;top:48px;width:280px"><div style="padding:10px 10px 12px;display:flex;gap:10px;align-items:center"><span class="avatar" style="width:32px;height:32px">LA</span><div><div style="font-weight:600">L. Andrade</div><div class="faint" style="font-size:11.5px">Fund operations</div></div></div><hr>
   <h6>Appearance</h6><div style="padding:2px 8px 8px"><div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)"><button class="${theme === "light" ? "on" : ""}">Light</button><button class="${theme === "dark" ? "on" : ""}">Dark</button><button>System</button></div></div>
   <h6>Density</h6><div style="padding:2px 8px 8px"><div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(2,1fr)"><button class="on">Comfortable</button><button>Compact</button></div></div><hr>
   <div class="it">${ic("user", 15)}Profile</div><div class="it">${ic("shield", 15)}Security</div><div class="it">${ic("logout", 15)}Sign out</div></div>`;
  const appsMenu = `<div class="menu" style="left:520px;top:48px;width:240px"><h6>More applications</h6>${[["Sales", "#C46A1E"], ["PMO", "#8A4A9E"], ["Chat Room", "#1F8A84"]].map(([n, c]) => `<div class="it"><span style="width:8px;height:8px;border-radius:2px;background:${c}"></span>${n}</div>`).join("")}<p class="note" style="padding:6px 10px 6px">Workspace colours are identifiers only (tenant tokens).</p></div>`;
  const states = `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:24px 18px">
   ${["At rest", "Pointer hover", "Keyboard focus", "Touch: widget menu"].map((label, i) => `<div><div class="label" style="margin-bottom:8px">${label}</div>
     <section class="panel ${i === 1 ? "is-hover" : ""}" style="height:210px"><div class="ph"><h3>Upcoming obligations</h3>
       <div class="ctl" style="${i ? "opacity:1" : ""}">${i === 3 ? "" : `<button>${ic("grip", 14)}</button><button class="${i === 2 ? "is-focus" : ""}">${ic("expand", 14)}</button>`}<button>${ic("more", 14)}</button></div></div>
       <div class="pb" style="padding-top:6px"><div class="dl">${obligations.slice(0, 2).map((o) => `<div class="when">${day(o.d)}</div><div><div style="font-weight:500">${o.what}</div><div class="kind">${o.who.split(" · ")[0]}</div></div><div class="num" style="font-weight:500">${o.amt}</div>`).join("")}</div></div>
       ${i === 3 ? `<div class="menu" style="right:8px;top:38px;width:210px">${[["grip", "Move"], ["resize", "Resize"], ["expand", "Full screen"], ["collapse", "Collapse"], ["config", "Configure"], ["x", "Remove"]].map(([k, t]) => `<div class="it">${ic(k, 15)}${t}</div>`).join("")}</div>` : ""}</section>
     ${i === 2 ? `<p class="note" style="margin-top:8px">Tab reaches the controls; Enter opens; Esc returns focus.</p>` : i === 3 ? `<p class="note" style="margin-top:8px">On touch, one “More” button stays visible and opens every control.</p>` : i === 1 ? `<p class="note" style="margin-top:8px">Controls appear on hover; the row action turns gold.</p>` : `<p class="note" style="margin-top:8px">Quiet by default: title and content only.</p>`}</div>`).join("")}
  </div>`;
  const rows = `<div style="padding:0 18px 22px"><div class="label" style="margin-bottom:8px">Row action — neutral at rest, gold on hover or focus</div><section class="panel"><div style="padding:6px">${queueTable(queue.slice(0, 3), 1)}</div></section></div>`;
  const body = `<div style="position:relative">${header({})}${layoutMenu}${acctMenu}${appsMenu}<div style="height:330px;background:var(--bg)"></div></div>${states}${rows}`;
  return page("Header menus and states", body, { theme });
}

/* ───────────────────────── 3. Admin Home — mobile (390) ───────────────────────── */
function mobileHome(theme) {
  const approvals = queue.filter((q) => q.type === "Approval").slice(0, 4);
  const body = `
  <header class="top" style="height:52px;gap:8px;padding:0 10px"><button class="iconbtn" aria-label="Menu">${ic("menu", 18)}</button><div class="logo" style="width:92px"></div><div class="spacer"></div><button class="iconbtn" aria-label="Search">${ic("search", 17)}</button><button class="iconbtn" aria-label="Notifications">${ic("bell", 17)}<span class="badge-dot">6</span></button><span class="avatar">LA</span></header>
  <div style="padding:14px 12px 24px;display:flex;flex-direction:column;gap:12px">
   <div style="padding:2px 4px"><div class="faint" style="font-size:12px">${date(TODAY)} · Fund operations</div><div style="font:600 18px/1.3 var(--font-ui);margin-top:2px">Home</div></div>
   <section class="panel"><div class="ph"><h3>Needs your approval</h3><span class="sub">6</span><div class="ctl" style="opacity:1"><button aria-label="Widget menu">${ic("more", 14)}</button></div></div>
    ${approvals.map((q) => `<a href="#" style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:11px 16px;border-top:1px solid var(--line-soft)"><span style="font-weight:500">${q.item}</span><span class="num" style="font-weight:500;text-align:right">${q.amt}</span><span class="muted" style="font-size:12px">${q.ent}</span><span class="status st-${q.st[1]}" style="justify-self:end">${q.st[0]}</span></a>`).join("")}
    <a href="#" style="display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-top:1px solid var(--line-soft);color:var(--text-2);font-weight:500">Open work queue (11)${ic("right", 15)}</a></section>
   <section class="panel"><div class="ph"><h3>Outstanding obligations</h3></div><div class="pb">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:500">Capital Call No. 7</span><span class="muted num" style="font-size:12px">Due ${date(c7.dueDate)}</span></div>
    <div class="muted" style="font-size:12px;margin-top:2px">Cordillera Infrastructure I · 5 of 9 partners outstanding</div>
    <div class="fig-l" style="margin-top:10px;font-size:28px">${money(c7.amount - c7.received)}</div><div class="faint" style="font-size:12px">outstanding of ${money(c7.amount)}</div>
    <div class="bar" style="height:5px;margin:10px 0 4px"><i class="lead" style="width:${((c7.received / c7.amount) * 100).toFixed(1)}%"></i></div><div class="faint num" style="font-size:11.5px">${((c7.received / c7.amount) * 100).toFixed(1)}% received</div>
    <div style="display:flex;gap:8px;margin-top:12px"><a class="btn primary" style="flex:1">${ic("receipt", 15)}Record receipt</a><a class="btn" style="flex:1">Send reminder</a></div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line-soft);display:grid;grid-template-columns:1fr auto;gap:2px 10px"><span style="font-weight:500">Income distribution</span><span class="num" style="font-weight:500">−${money(fipDist.amount, "BRL")}</span><span class="muted" style="font-size:12px">FIP Horizonte · ${date(fipDist.date)}</span><span class="status st-neutral" style="justify-self:end">Scheduled</span></div></div></section>
   <section class="panel"><div class="ph"><h3>Key balances</h3></div><div class="pb" style="padding-top:8px">
    <div class="label">Net asset value under administration</div><div class="fig-l" style="margin:4px 0 8px">${money(firm.nav)}</div>
    <div class="kv"><span class="muted">Receivable on open calls</span><span>${money(firm.receivable)}</span></div><div class="kv"><span class="muted">Ledger cash (account 1000)</span><span>${money(ledgerCashUSD)}</span></div><div class="kv"><span class="muted">Unfunded commitments</span><span>${money(firm.unfunded)}</span></div>
    <p class="note" style="margin-top:6px">USD, BRL at indicative ${FX.toFixed(2)}.</p></div></section>
   <section class="panel"><div class="ph"><h3>Recent activity</h3></div><div class="pb" style="padding-top:2px">${D.activity.slice(0,3).map((a,i)=>`<div style="padding:10px 0;${i?"border-top:1px solid var(--line-soft)":""}"><div><span style="font-weight:500">${a.actor}</span> <span class="muted">${a.text}</span></div><div class="faint num" style="font-size:11.5px;margin-top:2px">${day(a.at)} ${time(a.at)}</div></div>`).join("")}</div></section>
   <section class="panel"><div class="ph"><h3>Analytics</h3><span class="sub">Collapsed on mobile</span></div>
    ${["Capital activity", "NAV by vehicle", "Upcoming obligations — all"].map((t) => `<a href="#" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid var(--line-soft)"><span>${t}</span>${ic("right", 15, "faint")}</a>`).join("")}</section>
  </div>`;
  return page("Home — mobile", body, { theme, extraCss: CHART_CSS });
}

/* ───────────────────────── 4. Investor portal (desktop & mobile) ───────────────────────── */
function portal(theme) {
  const ca = calloway, rec = callowayC7.amount - callowayC7.paid, pct = (v) => ((v / ca.commitment) * 100).toFixed(1);
  const body = `
  <header class="top ptop" style="height:64px;gap:26px;padding:0 32px">
   <div class="wm"><b>${cordillera.wordmark.text}</b><span>${cordillera.wordmark.sub}</span></div>
   <nav class="apps pnav" aria-label="Investor portal">${["Overview", "Documents", "Subscriptions", "Profile"].map((a, i) => `<a href="#" class="${i ? "" : "on"}">${a}</a>`).join("")}</nav>
   <div class="spacer"></div>
   <button class="acct pacct"><span class="avatar">MC</span><span class="nm">Margaret Calloway</span>${ic("down", 14, "faint")}</button>
   <button class="iconbtn mob" aria-label="Menu">${ic("menu", 18)}</button>
  </header>
  <div class="wrap">
   <section class="hello"><div class="faint">${inv("inv-calloway")} · Trust · Florida, US</div><h1>${inv("inv-calloway")}</h1></section>
   <div class="g1">
    <section class="panel value"><div class="pb" style="padding:24px 28px">
      <div class="label">Account value · net asset value</div><div class="fig-xl" style="margin:6px 0 4px">${money(ca.nav)}</div>
      <div class="faint" style="font-size:12px">${D.fundById("cordillera-infra-i").name} · as of ${date(TODAY)}</div>
      <div class="cbar"><i style="width:${pct(ca.contributed)}%;background:var(--sponsor)"></i><i class="hatch" style="width:${pct(rec)}%"></i><i style="flex:1;background:var(--line-soft)"></i></div>
      <div class="legend"><span><b style="background:var(--sponsor)"></b>Contributed ${money(ca.contributed)}</span><span><b class="hatch"></b>Called, due ${day(c7.dueDate)} ${money(rec)}</span><span><b style="background:var(--line-strong)"></b>Unfunded ${money(ca.unfunded)}</span></div>
      <div class="figrow">${[["Commitment", ca.commitment], ["Called", ca.called], ["Contributed", ca.contributed], ["Distributions", ca.distributed]].map(([k, v]) => `<div><div class="label">${k}</div><div class="fig-m">${money(v)}</div></div>`).join("")}</div>
      <p class="note" style="margin-top:14px">Net asset value includes ${money(rec)} called on Capital Call No. 7 and not yet received. Unfunded is your commitment less capital called.</p></div></section>
    <section class="panel next"><div class="pb" style="padding:24px 26px">
      <div class="label">Upcoming obligation</div><div style="font:600 17px/1.3 var(--font-ui);margin-top:8px">Capital Call No. 7</div>
      <div class="fig-l" style="margin:10px 0 2px">${money(rec)}</div><div class="muted num">Due ${date(c7.dueDate)}</div>
      <p class="muted" style="margin-top:12px">Your share of a ${money(c7.amount)} call for ${c7.investments[0].name} and the management fee.</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto;padding-top:18px"><a class="btn sponsor">View notice</a><a class="btn">${ic("download", 15)}Download PDF</a></div></div></section>
   </div>
   <section class="panel"><div class="ph" style="padding-left:24px"><h3>Holdings</h3></div><div style="padding:6px 14px 8px"><table><thead><tr><th>Fund</th><th class="r">Commitment</th><th class="r">Contributed</th><th class="r">Unfunded</th><th class="r">Distributions</th><th class="r">NAV</th></tr></thead><tbody><tr><td><span class="t">${D.fundById("cordillera-infra-i").name}</span></td>${[ca.commitment, ca.contributed, ca.unfunded, ca.distributed].map((v) => `<td class="r">${money(v)}</td>`).join("")}<td class="r t">${money(ca.nav)}</td></tr></tbody></table></div></section>
   <div class="g2">
    <section class="panel"><div class="ph" style="padding-left:24px"><h3>Statements and documents</h3></div><div style="padding:4px 24px 10px">${docsCord.map((d) => `<a href="#" class="doc">${ic("file", 17, "faint")}<span><span style="font-weight:500">${d.name}</span><span class="faint num" style="display:block;font-size:12px">${date(d.date)} · PDF ${d.size}</span></span>${ic("download", 16, "faint")}</a>`).join("")}</div></section>
    <div class="stack">
     <section class="panel"><div class="pb" style="padding:20px 24px;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;align-items:center">
       <span class="avatar" style="width:40px;height:40px;grid-row:span 2;font-size:13px">LA</span><span style="font-weight:600">${D.investorById("inv-calloway").relationshipManager}</span><span class="muted" style="font-size:12px">Your relationship manager</span>
       <a class="btn" style="grid-column:1/-1;margin-top:12px">${ic("mail", 15)}Email investor relations</a><span class="faint" style="grid-column:1/-1;font-size:11.5px;text-align:center">${cordillera.emailFrom.match(/<(.*)>/)[1]}</span></div></section>
     <section class="panel"><div class="ph" style="padding-left:24px"><h3>Your requests</h3></div><div class="pb" style="padding:14px 24px 18px">
       <div style="display:flex;justify-content:space-between;gap:10px"><span style="font-weight:500">${pcr("pcr-309").field}</span><span class="status st-warn">${pcr("pcr-309").status}</span></div>
       <div class="faint num" style="font-size:12px;margin-top:2px">Submitted ${date(pcr("pcr-309").submitted)}</div><div class="muted" style="margin-top:8px">To ${pcr("pcr-309").to}</div></div></section>
    </div>
   </div>
  </div>
  <footer class="pfoot"><span>${cordillera.name}</span><span class="pw">Powered by <i class="logo" style="width:68px;height:16px;display:inline-block;vertical-align:middle"></i></span></footer>`;
  const css = `
  .wm{display:flex;flex-direction:column;line-height:1.1} .wm b{font:600 14px var(--font-ui);letter-spacing:.2em} .wm span{font-size:11px;color:var(--text-2)}
  .pnav a.on::after{background:var(--sponsor)} .pacct .nm{font-weight:500;margin:0 2px 0 4px} .mob{display:none}
  .wrap{max-width:1180px;margin:0 auto;padding:30px 32px 36px;display:flex;flex-direction:column;gap:14px}
  .hello h1{font:400 36px/1.15 var(--font-serif);letter-spacing:-.01em;margin:6px 0 10px}
  .g1{display:grid;grid-template-columns:2fr 1fr;gap:14px} .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px} .stack{display:flex;flex-direction:column;gap:14px}
  .next{border-left:2px solid var(--sponsor)}
  .cbar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:20px 0 10px;gap:2px} .cbar i{display:block}
  .hatch{background:repeating-linear-gradient(135deg,var(--sponsor) 0 3px,transparent 3px 6px)!important}
  .legend{display:flex;gap:6px 20px;flex-wrap:wrap;font-size:12px;color:var(--text-2)} .legend b{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:-1px}
  .legend span{font-variant-numeric:tabular-nums}
  .figrow{display:grid;grid-template-columns:repeat(4,1fr);margin-top:22px;padding-top:16px;border-top:1px solid var(--line-soft)} .figrow>div{padding-right:12px} .figrow>div+div{padding-left:16px;border-left:1px solid var(--line-soft)}
  .figrow .fig-m{margin-top:4px}
  .doc{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid var(--line-soft)} .doc:first-child{border-top:0}
  .pfoot{display:flex;justify-content:space-between;align-items:center;max-width:1180px;margin:0 auto;padding:18px 32px 26px;color:var(--text-3);font-size:12px;border-top:1px solid var(--line-soft)}
  @media (max-width:767px){
   .ptop{padding:0 16px!important;height:58px!important} .pnav,.pacct{display:none!important} .mob{display:grid}
   .wrap{padding:20px 14px 24px;gap:12px} .hello h1{font-size:30px}
   .g1,.g2{grid-template-columns:1fr} .value .pb,.next .pb{padding:20px!important}
   .value .fig-xl{font-size:40px} .figrow{grid-template-columns:1fr 1fr;row-gap:14px} .figrow>div:nth-child(3){border-left:0;padding-left:0}
   .next{order:-1} .g1{display:flex;flex-direction:column}
   .g1 .next{order:2} .holdings-hide{display:none}
   table thead{display:none} table tr{display:grid;grid-template-columns:1fr auto;gap:4px 10px} table td{border:0;padding:3px 0} table td:first-child{grid-column:1/-1;padding-bottom:6px}
   table td.r::before{content:attr(data-l);float:left;color:var(--text-2);font-weight:400;margin-right:12px} table td.r{grid-column:1/-1;text-align:right}
   .pfoot{flex-direction:column;gap:6px;padding:16px}
  }`;
  return page("Investor portal", body, { theme, extraCss: css });
}

/* ───────────────────────── 5. Typography comparison ───────────────────────── */
function typography() {
  const vals = [["Net asset value under administration", money(firm.nav)], ["Scheduled distribution, FIP Horizonte", money(fipDist.amount, "BRL")], ["Cordillera Infrastructure I, NAV", money(D.fundTotals("cordillera-infra-i").nav)], ["Receivable, Capital Call No. 7", money(c7.amount - c7.received)], ["Ledger cash", money(ledgerCashUSD)]];
  const cell = (theme, type) => `<div data-theme="${theme}" data-type="${type}" style="background:var(--bg);color:var(--text);padding:22px;border-radius:8px;border:1px solid var(--line)">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px"><div style="font-weight:600">Option ${type.toUpperCase()} · ${type === "a" ? "Manrope Light" : "IBM Plex Sans Light"} + Inter</div><div class="faint" style="font-size:12px">${theme === "dark" ? "Obsidian" : "Platinum"}</div></div>
    <section class="panel"><div class="ph"><h3>Assets under administration</h3></div><div class="pb" style="gap:12px"><div><div class="label">Net asset value under administration</div><div class="fig-xl" style="margin-top:6px">${money(firm.nav)}</div></div>
      <div>${[["Commitments", firm.commitment], ["Called capital", firm.called], ["Unfunded commitments", firm.unfunded]].map(([k, v]) => `<div class="kv"><span class="muted">${k}</span><span>${money(v)}</span></div>`).join("")}</div></div></section>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
     <section class="panel"><div class="ph"><h3>Display face, right-aligned</h3></div><div class="pb" style="padding:8px 16px 12px">${vals.map(([k, v]) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-top:1px solid var(--line-soft)"><span class="faint" style="font-size:11px">${k.split(",")[0]}</span><span style="font:var(--figure-weight) 21px var(--font-figure);font-variant-numeric:tabular-nums lining-nums;letter-spacing:var(--figure-track)">${v}</span></div>`).join("")}</div></section>
     <section class="panel"><div class="ph"><h3>Inter, table setting</h3></div><div class="pb" style="padding:8px 16px 12px">${vals.map(([k, v]) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-top:1px solid var(--line-soft)"><span class="faint" style="font-size:11px">${k.split(",")[0]}</span><span class="num" style="font-weight:500">${v}</span></div>`).join("")}</div></section>
    </div></div>`;
  const body = `<div data-theme="light" style="background:#E9E7E2;padding:28px;min-height:100vh;color:#14181D;font-family:var(--font-ui)">
   <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px"><div><div style="font:600 20px var(--font-ui)">Typography comparison — Home hero</div><div style="color:#5A6069;margin-top:4px">Self-hosted @fontsource, open licence (SIL OFL). Inter for operational text; Source Serif 4 reserved for investor-portal headings. Tabular lining figures throughout.</div></div></div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">${cell("dark", "a")}${cell("dark", "b")}${cell("light", "a")}${cell("light", "b")}</div></div>`;
  return page("Typography comparison", body, { theme: "light" });
}

/* ───────────────────────── 6. Widget library & default layouts ───────────────────────── */
function widgets() {
  const lib = {
    Home: [["Work queue", "Act on approvals, due dates, exceptions, tasks", "Calls, onboarding, change requests", "M L", "Tabs, rows"], ["Assets under administration", "Firm position at a glance", "Partner capital accounts", "S M", "Currency view"], ["Capital activity", "Contributions vs distributions over time", "General ledger journal", "M L XL", "Period, series"], ["NAV by vehicle", "Concentration across vehicles", "Partner capital accounts", "S M", "Sort, top N"], ["Upcoming obligations", "What is due next", "Calls, distributions", "S M", "Horizon, include drafts"], ["Recent activity", "Audit-trail summary", "Activity log", "S M", "Rows"]],
    Fund: [["Net asset value and ratios", "Vehicle NAV, TVPI, DPI", "Fund totals", "S", "—"], ["Capital activity timeline", "Cumulative called and distributed", "Calls, distributions", "M L XL", "Period, series"], ["Call collection", "Progress of an open call", "Call allocations", "S M", "Call"], ["Partners", "Commitment to NAV by partner", "Capital accounts", "M L", "Columns, density"], ["Fund terms", "Key LPA terms", "Fund record", "S M", "—"], ["Documents", "Latest notices and reports", "Document register", "S M", "Category"], ["Onboarding pipeline", "Subscriptions in progress", "Onboarding submissions", "M L", "Stage"]],
    Treasury: [["Scheduled capital flows", "Scheduled and draft flows, next 30–90 days", "Calls, distributions", "M L XL", "Horizon, include drafts"], ["Ledger cash", "Cash per GL account 1000", "General ledger", "S", "Vehicle"], ["Bank accounts", "Accounts, connection, statements", "Bank account register", "L XL", "Columns"], ["Receipts by call", "Expected vs received per partner", "Call allocations", "M L", "Call"], ["Bank-detail approvals", "Four-eyes changes to bank details", "Change requests", "S M", "—"]],
    Compliance: [["KYC exceptions", "Potential matches and expiring IDs", "Investor and onboarding KYC", "S M", "Severity"], ["Account change requests", "Investor-initiated changes awaiting review", "Change requests", "S M", "Field type"]],
  };
  const layouts = {
    Operations: [["Assets under administration", 4, 2], ["Capital activity", 8, 2], ["Work queue", 8, 3], ["NAV by vehicle", 4, 3], ["Upcoming obligations", 6, 2], ["Recent activity", 6, 2]],
    "Executive overview": [["Assets under administration", 4, 2], ["Capital activity", 8, 2], ["NAV by vehicle", 4, 3], ["Upcoming obligations", 4, 3], ["Call collection", 4, 3], ["Recent activity", 12, 1]],
    "Fund review": [["Net asset value and ratios", 4, 2], ["Capital activity timeline", 8, 2], ["Call collection", 4, 3], ["Partners", 8, 3], ["Fund terms", 6, 2], ["Documents", 6, 2]],
    Treasury: [["Scheduled capital flows", 8, 2], ["Ledger cash", 4, 2], ["Bank accounts", 12, 2], ["Receipts by call", 8, 3], ["Bank-detail approvals", 4, 3]],
  };
  const caps = [["grip", "Drag and reposition"], ["resize", "Resize: S 3 · M 4–6 · L 8 · XL 12 columns"], ["expand", "Full screen analytical view"], ["collapse", "Minimise to its header"], ["x", "Remove; restore from Add widget"], ["config", "Configure supported data and display"], ["layers", "Saved within named layouts"], ["reset", "Reset layout to default"]];
  const legend = [["Historical", `<svg width="44" height="10"><path d="M2 5h40" stroke="var(--accent)" stroke-width="2"/></svg>`], ["To date (open period)", `<svg width="44" height="10"><path d="M2 5h22" stroke="var(--accent)" stroke-width="2"/><path d="M24 5h14" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3"/><circle cx="39" cy="5" r="3" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/></svg>`], ["Scheduled", `<svg width="44" height="10"><rect x="2" y="1" width="40" height="8" rx="1" fill="none" stroke="var(--accent)"/></svg>`], ["Draft", `<svg width="44" height="10"><path d="M2 5h40" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/></svg>`], ["Sample series", `<svg width="44" height="10"><rect x="2" y="1" width="40" height="8" fill="url(#hatch)" stroke="var(--line-strong)"/></svg>`]];
  const body = `<svg width="0" height="0" style="position:absolute"><defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.5" height="5" fill="var(--text-3)"/></pattern></defs></svg>
  <div style="padding:30px 32px 36px">
   <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px"><div><div style="font:600 22px var(--font-ui)">Widget library and default layouts</div><div class="muted" style="margin-top:4px">Design only. Widget customisation is built in its scheduled stage (tokens → shell → tables and charts → drawers and command menu → widgets).</div></div><div class="faint" style="font-size:12px">Direction D · ${date(TODAY)}</div></div>
   <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:18px;align-items:start">
    <section class="panel"><div class="ph"><h3>Library — by application and purpose</h3><span class="sub">Supported data only</span></div><div style="padding:4px 8px 10px">
     <table><thead><tr><th>Widget</th><th>Purpose</th><th>Data source (src/lib)</th><th>Sizes</th><th>Options</th></tr></thead><tbody>
     ${Object.entries(lib).map(([app, ws]) => `<tr><td colspan="5" style="padding:14px 10px 6px;border-top:0"><span style="font-weight:600">${app}</span></td></tr>` + ws.map((w) => `<tr><td><span class="t">${w[0]}</span></td><td class="s">${w[1]}</td><td class="s">${w[2]}</td><td class="num">${w[3]}</td><td class="s">${w[4]}</td></tr>`).join("")).join("")}
     </tbody></table></div></section>
    <div style="display:flex;flex-direction:column;gap:18px">
     <section class="panel"><div class="ph"><h3>Every widget supports</h3><span class="sub">Hover, keyboard focus and touch</span></div><div class="pb" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px">${caps.map(([k, t]) => `<div style="display:flex;gap:10px;align-items:center">${ic(k, 16, "muted")}<span>${t}</span></div>`).join("")}</div></section>
     <section class="panel"><div class="ph"><h3>Chart language — data status</h3></div><div class="pb" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px">${legend.map(([t, s]) => `<div style="display:flex;gap:12px;align-items:center">${s}<span>${t}</span></div>`).join("")}<p class="note" style="grid-column:1/-1">Gold marks the primary series; neutrals mark secondary series; green and red only for gains, losses and status. Sample series appear only in prototypes and always carry the label.</p></div></section>
     <section class="panel"><div class="ph"><h3>Default layouts</h3><span class="sub">12-column grid · rows to scale</span></div><div class="pb" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${Object.entries(layouts).map(([n, ws]) => `<div><div style="font-weight:600;margin-bottom:8px">${n}</div><div style="display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:22px;gap:4px;padding:6px;background:var(--bg);border:1px solid var(--line-soft);border-radius:5px">${ws.map(([w, c, r]) => `<div style="grid-column:span ${c};grid-row:span ${r};background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:4px 6px;font-size:10.5px;line-height:1.2;color:var(--text-2);overflow:hidden">${w}</div>`).join("")}</div></div>`).join("")}
     </div></section>
    </div></div></div>`;
  return page("Widget library", body, { theme: "light" });
}

/* ───────────────────────── render ───────────────────────── */
const { chromium } = require("playwright-core");
const JOBS = [
  ["01-home-obsidian-1920", () => home({ theme: "dark" }), 1920],
  ["02-home-platinum-1920", () => home({ theme: "light" }), 1920],
  ["03-investor-portal-obsidian-1440", () => portal("dark"), 1440],
  ["04-investor-portal-platinum-1440", () => portal("light"), 1440],
  ["05a-investor-portal-mobile-platinum-390", () => portal("light"), 390],
  ["05b-investor-portal-mobile-obsidian-390", () => portal("dark"), 390],
  ["06a-admin-home-mobile-obsidian-390", () => mobileHome("dark"), 390],
  ["06b-admin-home-mobile-platinum-390", () => mobileHome("light"), 390],
  ["07-typography-comparison", () => typography(), 1920],
  ["08-widget-library-and-layouts", () => widgets(), 1920],
  ["09a-header-menus-and-states-obsidian", () => menusFrame("dark"), 1920],
  ["09b-header-menus-and-states-platinum", () => menusFrame("light"), 1920],
];
const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const pg = await ctx.newPage();
for (const [name, build, width] of JOBS) {
  if (only && !only.some((o) => name.includes(o))) continue;
  const file = join(SRC, name + ".html");
  writeFileSync(file, build());
  await pg.setViewportSize({ width, height: width < 800 ? 844 : 1080 });
  await pg.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  // label table cells for the mobile record layout
  await pg.evaluate(() => { for (const t of document.querySelectorAll("table")) { const h = [...t.querySelectorAll("thead th")].map((x) => x.textContent.trim()); for (const r of t.querySelectorAll("tbody tr")) [...r.children].forEach((c, i) => c.setAttribute("data-l", h[i] ?? "")); } });
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await pg.screenshot({ path: join(OUT, name + ".png"), fullPage: true });
  console.log("rendered", name, overflow > 0 ? `OVERFLOW ${overflow}px` : "");
}
// Verify that the figure fonts really loaded (not a fallback).
const fp = join(SRC, "07-typography-comparison.html");
await pg.goto(pathToFileURL(fp).href, { waitUntil: "networkidle" });
console.log("fonts loaded:", await pg.evaluate(async () => { await document.fonts.ready; return ["Inter Variable", "Manrope Variable", "IBM Plex Sans", "Source Serif 4 Variable"].map((f) => `${f}=${document.fonts.check(`300 20px "${f}"`)}`).join(" "); }));
await browser.close();
void relative; void readFileSync;
