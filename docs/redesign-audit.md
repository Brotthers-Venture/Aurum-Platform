# Redesign — Phase 1 audit

Date: 2026-11-25 · Branch `redesign` · Brief: `docs/redesign-brief.md`

Screenshots: 33 routes at 1440 px and 390 px, saved in `design/audit/` (git-ignored). Regenerate them with
`npx next dev -p 3100` and then `node tools/screenshots.mjs`. Every route returned 200.

## 1. Visual audit

### What works and should be kept
- **The data itself.** Fund pages already show the right information: vehicle, call no., notice/due dates,
  right-aligned amounts, funded %, status, and BRL shown alongside USD (`R$ 28,000,000`). The capital calls and
  banking tables are the best screens in the product and set the target density.
- **Editorial moments.** The serif headline on sign-in and `/incorporate` ("Built to endure.", "Formed properly.")
  has the right voice. Keep the serif for these, as the brief says (§6).
- **The data-room visitor gate** (`/room/cascade-lps`): sponsor brand panel on the left, a stepped gate
  (Email → Code → About you → Agreement), logged-access notes. The structure is sound. It needs restyling, not
  rethinking.
- **The Fund sidebar's information architecture**: Overview/Analytics, Administration, Capital activity,
  Accounting, Records. The grouping is right.
- **Tabular numerals.** These are already in place through `.num`.

