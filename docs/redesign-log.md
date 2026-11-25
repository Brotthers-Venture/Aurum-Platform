# Redesign log

Read this and `docs/redesign-brief.md` at the start of every session. Newest entries on top.

## Status
- **Phase reached:** 1 (audit) complete → next is Phase 2 (Stitch: three directions).
- **Branch:** `redesign`.
- **Awaiting owner:** nothing yet. The approval gate is Phase 6.

## References
- Stitch project: `projects/11182280680944937938` ("Aurum Platform"). Design system id `3776221373241039428`
  (built from the *old* `tools/stitch/design.md`; replace or override it for the new directions). There are no screens yet.
- 21st.dev MCP: connected (search verified 2026-11-25).
- Screenshots: `design/audit/<page>-<width>.png` (git-ignored); regenerate them with `node tools/screenshots.mjs`
  against `npx next dev -p 3100`.
- Logo gold: dark-on-light file #F8C618, white file #FFCA00.

## Decisions
_None yet. The owner decides at Phase 6._

## Open questions
- Should the hub keep the honeycomb navigation in any form (e.g. as a secondary "map" view), or be replaced
  outright by a console?
- Should sponsor branding (`lib/gps.ts`) be merged into the tenant brand model as a nested "sponsor layer"?
- Should we use a chart library or keep hand-rolled SVG? Hand-rolled keeps the bundle small; a library gives tooltips and axes.

## Entries
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
