# Aurum design system — DRAFT (Phase 4)

Status: **draft for owner approval at Phase 6.** Nothing here is implemented yet.
Direction: A (Obsidian) shell · B work-queue home and record drawer · C portal layout on white/platinum surfaces
(see `docs/redesign-log.md`, decision 2026-11-25).
This is the **default theme**. Every value below is a tenant brand token or is derived from one; nothing is hard-coded per page.

---

## 1. Brand tokens (white label)

### 1.1 `Brand.colors`: extended
| Token | CSS variable | Aurum default | Role |
|---|---|---|---|
| `ink` | `--tenant-ink` | `#0B1420` (Obsidian) | Primary text, primary button fill, focus ring |
| `sidebar` **(new)** | `--tenant-sidebar` | `#0B1420` | Admin sidebar and dark chrome. Owner requirement: a white-label token. |
| `sidebarInk` **(new, derived)** | `--tenant-sidebar-ink` | `#FFFFFF` | Text on the sidebar. Picked automatically by contrast (≥ 7:1 preferred, ≥ 4.5:1 enforced). |
| `accent` | `--tenant-accent` | `#F8C618` (sampled from `aurum-logo-dark.png`) | **Indicator only:** active navigation rule, focus marker on dark, the brand mark. Never a fill, never text on light. |
| `accentInk` | `--tenant-accent-ink` | `#0B1420` | Text on the accent, on the rare occasions the accent is a fill (none in the default theme) |
| `metal` | `--tenant-metal` | `#B8975A` | Secondary detail on dark surfaces (eyebrows in the sidebar, rules in reports) |
| `canvas` | `--tenant-canvas` | `#F7F8FA` (Platinum), was `#F1EDE4` | Page background behind content |
| `surface` | `--tenant-surface` | `#FFFFFF` | Tables, panels, drawers, dialogs |

The Northbridge and Halcyon presets get their own `sidebar` value. The Brand studio gets a "Sidebar" colour field with a
live contrast readout, plus a "Theme mode" field (light only now; dark is reserved, see §9).

### 1.2 Sponsor layer: replaces the separate `lib/gps.ts` brand
One system with two layers:
1. **Tenant brand**: the firm that runs the platform (Aurum, or a white-label client). It applies everywhere.
2. **Sponsor brand**: the GP whose portal is being viewed. It applies **only inside** `/gp/[gpId]`, `/investor/*`
   and the data-room visitor view (`/room/*`).

| Sponsor token | CSS variable | Source | Applies to |
|---|---|---|---|
| `primary` | `--sponsor-primary` | `GpClient.brand.primary` | Portal header band, the active top-nav indicator, primary buttons in the portal |
| `primaryInk` | `--sponsor-primary-ink` | derived (`inkFor`) | Text on the primary |
| `secondary` | `--sponsor-secondary` | `GpClient.brand.secondary` | Rules and eyebrows |
| logos | — | `GpClient.logo` / `logoDark` | Portal header. Official files only, never redrawn. |

Implementation: `sponsorVars(gp)` in `src/lib/brand.ts` emits `--sponsor-*`. Portal components read
`var(--sponsor-primary, var(--tenant-ink))`, so an unbranded sponsor falls back to the tenant. `brandStyle()`,
the duplicated `contrast()` and the hard-coded `#0F2340` in `gps.ts` are removed. The "Powered by {tenant}" credit
in the portal footer stays tenant-branded.

## 2. Colour system (derived, not branded)

### 2.1 Neutrals (fixed, brand-agnostic)
| Token | Value | Use | Contrast |
|---|---|---|---|
| `--color-text` | = `--tenant-ink` | Body text, numbers | 18.5:1 on white |
| `--color-text-muted` | `#5B6B80` | Supporting text, table headers | 5.4:1 on white, 5.1:1 on platinum |
| `--color-text-faint` | `#8B95A5` | Placeholders and disabled text only (never information) | 3.0:1, decorative only |
| `--color-rule` | `#E5E7EB` (Silver) | Hairlines, table rules, panel borders | — |
| `--color-rule-strong` | `#C9CED6` | Input borders, focused-row rule | — |
| `--color-hover` | ink at 4% on surface | Row hover | — |
| `--color-selected` | ink at 7% on surface | Selected row | — |

Slate `#64748B` from the brief fails AA on platinum (4.48:1), so muted text is darkened to `#5B6B80`.

### 2.2 Gold rules (WCAG-checked)
- `#F8C618` on Obsidian `#0B1420` = **11.5:1** and on Deep Navy `#111D2B` = **10.6:1**: allowed for indicators and small marks on dark.
- `#F8C618` on white = **1.6:1**: **never** used for text, icons or thin rules on light surfaces.
- On light surfaces the brand is carried by ink, not gold.