### What does not work
| Area | Problem |
|---|---|
| **Hub** (`/admin`) | A large yellow double-hexagon with six unlabelled coloured hexagons. Nothing is labelled until you hover, and nothing shows the state of the firm (no calls due, no approvals, no tasks). It reads as a splash screen, not an operating console. Its six saturated colours (orange, purple, teal, blue, green, red) are the loudest thing in the product. |
| **Shell** | Each area has a different shell. Fund has a floating rounded cream sidebar card. Sales, Billing and Brand have no sidebar. PMO has its own flat sidebar. Chat Room has a hexagon rail plus a second sidebar. The portals have a top nav. The pill-shaped search bar does nothing (no handler, no command palette). The `⋮` and apps-grid buttons hide primary navigation. |
| **Canvas** | Heavy beige (`canvas #F1EDE4`, Aurum preset) everywhere, with white cards on top. The brief asks to move away from heavy beige (§5). |
| **Gold** | Used as a fill: the sidebar active state (champagne block), the login background (full-bleed gold-to-black photo gradient), the primary button on sign-in, and the hub centrepiece. That is too much for "controlled accent" (§5, §11). |
| **Cards everywhere** | KPI strips are four separate rounded white cards (capital calls, sales). The Fund overview is nine rounded widgets with their own headers, icons and menus. This is the "every metric is a card" pattern the brief prohibits (§8). |
| **Workspace colour** | Each workspace paints its primary button in its own colour (orange "New deal", purple "New project"). PMO fills table cells with saturated status blocks (orange/green/purple). This conflicts with "one operating system — no module with its own visual identity" (§9). |
| **Typography** | About 20 ad-hoc text sizes (`text-[12.5px]`, `text-[11.5px]`…) and 16 radii. There is no type scale. Page titles vary (Sales has an icon plus a title, PMO a plain title, Fund an eyebrow plus a title). |
| **GP portal** | Fund cards use dark hero images with decorative hexagons and a big wordmark (the product's most "template-like" screen). The KPI band below is good. |
| **Mobile (390 px)** | **Broken in the Fund Solution.** The sidebar does not collapse; it takes ~65% of the width and squeezes content into one-word lines. Sales KPI cards and kanban columns are crushed, not stacked. The investor portal's holdings table overflows with no scroll affordance, and its header nav is cut off. The hub search collapses to "Search fur". |

## 2. Frontend architecture

**Styling.** `src/app/globals.css` defines the Tailwind v4 `@theme`:
- Fonts: Hanken Grotesk, Source Serif 4 and IBM Plex Mono.
- Colour scales: `ink-950..600`, `stone-25..700` and `gold-*`.
- Status pairs: positive/caution/negative/info.
- Shadows: `--shadow-card` and `--shadow-lift`.
- Helpers: `.num`, `.eyebrow`, `.data-table` and `.scroll-quiet`.

The `:root` block holds the `--tenant-*` variables.

**Tenant brand.** `src/lib/brand.ts` holds:
- `Brand`: names, logos, mark shape, 6 colours, 6 module colours, serif/sans, sign-in copy and legal text.
- `brandVars()`: it emits `--tenant-*`, rebuilds the `ink-*` and `gold-*` scales with `color-mix`, and sets fonts and `--module-*`.
- Presets: Aurum, Northbridge and Halcyon.

`BRAND_BOOT` applies saved vars before first paint. `BrandProvider` (root layout) exposes `useBrand()`.

**A second brand system.** `src/lib/gps.ts` defines its own GP `Brand` with `brandStyle()`, which sets `--brand*` inline for the GP and investor portals. It duplicates `contrast()` and hard-codes `#0F2340`. The redesign must define how sponsor branding layers on the tenant system instead of running beside it.

**Shared components.** There are two kits:
- `ui.tsx`: Button (6 variants), PageHeader, Panel, Stat, Status, Progress, KeyValue, Avatar. About 60 importers.
- `firm/kit.tsx`: ModuleHeader, ModuleTabs, ActionButton, GhostButton, Card, Kpi, Pill, `th`/`td` strings, Toast, field styles.

The two kits overlap:
- Two button systems.
- `Stat` and `Kpi` do the same job.
- `Status` and `Pill` do the same job.
- `Panel` is defined 3 times.
- `Card` and `Kpi` are copied into Billing.

Missing components:
- No table component. 35 files hand-write `<table>` three different ways.
- No dialog or drawer. 13 hand-rolled overlays.
- No dropdown or menu. 19 native `<select>`.
- No command palette.
- Three tab implementations.

**Hard-coding.**
- About 343 hex literals and 166 `[#hex]` classes.
- About 2,560 arbitrary Tailwind values.
- 269 inline `style={}`.

The worst files are LegendWorkspace, IncorporationFlow, PmoWorkspace, PlanSheet, RoomConsole, CommsWorkspace and BillingWorkspace. The kit `Pill` tones themselves are off-token hex.

**Layouts.**
- Root.
- `/admin`: role-preview provider only.
- `/admin/fund`: FundSidebar plus AdminTopBar.
- GP portal and investor portal: BrandedHeader and BrandedFooter.

Admin pages outside Fund each render `AdminTopBar` themselves and have no shared shell.

**Charts and icons.**
- Charts are hand-rolled SVG with no library: `analytics/charts.tsx` with hex palettes, plus `FlowsChart.tsx`, which appears unused.
- `FundCard.tsx` draws decorative gradients and grain.
- Icons are lucide-react only. This is good: one icon set (§11).

## 3. Brand assets
| File | Size | Use | Gold (sampled) |
|---|---|---|---|
| `public/brand/aurum-logo-dark.png` | 1276×405 | light backgrounds | **#F8C618** |
| `public/brand/aurum-logo-white.png` | 1404×408 | dark backgrounds | **#FFCA00** |
| `public/brand/aurum-mark.svg` | — | emblem | — |
| `public/brand/login-bg.jpg` | — | sign-in photo (gold/black gradient) | — |

The two official files use slightly different golds. The design tokens should match the light-background logo
(**#F8C618**), since the workspace will be light, and check that the white logo sits on navy without a visible
clash. Gold on white fails WCAG AA for text (≈1.7:1), so gold may never carry text or thin icons on light
surfaces; on Obsidian Navy it passes comfortably. This confirms the brief: gold is an indicator, never a label.

## 4. Implications for Phase 2 (Stitch directions)
1. One shell for every admin area, which replaces four shell variants. Either a navy sidebar or a light shell (§7). Both go to Stitch.
2. The hub becomes a real console. Keep the emblem as a signature, but small. Show the firm's state: due dates, approvals, exceptions, and solutions with live counts.
3. Use tables and ruled KPI bands instead of card grids. The GP portal's ruled KPI band is already the right pattern.
4. Workspace colours become small identifiers (a rule, a dot, an icon tint), never button fills or cell fills.
5. Mobile must be designed, not shrunk: a collapsible nav, stacked KPIs, and tables that scroll horizontally with a pinned first column.
6. The foundations to build before any page: a table, a dialog/drawer, a menu/select, a command palette, a tab component and one button system.
