# Report Studio — phase 1

Fund Solution → Reporting → Reports (`/admin/fund/reports`). Editor at `/admin/report-studio/[id]`; print-ready report at `/report-studio/[id]` (`?print=1` opens the print dialog).

## Architecture
- **Data layer** (`src/lib/studio/data.ts`): every metric a report may bind to, computed from the books (`buildBooks`, trial balance, `xirr` from analytics) with label, value, currency, as-of date, source, method and status (`final`, `preliminary`, `estimated`, `unavailable`, `illustrative`). Missing data is `unavailable` and prints as "n/a" with the reason — never zero, never invented. Quarterly series, capital calls, distributions, holdings at cost and key terms come from the same layer.
- **Document model** (`src/lib/studio/model.ts`): a report is pages of typed blocks (cover, heading, paragraph with `{{metric}}` tokens, commentary, key figures, chart, table, investment updates, exposure, note, disclosures, signatures, contents). Templates build pages; design (identity, typography, cover) is stored apart from content.
- **Snapshots and versions** (`src/lib/studio/store.ts`): "Freeze the data" stores the full computed data with the report; sending for review freezes automatically. Lifecycle Draft → In review → Approved → Published → Archived, each transition recorded as a version and in the audit log. Only drafts can be edited; a published report is corrected by opening a new draft, never edited in place.
- **Renderer** (`src/components/studio/Render.tsx`, `charts.tsx`): A4 pages (794 × 1123 px) with explicit fonts and colours, independent of the editor theme; SVG charts (vector in print). The same renderer draws library covers, the editor canvas and the print view.
- **Output**: print view paginated with `@page A4`; the browser's print engine embeds fonts and keeps text selectable. Server-generated PDF is phase 3.

## Phase 1 scope
Library (covers, search, filters, duplicate, archive/restore, version history), template gallery (nine previews; Quarterly Fund Report ready), editor (outline with drag and drop, canvas with contextual block controls, inspector per block, figure source panel, focus mode with `\`), manager or administrator identity, editorial or modern type, three cover treatments, preview and PDF export.

## Not yet
Section-level review and the interactive digital report (phase 2); Tiptap rich text, Portuguese templates, server PDF, more templates and charts (phase 3); database persistence and enforced permissions (phase 4). Sector, geography, currency exposure, gross IRR and benchmarks are not recorded in Aurum yet and show as unavailable.
