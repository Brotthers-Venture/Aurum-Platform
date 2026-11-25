# Direction D — prototypes for owner approval

Date: 2026-11-25. Brief: `docs/direction-d.md` (supersedes P1–P5). Design exploration only; no production code was changed.
Frames are in `design/stitch/direction-d/` (git-ignored). Regenerate them with `node tools/stitch/render-direction-d.mjs`.

## Deliverables (§18)
| # | Frame | File |
|---|---|---|
| 1 | Home — Obsidian | `01-home-dark.png` |
| 2 | Home — Platinum | `02-home-light.png` |
| 3 | Fund overview — Obsidian | `03-fund-overview-dark.png` |
| 4 | Fund overview — Platinum | `04-fund-overview-light.png` |
| 5 | Banking and treasury — Obsidian | `05-banking-treasury-dark.png` |
| 6 | Banking and treasury — Platinum | `06-banking-treasury-light.png` |
| 7 | Investor portal — Obsidian | `07-investor-portal-dark.png` |
| 8 | Investor portal — Platinum | `08-investor-portal-light.png` |
| 9 | Home in the **Northbridge** white-label preset (Platinum) | `09-home-northbridge-light.png` |
| 10 | Home tablet 1024 / phone 390 | `10a-home-tablet-1024.png`, `10b-home-phone-390.png` |
| 10 | Investor portal tablet 1024 / phone 390 | `10c-investor-portal-tablet-1024.png`, `10d-investor-portal-phone-390.png` |
| + | Home on a 1920 px monitor | `extra-home-dark-1920.png` |

Every desktop frame is exactly 1440 px wide; the tablet and phone frames are exactly 1024 and 390 px, so nothing overflows horizontally.
Each dark/light pair has identical dimensions (for example, Home 1440 × 1016 in both themes).

## How the frames were made
1. **Mood references.**
   - Moved `References/` to `design/references/` and git-ignored it before anything was staged.
   - Converted the AVIF, SVG and WebP files to PNG and uploaded the four references to Stitch.
   - Also uploaded both official logo files.
   - Principles taken:
     - modular panels with slim headers and quiet actions
     - workspace tabs plus "Add widget" in a global header
     - a headline figure paired with an integrated chart
     - forecast-style shading for uncertain items
     - cash by institution as a breakdown beside the figure
   - Nothing was taken from the references' layouts, colours, wording or identities.
2. **Stitch composed each screen once, in Obsidian** (design system `assets/8160601109885466765`).
   - Every colour is a CSS variable.
   - The Stitch screens are Home `95f213170f4245a580dfc8905531d714`, Fund `0db20d3456774a9ba447c0899476fdf1`, Banking `78f88b61ac7b4d5aaad7d2ff3ccea5fc` and Portal `2fcbef447ddf40b784431057cc4bd1c5`.
3. **One architecture, three skins.**
   - `tools/stitch/render-direction-d.mjs` renders the same HTML with the Obsidian, Platinum or Northbridge token set.
   - Layout, components, type and widget positions never change; only token values do. This is the brief's §5 rule, demonstrated rather than promised.
4. **The renderer also enforces the agreed rules:**
   - The **official logo files** are placed on every screen. Stitch had substituted a stock photo and placeholders.
   - **No monospace**: account masks are set in Inter with tabular figures.
   - Invented text is removed. One line: "Interval: 30 days (daily discrete)".
   - Phones get stacked table records.
   - Tablets get a slimmer header.

## Semantic tokens (proposal for `src/lib/brand.ts`)
| Token | Obsidian | Platinum | Role |
|---|---|---|---|
| `bg` | #0B1015 | #F3F4F6 | Canvas |
| `surface` | #10171F | #FFFFFF | Panels, tables |
| `elevated` | #161F29 | #FAFBFC | Hover, panel headers, tooltips |
| `border` | #25303C | #DFE3E8 | Hairlines |
| `text` | #F1F3F5 | #101820 | Primary text and figures |
| `text-2` | #98A4B3 (7.6:1) | #5E6A77 (5.0:1 on canvas) | Labels, secondary text |
| `text-3` | #6B7887 | #8A94A0 | Axis ticks and decoration only |
| `accent-fill` | #FFCA00 (logo gold on dark) | #F8C618 (logo gold on light) | Primary button, active rule, bars, indicators |
| `accent` (text/line) | #FFCA00 (12.5:1) | #8A6A00 (5.1:1) | Gold text and chart lines on light, AA-safe |
| `sidebar` | #0E141B | #FFFFFF | **White-label token**; the sidebar re-scopes its own text tokens |
| `pos` / `warn` / `info` / `neg` | #3DBE8B / #E8A93C / #7AA7F2 / #F2706A | #15803D / #B45309 / #1D4ED8 / #B91C1C | Status, always with a text label |

