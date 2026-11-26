# Report Studio

Fund Solution → Reporting → Reports (`/admin/fund/reports`). Editor at `/admin/report-studio/[id]`; print-ready report at `/report-studio/[id]` (`?print=1` opens the print dialog).

## Architecture

- **Data layer** (`src/lib/studio/data.ts`): every metric a report may bind to, computed from the books (`buildBooks`, trial balance, `xirr` from analytics) with label, value, currency, as-of date, source, method and status (`final`, `preliminary`, `estimated`, `unavailable`, `illustrative`). Missing data is `unavailable` and prints as "n/a" with the reason — never zero, never invented. Quarterly series, capital calls, distributions, holdings at cost and key terms come from the same layer.
- **Document model** (`src/lib/studio/model.ts`): a report is pages of typed blocks (cover, heading, paragraph with `{{metric}}` tokens, commentary, key figures, chart, table, investment updates, exposure, note, disclosures, signatures, contents). Templates build pages; design (identity, typography, cover) is stored apart from content.
- **Snapshots and versions** (`src/lib/studio/store.ts`): "Freeze the data" stores the full computed data with the report; sending for review freezes automatically. Lifecycle Draft → In review → Approved → Published → Archived, each transition recorded as a version and in the audit log. Only drafts can be edited; a published report is corrected by opening a new draft, never edited in place.
- **Renderer** (`src/components/studio/Render.tsx`, `charts.tsx`): A4 pages (794 × 1123 px) with explicit fonts and colours, independent of the editor theme; SVG charts (vector in print). The same renderer draws library covers, the editor canvas and the print view.
- **Output**: print view paginated with `@page A4`; the browser's print engine embeds fonts and keeps text selectable. Server-generated PDF is phase 3.

## Phase 1 scope

Library (covers, search, filters, duplicate, archive/restore, version history), template gallery (nine previews; Quarterly Fund Report ready), editor (outline with drag and drop, canvas with contextual block controls, inspector per block, figure source panel, focus mode with `\`), manager or administrator identity, editorial or modern type, three cover treatments, preview and PDF export.

## Phase 2 — review and the digital report

- The quarterly report is a step of the quarter close: the close links to the fund's Quarterly Fund Report for the period, waits for it to be approved, and publishing the package publishes the report.
- Section-level review while in review: each page is marked reviewed or "needs changes" with a note; approval needs every page reviewed and the `reports.review` permission. Internal comments on any block (reply, resolve); never published.
- Interactive digital edition (`/report-studio/[id]/digital`, and for investors `/investor/[gpId]/documents/report?id=`): the same blocks as sections with navigation, expandable tables, footnotes and the fund's documents.

## Phase 3 — language, formatting, templates

- **Language** (`src/lib/studio/i18n.ts`): English or Brazilian Portuguese per report. Page chrome, figure labels, calculation notes, table headings, chart labels and number, currency and date formats follow the language (pt-BR: `US$ 24,1 mi`, `30/09/2026`, `3T 2026`). Templates write their text in the chosen language; text a person wrote is never machine-translated, and values from the records (legal form, strategy, purposes) show as recorded.
- **Formatting**: `**bold**`, `*italic*` and `^[footnotes]` in paragraphs, from the B / I / footnote buttons in the inspector. Footnotes are numbered per page and printed at the foot of the page (per section in the digital report). Implemented in the renderer, no rich-text dependency.
- **Charts**: NAV bridge for the quarter (opening NAV, contributions, distributions, net result as the residual of the capital accounts, closing NAV) and the cumulative net cash flow curve, besides NAV, deployment, flows, utilization and allocation.
- **Tables**: ledger statements (assets, liabilities and partners' capital; statement of operations year to date and since inception, labelled unaudited), partners' capital, fees and expenses by quarter, and for families asset classes, holding structure, borrowing and currency/region exposure.
- **All nine templates ready**: Quarterly Fund Report, Annual Fund Report, Investor Capital Account Statement (addressed to one partner), Portfolio Performance, Family Office Consolidated Wealth (from the family office records, in USD), Factsheet, Capital Activity, GP Management, Investor Letter. The gallery shows each template's real first page.
- Investors only see published reports written for partners (not GP management or committee reports), of funds they hold, and statements addressed to them.

## Phase 4 — permissions and the database

- **Permissions in the app**: creating, duplicating, archiving and editing need `reports.prepare`; approving needs `reports.review`; publishing needs `reports.publish`; the manager's sign-off on the package needs `reports.approve_gp`. Reviewers without prepare rights read, comment and mark sections.
- **Migration** `supabase/migrations/20261126000000_reporting_studio.sql`: `quarter_closes`, `reports`, `report_snapshots`, `report_versions`, `report_comments`, the four `reports.*` permissions and their role grants. Row-level security and triggers enforce the rules server-side: content changes only in draft by a preparer; status moves one step at a time by the permission that owns it; the person who sent a report for review cannot approve it; snapshots, versions and comments are append-only; reports are archived, never deleted; investors read only what the portal shows them.
- **Persistence adapter** `src/lib/studio/persist.ts`: today reports live in the browser. With `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and a signed-in user, every change is also written through Supabase's REST API and reports are read back on load; a refused change is logged, not hidden. The editor shows "Saved … in this browser" until then.

### To switch the database on (owner)

1. Create a Supabase project and run the migrations in `supabase/migrations` in order.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project (Production and Preview). Never commit them.
3. Add Supabase Auth sign-in and call `setAccessToken` with the session token; grant users roles in `user_roles`.
   The adapter and the SQL have not been run against a live database yet; expect a round of fixes on first connection. Seed reports are demo data and are not written to the database.

## Not yet

- **Server-generated PDF**: needs `puppeteer-core` and `@sparticuz/chromium` (free) and an API route; not installed pending approval. The print view (`/report-studio/[id]?print=1`) produces a vector PDF with embedded fonts through the browser.
- Sector exposure, gross IRR, benchmarks and carried interest are not recorded in Aurum yet and show as unavailable.