### 2.3 Status (financial conventions; always icon or text label plus colour)
| Status | Text colour | Background | Contrast on white |
|---|---|---|---|
| Positive / paid / reconciled | `#15803D` | `#F0FDF4` | 5.0:1 |
| Negative / overdue / failed | `#B91C1C` | `#FEF2F2` | 6.5:1 |
| Warning / due soon / pending | `#B45309` | `#FFFBEB` | 5.0:1 |
| Info / in progress | `#1D4ED8` | `#EFF6FF` | 6.7:1 |
| Neutral / draft | `--color-text-muted` | `#F3F4F6` | 5.4:1 |

Status shows as a **text badge** (12 px, 500 weight, 2 px radius, tinted background, no border) with a 6 px dot.
Status never fills a table cell (this replaces the PMO cell fills).

### 2.4 Workspace colours (`FIRM`)
- They stay as `--module-*` tenant tokens.
- Use is restricted to **identifiers**: a 6 px dot or 2 px rule next to the workspace name in the app switcher, the
  sidebar and breadcrumbs, and the icon tint in the app switcher.
- They are never button fills, cell fills or page backgrounds.
- Colour-blind separation is kept, and every use carries the workspace name as text.

### 2.5 Chart palette (Recharts, one library)
- Series 1–5: `ink`, `ink 64%`, `metal`, `#5B6B80`, `ink 36%`.
- Gains and losses use the status green and red.
- No gradient fills: area fills are flat at 8% opacity.
- Gridlines are `--color-rule`, horizontal only.
- The tooltip is a dark ink surface with tabular values and a keyboard-reachable data table fallback ("View as table").

## 3. Typography

### 3.1 Families
| Role | Family | Token |
|---|---|---|
| Interface (everything) | **Inter** variable (`@fontsource-variable/inter`), `font-feature-settings: "tnum","lnum","cv11","ss01"` on numbers | `--font-sans` |
| Editorial: **client names and portal headers only** (owner), plus sign-in headline, `/incorporate` hero, report covers | Source Serif 4 | `--font-serif` |
| Monospace | **none in the interface** | — |

Brand studio sans options become Inter (default), Hanken Grotesk, Helvetica and System.

### 3.2 Scale (px / line-height / weight)
| Token | Size | LH | Weight | Use |
|---|---|---|---|---|
| `display` | 32 | 40 | 400 serif | Portal client name, sign-in headline |
| `title` | 20 | 28 | 600 | Page title (one per page) |
| `heading` | 15 | 22 | 600 | Section heading |
| `metric-lg` | 24 | 32 | 500 tabular | KPI band values |
| `body` | 14 | 20 | 400 | Body, form fields |
| `table` | 13 | 18 | 400 tabular | Table cells (the default density) |
| `label` | 12 | 16 | 500 | Table headers (sentence case, muted), field labels, badges |
| `caption` | 11 | 14 | 500, 0.04em tracking, uppercase | Sidebar group labels, eyebrows (sparingly) |
| `disclosure` | 11 | 16 | 400 | Legal footers, footnotes |

That is eight sizes, replacing about 20 ad-hoc ones. Headings never go above 20 px in the console.

## 4. Spacing, radius, borders, elevation
- **Spacing:** a 4 px base. Steps: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48. Page gutter 24 px (desktop), 16 px (mobile).
- **Radius:** `--radius-sm` 2 px (badges), `--radius` 4 px (buttons, inputs, menus), `--radius-lg` 6 px (dialogs, drawers).
  Nothing larger. This replaces 16 radii.
- **Borders:** 1 px `--color-rule`. Structure comes from rules and alignment, not boxes. Panels are white on platinum
  with a 1 px rule and **no shadow**.
- **Elevation (overlays only):**
  - `--shadow-pop` `0 4px 16px rgb(11 20 32 / 0.08)` for menus, popovers and tooltips.
  - `--shadow-overlay` `0 12px 40px rgb(11 20 32 / 0.16)` for drawers and dialogs.
  - Scrim: ink at 40%.

## 5. Layout and breakpoints
| Name | Width | Shell |
|---|---|---|
| `sm` mobile | < 768 | Sidebar becomes a sheet (hamburger). KPI band stacks 2×2. Tables scroll horizontally with a pinned first column. The drawer becomes a full-screen sheet. |
| `md` tablet | 768–1279 | Sidebar collapsed to a 56 px icon rail (tooltips). The drawer overlays at 480 px. |
| `lg` laptop | 1280–1535 | Sidebar expanded at 232 px (user can collapse it). Content max 1360 px. |
| `xl` desktop | ≥ 1536 | Same as laptop; content max 1440 px, centred. |

