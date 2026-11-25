# Redesign — Phase 5 prototypes (for Phase 6 approval)

Date: 2026-11-25. Stitch project `11182280680944937938`, design system **Aurum Institutional (Phase 4 draft)** `assets/279242118147208333`
(the Stitch translation of `docs/design-system.md`).
The images are in `design/stitch/prototypes/` (git-ignored). Every figure comes from `src/lib/*` demo data.

| # | Screen | Final screen id | Image |
|---|---|---|---|
| P1 | App shell + Home (work queue) | `0062c7507731459b95c6a1f3850b46d3` | `P1-home.png` |
| P2 | Fund overview: Cordillera Infrastructure Partners I | `b626e4e24be64a51ba52ef298d910974` | `P2-fund-overview.png` |
| P3 | Dense table + record drawer: Capital calls / Call No. 7 | `d669a0bdd4e04909a3843d454d4f37f8` | `P3-capital-calls-drawer.png` |
| P4 | Treasury / banking | `60f7722ea53d44318698488760bf53bf` | `P4-banking.png` |
| P5 | LP portal: Strlex sponsor layer, Calloway Family Trust | `929390fd391d45a2b53728ffcb0944ad` | `P5-investor-portal.png` |

## What the prototypes establish
- **One shell.**
  - The Obsidian sidebar is the white-label token `--tenant-sidebar`.
  - The logo area is a placeholder; the build uses the official file through `AurumLogo`, never a redrawn mark.
  - Grouped navigation. The active item is white text plus a 2 px gold rule, the only gold on screen.
  - Workspaces are identified by a 6 px dot, never a fill.
- **Home is a work queue (B).**
  - It has a KPI band, tabs `All 11 · Approvals 6 · Due 2 · Exceptions 2 · Tasks 1`, plus Upcoming and Recent activity.
  - There are no workspace tiles.
  - Every row comes from the demo data: draft calls, profile-change requests, submitted subscriptions, the Call No. 7 receivable, the FIP Horizonte distribution, KYC exceptions and the Kessler invitation.
- **KPIs are one band divided by hairlines**, never cards.
- **The record drawer (B) overlays the table with a scrim.** It shows key facts, collection progress, the breakdown, LP allocations, and sticky actions.
- **Treasury** is honest about state:
  - Connections read "Manual statements" or "Not connected".
  - It shows one overdue statement (Serra, 30 Sep).
  - Receipts against Call No. 7 total $8.1M matched and $4.65M outstanding.
  - The Ferreira bank change shows the existing control (callback + 5-day hold) and the existing two-approver rule.
- **LP portal (C layout on white):**
  - Top navigation with the sponsor logo.
  - The client name in serif, which is the only serif in the product interface.
  - A KPI band, holdings with totals, documents and requests.
  - "Powered by {tenant}" in the footer.
- **Numbers are Inter with tabular figures** throughout. No monospace.

## Corrections already applied in Stitch (owner's rules)
Removed invented content:
- "Real-time sync", "11 active", "Sort by: Urgency" and "Audit log" on Home
- "Notice ID CC-2026-007", a "Q4 2026" badge, "Fund Administration Console" and the expanded user name "Luiza Andrade" in the Fund screens
- "Updated today 10:45 AM EST" and depositary subtitles in Banking
- in the portal: "Harvest phase", "Unrealized flat", invented vintages and strategies, a wire-instructions notice, and the "Contact Team", "Document Vault" and "Request History" buttons

I also changed colours and labels:
- Money is in ink, not green or orange.
- Uppercase table headers became sentence case.

One edit introduced a data error (management fee shown as a date); it was caught and fixed.

## Known gaps (Stitch limits, fixed in the build)
- **Home (P1):** the Status column is still clipped at the right edge, and long item names wrap.
  In the build the queue table scrolls horizontally with the first column pinned, and item and entity stay on one line.
- **Banking (P4):** the "Last statement" column falls off the right edge of the Accounts table. Same fix: horizontal scroll with a pinned first column.
- **Uppercase leftovers:**
  - Sidebar group captions are uppercase by design (11 px, §3.2).
  - In P3, the KPI labels behind the scrim and "Fund solution" are still uppercase. The build follows the scale.
- **The P5 eyebrow** "STRLEX CAPITAL GROUP INC. · INVESTOR PORTAL" is uppercase. In the build it will be sentence case, muted.
- **Not shown in images:** mobile layouts, the command palette, the app switcher, and the sponsor colour on the portal's primary buttons. These are specified in `docs/design-system.md` §5 and will be checked with real screenshots in Phase 8.

## Trade-offs for the owner
1. **Navy sidebar vs light shell.**
   - The navy sidebar gives identity and makes white label a single colour.
   - The cost is a common fintech silhouette. What makes it ours is the details: the gold rule, the type scale, the hairline structure, and the official logo.
2. **Platinum canvas replaces cream.** It is calmer and more neutral, but loses the current warmth. A tenant can still set a warm canvas (Brand studio); Aurum's default becomes platinum.
3. **Inter replaces Hanken Grotesk** as the default interface face. It is better for figures; Hanken stays selectable per tenant.
4. **The serif is reduced** to portal client names, portal headers and public entrances. The console has none.
5. **New dependencies:** Base UI, TanStack Table, Recharts, cmdk, react-day-picker and Inter (see `docs/redesign-components.md`). Each one replaces hand-rolled code; none touches business logic.
6. **Separate GP brand system:** `lib/gps.ts`'s `brandStyle()` is retired in favour of a sponsor layer (`--sponsor-*`) on the tenant brand.

## Asked of the owner at Phase 6
- Approve the direction (P1–P5) and `docs/design-system.md`, or list changes.
- Approve the new dependencies.
- Confirm platinum `#F7F8FA` as Aurum's default canvas and Inter as the default interface face.

After approval:
- update `CLAUDE.md` "Design rules", `tools/stitch/design.md` and `brief()` in `tools/stitch/stitch.mjs`
- then Phase 7: tokens → shell → shared components → modules, one commit each
