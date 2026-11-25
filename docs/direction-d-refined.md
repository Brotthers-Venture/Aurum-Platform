# Direction D — refined prototypes (for final approval)

Date: 2026-11-25. Brief: `docs/direction-d-refinements.md` (on top of `docs/direction-d.md`). Design only; no production code changed.
Frames are in `design/stitch/direction-d/refined/` (git-ignored). Regenerate them with:
`node --experimental-strip-types --no-warnings --import ./tools/stitch/ts-loader.mjs tools/stitch/direction-d-refined.mjs`

This round is built as HTML on the Direction D tokens rather than regenerated in Stitch, because the brief requires:
- real self-hosted fonts, which Stitch cannot use
- every figure read from `src/lib` at render time
- pixel-identical layouts across themes

Stitch remains the source of the approved architecture. 21st.dev references are listed in `docs/direction-d-prototypes.md`.

## Deliverables
| # | Frame | Files |
|---|---|---|
| 1 | Home, 1920 px | `01-home-obsidian-1920.png`, `02-home-platinum-1920.png` |
| 2 | Investor portal, desktop and 390 px | `03-…-obsidian-1440.png`, `04-…-platinum-1440.png`, `05a-…-mobile-platinum-390.png`, `05b-…-mobile-obsidian-390.png` |
| 3 | Admin Home, 390 px (prioritised) | `06a-admin-home-mobile-obsidian-390.png`, `06b-…-platinum-390.png` |
| 4 | Typography comparison (A vs B, both themes) | `07-typography-comparison.png` |
| 5 | Widget library and four default layouts | `08-widget-library-and-layouts.png` |
| + | Header menus and interaction states | `09a-…-obsidian.png`, `09b-…-platinum.png` |
| + | Browser zoom 150 % and 200 % | `10-zoom-150pct-…png`, `10-zoom-200pct-…png` |

## Refinements applied (Part 1)
1. **Header:**
   - Holds the logo, applications, an app switcher (Sales, PMO, Chat Room), the entity switcher, search with Ctrl K, notifications and the account.
   - Light / Dark / System and Density moved into the account menu.
   - "Add widget", "Save layout as…" and "Reset to default" moved into the Layout menu. See `09a`/`09b`.
2. **Navigation:** applications are in the top bar only. The sidebar holds only pages inside the current application (Home: Overview, Work queue, Calendar, Activity).
3. **Gold discipline:**
   - Gold is used for the primary chart series and the main action (Record receipt) only.
   - The NAV-by-vehicle bars are neutral.
   - "Review" is neutral and turns gold on hover or focus. `09` shows this.
   - Active tabs and the selected app use ink, not gold.
4. **Panel controls:**
   - Hidden at rest.
   - Shown on hover and on keyboard focus (`:focus-within`).
   - On touch (`hover:none`) a single "More" button stays visible and opens Move, Resize, Full screen, Collapse, Configure and Remove.
5. **Upcoming obligations:**
   - Now a compact dated list: date, weekday, item, context, signed amount and status. No dashed icons.
   - Dead space removed: the Capital activity chart fills its panel, and "Your requests" sits under the relationship-manager card.
6. **Q4 2026:** it is real ledger data, but the quarter is still open. It is drawn as a dashed "to date" segment with the footnote "Q4 2026 to date: receipts and distributions recorded up to 24 Nov 2026". No sample series was needed anywhere.
7–8. **Platinum and display figures:** see below.
9. **Wording:** the "Approver 1 (Empty)" wording no longer appears in any frame. The rule is recorded for the build: two-approver steps read "Awaiting first approver" / "Awaiting second approver".

## Part 2
- **§10 Identity:**
  - Four tonal surface steps (bg, chrome, surface, raise) carry the depth.
  - Panels have a 1 px hairline, a 6 px radius and a faint top sheen. There are no shadows except on menus.
  - Hairline separators inside panels.
  - A hexagon dot marks the active sidebar item; it is the only emblem-derived detail.
- **§11 Platinum:**
  - Warm neutrals: canvas #F2F1EE, chrome #FBFAF8, white panels, borders #E3E0DA.
  - Gold text and lines in #7D5F00.
  - Same layout and proportions as Obsidian. The 01/02 pair is pixel-identical in size.
- **§12 Typography:**
  - Installed for real: @fontsource Inter, Manrope, IBM Plex Sans and Source Serif 4. Not saved to `package.json`; the dependency decision waits for implementation.
  - Every font was confirmed as loaded in Chrome.
  - `07` shows both options in the same Home hero in both themes, with $284,631,481 and R$ 24,500,000, right-aligned and in tabular figures.
  - **Recommendation: Option A (Manrope Light).** Its rounder, more open numerals give the hero figure a calmer, more distinctive voice. Plex Light is crisper but more technical. Both align perfectly.
  - The frames use Option A.
- **§13 Widgets:**
  - `08` shows a library of 20 widgets across Home, Fund, Treasury and Compliance. Each widget lists its purpose, its `src/lib` data source, the sizes it supports and its options.
  - It also shows the eight widget capabilities and the four default layouts on the 12-column grid.
  - Only data that exists is used.
  - Nothing has been built yet.
- **§14 Charts:** the data-status legend (historical, to date, scheduled, draft, sample) is on `08`. The definitions are in `docs/design-system.md`.
- **§15 Mobile:**
  - **Admin:** in order, needs your approval, outstanding obligations (with Record receipt and Send reminder), key balances and recent activity. Analytics are collapsed into links.
  - **Portal:** in order, the account value, the commitment bar, the upcoming obligation (with View notice in the sponsor colour), holdings as records, documents, the relationship manager with "Email investor relations" (the GP's real IR address from `gps.ts`), and requests.
- **§16 Financial consistency:**
  - Every call, distribution and vehicle was audited against the demo data. **No inconsistencies were found.**
  - The definitions and audited totals are now in `docs/design-system.md`.
  - The portal states that NAV includes the $900,000 receivable.
  - The admin hero states that NAV includes $4,650,000 called but not yet received.
- **§17 Accessibility:**

  | Pair | Contrast |
  |---|---|
  | Primary text, both themes | 16.0 / 17.8:1 |
  | Secondary text | 7.6 / 5.6:1 |
  | Gold text, light | 6.0:1 |
  | Status colours | ≥ 5.0:1 |
  | Sponsor buttons | 11.5 / 9.1:1 |

  - Northbridge and Halcyon accent text passes AA in both themes, using derived darker shades on light.
  - Light-theme accent fills (gold 1.6:1, Northbridge 2.4:1) fail as graphics against white. They therefore always carry a darker edge token (`--accent-edge`) and are never the only carrier of meaning.
  - At 150 % and 200 % zoom (1280 and 960 px layouts):
    - no horizontal overflow and no clipped figures
    - the sidebar becomes an icon rail
    - widgets go to full width
    - the search collapses to an icon

## Decisions for the owner
1. Approve the refined Direction D for implementation.
2. Typeface: **Option A, Manrope Light** (recommended), or Option B.
3. Confirm the widget library and the four default layouts as the target for the widget stage.
4. Confirm the mobile priorities (admin and portal).

Implementation then starts on `redesign` per §18: semantic tokens and themes → shell and navigation. `main` is not merged without approval.
