# Redesign log

Read this and `docs/redesign-brief.md` at the start of every session. Newest entries on top.

## Status
- **Phase reached:** 5 complete → **Phase 6: waiting for owner approval.** Do not start implementation before approval.
- **Branch:** `redesign`.
- **Awaiting owner:** approval of prototypes P1–P5 (`docs/redesign-prototypes.md`), `docs/design-system.md` and the
  new dependencies (`docs/redesign-components.md`).

## References
- Stitch project: `projects/11182280680944937938` ("Aurum Platform"). Design system id `3776221373241039428`
  (built from the *old* `tools/stitch/design.md`; replace or override it for the new directions). There are no screens yet.
- 21st.dev MCP: connected (search verified 2026-11-25).
- Screenshots: `design/audit/<page>-<width>.png` (git-ignored); regenerate them with `node tools/screenshots.mjs`
  against `npx next dev -p 3100`.
- Logo gold: dark-on-light file #F8C618, white file #FFCA00.

## Decisions
- 2026-11-25 (owner): **Honeycomb retired as navigation.** The hub becomes an operational home (approvals, due dates,
  tasks, alerts) plus an app switcher. The hexagon is a brand mark only, used sparingly.
- 2026-11-25 (owner): **One brand system.** Sponsor/GP branding is a layer on top of the white-label tenant model.
  Tenant brand first; the sponsor brand applies inside that sponsor's portals. Replaces the separate `lib/gps.ts` brand.
- 2026-11-25 (owner): **One chart library**, themed from design tokens, with accessible tooltips.
- 2026-11-25 (owner): One of the three Stitch directions must be a **refined evolution of the current cream look**.
- 2026-11-25 (owner): **Direction for Phases 3–5.**
  - A (Obsidian) for the admin shell and page structure.
  - B's tabbed work queue *is* the home page. B's detail drawer for capital calls and similar records.
  - C's investor portal (top nav, serif client name, calm layout) for LP **and** GP portals, on white/platinum surfaces.
  - Serif only for client names and portal headers.
  - Corrections: no monospace numerals (interface sans, tabular figures); no duplicated workspace tiles on Home;
    remove every unverifiable claim Stitch invented (TLS, SLA, vault sync, audit verified, methodology, engine
    version); official logo files only, never a redrawn mark; the sidebar colour is a white-label brand token.
- Final visual direction: _formal approval at Phase 6._

## Open questions
_None._

## Entries
### 2026-11-25 — Phases 3–5
- **Phase 3:** searched 21st.dev for every item in brief §3. The shortlist and rejections are in `docs/redesign-components.md`.
  Proposed one headless layer (Base UI) plus TanStack Table, Recharts, cmdk, react-day-picker and Inter.
- **Phase 4:** drafted `docs/design-system.md`.
  - New brand tokens: `sidebar`/`sidebarInk`, plus the sponsor layer `--sponsor-*`.
  - Platinum canvas. Inter with tabular figures. An 8-step type scale. Radius 2/4/6.
  - Muted text is `#5B6B80`, because Slate `#64748B` fails AA on platinum.
- **Phase 5:** Stitch design system `assets/279242118147208333`, and prototypes P1–P5 corrected for invented content.
  Screen IDs and known gaps are in `docs/redesign-prototypes.md`; images are in `design/stitch/prototypes/`.
- **Lesson:** Stitch invents content on every first pass (badges, timestamps, IDs, names, notices), and one edit
  introduced a data error (a fee shown as a date). Re-read the image after every edit.
- Demo figures came from a scratchpad Node script (strip-types plus a resolve hook). `src/lib` was not modified.

### 2026-11-25 — Phase 2 directions
- Added `upload` to `tools/stitch/stitch.mjs`. Uploaded 14 screenshots of today's app to Stitch as references.
- Created three design systems and generated Home, Capital calls and Investor portal screens for each (9 screens).
  The IDs are in `docs/redesign-directions.md`, and the images are in `design/stitch/directions/`.
- Recommendation: A (Obsidian sidebar) as the base, plus B's work queue and detail drawer, plus C's serif for editorial
  moments only. LP portals use top navigation.
- Note: `brief()` in `tools/stitch/stitch.mjs` still appends the old cream rules to every CLI prompt. Update it together with
  `tools/stitch/design.md` once a direction is approved (Phase 6). Until then, use the MCP tools with an explicit design system.
- Stitch downloads come back as JSON (`dataString`, base64). Decode them before viewing.

### 2026-11-25 — Phase 1 audit
- Created branch `redesign`. Verified that the Stitch and 21st.dev MCP servers respond.
- Captured 33 routes × {1440, 390}. All routes return 200.
- Wrote `docs/redesign-audit.md` (visual audit, architecture, brand assets, implications).
- Key findings:
  - Four different admin shells.
  - The hub has no state or labels.
  - Gold is used as fill.
  - Card-grid dashboards.
  - Workspace colours fill buttons and cells.
  - No table, dialog, menu or command-palette components.
  - About 2,500 arbitrary Tailwind values.
  - The Fund Solution is unusable at 390 px.