### 5.1 Admin shell (A)
- **Sidebar** (`--tenant-sidebar`):
  - Official white logo file at the top (`AurumLogo` light variant, 28 px tall, clear space ≥ the logo's cap height).
  - Workspace groups with `caption` labels.
  - Lucide icons at 16 px, stroke 1.5.
  - Active item: white text plus a 2 px `--tenant-accent` left rule. Hover: white at 6%.
  - Footer: user and role, plus a collapse toggle.
- **Top bar** (56 px, white, bottom rule):
  - Breadcrumb or context (vehicle switcher in the Fund Solution).
  - Search field that opens the ⌘K palette.
  - App switcher (grid icon: solutions and workspaces, each with its identifier dot).
  - Notifications bell with a count.
  - Profile menu.
  - Global "New" menu.
- **Page header:** `title` plus a one-line description, actions right-aligned, optional module tabs underneath.

### 5.2 Home = operational work queue (B)
- KPI band (calls open, amount outstanding, approvals waiting, items due this week), from the demo data.
- **Work queue** with tabs `All · Approvals · Due · Exceptions · Tasks`, each with a count. Rows show item, entity,
  amount, due date, owner and status, plus a single primary row action.
- Right column (≥ 1280 px): due-date calendar list and alerts.
- **No workspace tiles on Home** (owner). The app switcher and sidebar already provide navigation.
- The hexagon emblem appears only inside the official logo.

### 5.3 Record drawer (B)
- Opens from a table row (capital call, distribution, transfer, wire, onboarding file).
- 560 px from the right; it **overlays** the table with a scrim and does not squeeze it.
- Contents: header (record title, status, close), key facts as label/value pairs, a progress or allocation table,
  activity (audit trail entries from existing data only), and sticky footer actions.
- URL-addressable (`?record=id`) so it can be shared.
- Esc closes it and focus returns to the row.

### 5.4 Portals (C layout on white/platinum)
- **Top navigation**: sponsor logo (official file), 5–6 sections, account menu.
- A sponsor-primary 2 px rule under the active item.
- **Header band:** the client name in `display` serif (e.g. "Calloway Family Trust"), with the fund or vehicle in `label` muted.
- The serif appears here and nowhere else in the portal.
- Calm single-column layout, max 1120 px. KPI band, then holdings table, then documents and activity.
- Footer: sponsor legal text, plus "Powered by {tenant}" via `<TenantName />`.

## 6. Components (rebuilt on tokens; see `docs/redesign-components.md`)
They live in `src/components/ui/` and replace the two kits (`ui.tsx`, `firm/kit.tsx`), which become re-exports during migration.
- **Button**: primary (ink fill, white text), secondary (white, rule border), ghost, destructive, link. Sizes 28/32/36. A loading spinner keeps the button's width.
- **Table** (TanStack):
  - Sticky header, pinned first column, horizontal scroll, right-aligned numerals.
  - Sorting, filters, column visibility.
  - Density toggle (32/40 px rows) and row selection.
  - Row action menu, row hover, keyboard row focus.
  - Loading skeleton, empty state with an action, totals row.
- **KpiBand**: one row of figures divided by hairlines, never cards. Label (`label`, muted) above value (`metric-lg`), then an optional context line.
- **Tabs**, **Menu**, **Select**, **Combobox**, **Popover**, **Tooltip**, **Dialog**, **Drawer**, **Toast**: on Base UI.
- **CommandPalette** (⌘K).
- **FilterBar** (chips plus "Add filter").
- **DateField** / **DateRangeField** with fund presets.
- **MoneyField** (currency plus amount).
- **StatusBadge**.
- **Chart** (Recharts container plus tooltip plus table fallback).
- **EmptyState**: one line of text plus an action; no illustration.

## 7. Financial formatting
- One `Intl.NumberFormat` helper set in `src/lib/format.ts` (visual only; no calculation changes).
- **Money:**
  - ISO code in table headers ("Amount (USD)"), symbol in prose.
  - Two decimals in tables, whole units in KPI bands with a "M" or "K" suffix only where space requires it (`$28.0M`), with the full value in a tooltip.
  - BRL alongside USD as today (`R$ 28,000,000`).
- **Negatives:** a minus sign with status-negative colour in variance columns only. Parentheses in ledger and accounting views (`(1,250.00)`), matching accounting convention.
- **Percentages:** one decimal (`72.4%`). Basis points where the domain uses them.
- **Dates:** `25 Nov 2026` in tables, ISO in exports. Relative wording ("in 3 days") only as secondary text.
- **Alignment:** every numeric column is right-aligned, tabular and lining, with the same decimals per column. Headers of numeric columns are right-aligned too.
- **No invented figures:** prototypes and the build use only `src/lib/*` demo data.

## 8. Iconography and motion
- **Icons:** lucide-react only. 16 px in the interface, 20 px in empty states, stroke 1.5. No icons in circles, no
  coloured icon tiles. Workspace identity = dot or rule, not an icon colour block.
- **Motion:**
  - Durations 120 ms (hover, press), 180 ms (popover, menu, tab indicator), 240 ms (drawer, sidebar).
  - Easing `cubic-bezier(0.2, 0, 0, 1)`.
  - Never animate financial values. Under `prefers-reduced-motion` everything becomes an instant opacity change.

## 9. Theme architecture
- Light is the only shipped mode.
- Every component reads semantic variables (`--color-text`, `--color-rule`, `--tenant-surface`…), so a dark mode can later be added by overriding them under `[data-theme="dark"]` without touching components.
- The `Brand` type reserves a `themeMode: "light"` field.

## 10. Banned (carried from the brief and owner feedback)
- Monospace numerals.
- Gold fills or gold text on light.
- Beige canvas.
- Cards for every metric.
- Coloured cell fills.
- Workspace-coloured buttons.
- Redrawn logos.
- Gradients, glass, glow, illustrations, emoji.
- Unverifiable claims in the interface (security badges, SLA, "audit verified", "vault sync", engine versions, methodology notes) unless the platform actually provides the fact.

---

## Financial definitions (Direction D refinements §16, 25 Nov 2026)
These are display definitions. They match how `src/lib/data.ts` (`fundTotals`, `capitalAccounts`) and the accounting engine compute each value. No financial logic changes.

| Term | Definition | Source |
|---|---|---|
| **Commitment** | The amount a partner agreed to contribute over the life of the vehicle. | `commitments.ts` → `capitalAccounts.commitment` |
| **Called capital** | The total of capital calls issued to the partner. Draft calls are excluded. | `capitalAccounts.called` (= sum of issued call allocations) |
| **Contributed capital** | Called capital actually received. | `called − receivable` |
| **Outstanding receivable** | Called and not yet received. On the investor side, "Called, due {date}". | `capitalAccounts.receivable` |
| **Unfunded commitment** | Commitment less called capital, i.e. what can still be called. Shown as "Unfunded" or "Unfunded commitments". | `commitment − called` |
| **Uncalled commitment** | A synonym of unfunded commitment on this platform. Use "Unfunded" in the interface; do not show both. | — |
| **Distributions** | Paid distributions only. Scheduled distributions appear as obligations, never in this total. | `capitalAccounts.distributed` |
| **NAV** | Partner capital: called − distributed + allocated income, gains, fees and expenses. It **includes the outstanding receivable**, and screens must say so where the receivable is non-zero. | `partnerNav()` |
| **TVPI / DPI** | (Distributions + NAV − receivable) ÷ contributed / distributions ÷ contributed. Always uppercase. | `fundTotals()` |
| **Ledger cash** | The general-ledger balance of account 1000, per vehicle. It is not a bank balance; bank balances are not in the demo data. | `trialBalance()` |
| **Firm totals** | The sum across vehicles in USD. BRL vehicles are converted at the indicative 5.40 rate and labelled "indicative". | `INDICATIVE_BRL_USD` |

### Data status in charts
| Status | Meaning | Mark |
|---|---|---|
| Historical | Posted in the ledger | Solid line in the primary colour |
| To date (open period) | The current period, partially posted | Dashed segment, open end marker, footnote with the ledger date |
| Scheduled | Issued, with a due date in the future | Outlined marker, "Scheduled" |
| Draft | Not yet approved | Dashed, "Draft", "awaiting approval" |
| Sample series | Not in the data (prototypes only) | Hatched, always labelled "Sample series" |

### Audit (25 Nov 2026)
The checks were:
- For every capital call: allocations against the amount, paid against received, components against the amount, and the status.
- For every distribution: allocations and components against the amount.
- For every vehicle: issued calls against called capital, receipts against contributed capital, paid distributions against the distributed total, and unfunded against commitment − called.

**No inconsistencies were found.** The firm totals used in the prototypes are below (all USD; FIP Horizonte converted at 5.40):

| Total | Amount |
|---|---|
| NAV | $284,631,481 |
| Commitments | $581,677,778 |
| Called | $267,470,926 |
| Contributed | $262,820,926 |
| Receivable | $4,650,000 |
| Unfunded | $314,206,852 |
| Distributed | $32,992,963 |

Calloway Family Trust in Cordillera I:

| Item | Amount |
|---|---|
| Commitment | $15,000,000 |
| Called | $7,941,176 |
| Contributed | $7,041,176 |
| Receivable (Call No. 7) | $900,000 |
| Unfunded | $7,058,824 |
| Distributed | $552,000 |
| NAV | $8,558,571 |