- **Tenants and sponsors override only brand tokens:** accent fill, accent text, sidebar, sponsor colour and logo.
- **Northbridge example:**
  - sidebar `#173A2E`
  - accent `#C9A45C`, with `#7A5F28` for text (6.0:1)
  - no logo file, so its name appears as a wordmark
- **Contrast fallback rule:** if a tenant colour fails AA, the platform keeps the tenant colour for fills and derives a darker text and line shade automatically. This is the same mechanism Aurum's own gold uses on light.

## Typography (open licence only)
- **Geist** (OFL), weight 300, for headline figures.
- **Inter** (OFL) for the interface, with tabular lining figures everywhere and no monospace.
- **Source Serif 4** (OFL) only for the investor's name in portal headers.
- NAV, TVPI, DPI, USD and BRL are always uppercase.

## Charting language (one library at build time, themed from tokens)
- **Series:** gold for the primary series, neutral for the secondary; green and red only for status and flows.
- **Grid:** 1 px horizontal gridlines only, 11 px tabular axis labels.
- **Interaction:** a crosshair with a compact tooltip in which every figure is labelled.
- **Uncertainty:** draft or uncertain periods are hatched and labelled ("Depends on draft calls").
- **Chart types:**
  - stepped cumulative charts for capital called
  - allocation bars for NAV by vehicle
  - a segmented commitment bar in the portal
  - a ring for collection progress

## Data honesty (§11)
- Every figure comes from `src/lib/*`:
  - fund totals
  - the ledger (cash, account 1000)
  - quarterly flows from the journal
  - calls, allocations, distributions, documents and activity
- **No "Sample series" was needed.** Every chart uses real demo history or scheduled items:
  - Capital activity: quarterly contributions and distributions from the journal, Q4 2024–Q4 2026.
  - Cordillera timeline: calls 1–7 and its two distributions.
  - Scheduled flows: Call No. 7 receivable, draft Calls No. 2 and 3, and the FIP Horizonte distribution. It is labelled "Scheduled items only. Not a forecast."
- **Indicative FX:** BRL is converted at the platform's indicative 5.40 and labelled as such.
- **Ledger cash is honest at $81,000:** Cordillera's operating account. Every other vehicle's ledger cash is $0, and the screen says so.
- **Removed or replaced Stitch inventions:**
  - substitute logos
  - the "Active" badge
  - the "Interval" note
  - a truncated GP name
  - coloured status hues outside the token set

## 21st.dev (§3, §12)
- The earlier shortlist (`docs/redesign-components.md`) still applies.
- Added for Direction D:
  - **Theme switch:** `zweiundeins/theme-switch` (#37721). Light / Dark / System segmented control that sets a data attribute on `<html>` and persists.
  - **Resizable panels:** `aadixc0de/resizable` (#46492). Min and max sizes, collapse, keyboard resizing, saved layouts.
  - **Widget customisation (last stage):** `carolinaraulino/draggable-widget-grid` (#27304).
  - **Charts:** `kuratlielia/line-chart` (#35057), multi-series with a scrubbable crosshair; `ssychui/range-navigator` (#23954) for full-screen analytical views.
- All of these are references; each is rebuilt on the tokens above.

## Known gaps (to be fixed in implementation, not in Stitch)
- **Home, Capital activity:** the plot uses only the top half of the panel (Stitch's fixed SVG height). In implementation the chart fills its widget.
- **Uneven details across screens:**
  - **Active-item marker:** Stitch drew a dot in Home and a diamond in Fund. The build uses one 6 px hexagon marker (§6).
  - **Caps:** a few uppercase eyebrows remain ("NEXT ACTION", "CASH AND CASH EQUIVALENTS", "TWO-APPROVER PROTOCOL"). The build will use either sentence case or one uppercase caption style.
- **Portal buttons:** "View notice" uses a neutral outline. The sponsor colour currently drives only the navigation underline. The build gives primary portal actions the sponsor colour.
- **Phone, work queue:** the tabs scroll sideways ("Tasks" is partly visible). That is the intended scroll affordance, but a "More" menu may be better.
- **Font fallback:** the frames load Inter, Geist and Source Serif from Google Fonts. Production self-hosts them via @fontsource.

## Decisions for the owner
1. Approve Direction D as shown (frames 1–10), or list changes.
2. Display face for figures: **Geist Light** (shown), or an alternative open-licence face.
3. Platinum sidebar: **white** (shown), or a faint tint to separate it more from the canvas.
4. Eyebrow captions: sentence case everywhere, or one uppercase caption style.

After approval, staging follows §17: tokens and themes → shell and navigation → tables and charts → drawers and command menu → widget customisation.
