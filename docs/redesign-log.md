# Redesign log

Read this and `docs/redesign-brief.md` at the start of every session. Newest entries on top.

## Status
- **Phase reached:** Direction D approved (refined frames 01–10, typography Option A), with `docs/direction-d-modules.md` as the
  governing brief.
  - §0 (backup push) and §1 (fixes) are done.
  - **Corporate Chat is built (§3–4)**, and the §7 chat screenshots are delivered.
  - **Stopped before the data room (§5)** for owner review.
- **Branch:** `redesign` (never merged or pushed to `main`).
- **Awaiting owner:**
  - Review of the Corporate Chat screenshots (`design/stitch/direction-d/modules/chat-*.png`).
  - The open decisions listed in the 2026-11-25 Corporate Chat entry below.

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
### 2026-11-25 — Direction D modules: §0, §1, Corporate Chat (§3–4)
**§0 Backup.**
- Pushed `redesign` with the module brief and the refined prototype HTML sources (`9189bc8`).
- `design/references/` is confirmed git-ignored.

**§1 Fixes to the approved frames**, in `tools/stitch/direction-d-refined.mjs`, re-rendered:
- **"Review" links:** shown only on row hover or focus (always on touch); the whole row is the target.
- **Recent activity:** a 2 px left rule per entry instead of floating dots.
- **Bottom row:** sizes to its content, with six activity rows.
- **Header at 1280 px:** the layout selector folds into the ⋮ menu; below 1360 px the entity selector becomes a chip in the search
  field; the work queue and NAV panels go full width. New frame: `11-home-obsidian-1280.png`.
- **Typography:** Option A is fixed. Manrope only for hero figures and titles; Inter with tabular figures in all tables.

**Foundation, in production code. Scoped: only screens wrapped in `.ws` change; every other route is untouched.**
- `globals.css`: Direction D tokens (Obsidian default, Platinum on `html[data-theme=light]`), with `d-*` Tailwind colours.
- `lib/theme.ts` plus `ThemeProvider`: Light / Dark / System per user, kept in this browser, applied before first paint (`THEME_BOOT`).
- `lib/brand.ts`:
  - `moduleNames` (tenant-editable, default "Corporate Chat"), `moduleName()` and `MODULE_DEFAULTS`.
  - `--tenant-accent-on-dark` / `--tenant-accent-on-light`, derived to AA by `readableOn()`:
    - Aurum #8B6F0D
    - Northbridge #89703F
    - Halcyon #268280
- **Fonts:** `@fontsource-variable/inter` and `@fontsource-variable/manrope` added to dependencies.
- `components/shell/WorkstationTopBar.tsx`:
  - Logo, applications, app switcher (Sales, PMO, Corporate Chat), search and command.
  - A bell fed by Corporate Chat mentions, assignments and approvals.
  - Account menu with Appearance (Light / Dark / System).

**§3 Rename.**
- "Chat Room" → **Corporate Chat** everywhere:
  - hub orbit and apps menu
  - Fund sidebar
  - GP portal navigation and title
  - CommsWorkspace headings
  - PMO action ("Send to Corporate Chat")
- The name is tenant-editable in Brand & white label → **Module names**.
- The module key stays `communication`; `/admin/corporate-chat` redirects to `/admin/communication`.

**§4 Corporate Chat** (`/admin/communication`, `components/chat/*`, `lib/chat.ts`, `lib/chat-store.ts`, `lib/audit-local.ts`):
- **Stitch:** three options were generated for the matter view (`design/stitch/direction-d/modules/options/chat-{A,B,C}.png`). The build combines A's compact rows, C's timeline spine and B's single property line.
  - Stitch invented "Approve & Sign", due dates on other matters and "High priority" tags. None of them were carried over.
- **Data:**
  - 13 matters built from existing records: CC-2/3/4/7, BNK-4 (Ferreira), SUB-1038/1045, KYC-3/7, FOR-16 (Mazal), DR-1 (Cascade q1), PLN-1 (STX-BAHF plan) and ACC-1 (channel request r1).
  - Five channels (two external) and three direct conversations.
  - Earlier comms messages are carried into the matching channels.
- **Persistence:** `aurum-chat-v1` (versioned, safe parse, reseeds on a shape change). Audit entries go to `aurum-audit-v1` and are shown in Compliance → Audit log.
- **Built and checked in a browser** (22 scripted checks passing against `next start`):
  - **Inbox:** read/unread, snooze for one hour / until tomorrow / for a week, done.
  - **List pane:** grouping by status or linked record; sorting by updated, due or priority; filter chips for owner, status, label, linked and external; saved views.
  - **Matter header:** inline status, owner, priority and due date.
  - **Four-eyes approve/reject:** the requester can't approve, and an approved channel request opens the channel.
  - **Timeline:** events and messages together, day separators, threads in a side panel, three fixed reactions, edit with history, markdown-lite.
  - **Composer:**
    - @ mentions, # references and / commands (status, assign, priority, approve, reject, task, request)
    - attachments from data rooms and the document register
    - draft autosave per conversation
  - **Message conversion:** into a matter, a PMO task (written to `aurum-pmo-plans`), or a draft Q&A answer (`aurum-vdr-answer-drafts`, still reviewed and released in Data rooms).
  - **Command menu (Ctrl K):** matters, views, channels, people, calls, funds, investors and actions.
  - **Shortcut sheet (?):** C, J, K, Enter, E, S, A, P, R, /, G I, G M, Esc.
  - **Context rail:** amounts and progress from the ledger, people, files and related matters.
  - **States:** external banners; skeleton, empty and error states.
  - **Responsive:** the rail becomes a drawer below 1280 px, two panes below 1024 px, one pane with a back arrow on phones.
- **Regression:**
  - tsc, eslint and next build clean.
  - 22 key routes return 200.
  - The GP portal chat (CommsWorkspace, client mode) still renders.
  - PMO "Send to Corporate Chat" posts into PLN-1.

**Screenshots** (`design/stitch/direction-d/modules/`, git-ignored; regenerate with `tools/stitch/shoot-modules.mjs`):
- `chat-inbox-obsidian-1920`, `chat-matter-obsidian-1920`, `chat-matter-platinum-1920`, `chat-command-menu`, `chat-mobile-390` (+ `-list`)
- `chat-approval-obsidian-1440`, `chat-four-eyes-platinum-1440`, `chat-thread-obsidian-1440`, `chat-slash-commands-1440`, `chat-channel-external-1440`,
  `chat-shortcuts-1440`, `chat-matter-obsidian-1280`
- **White label:** `chat-northbridge-1920`, `chat-northbridge-obsidian-1920`, `chat-halcyon-1920`, `brand-module-names-1440`

**Data inconsistency found (reported, not fixed):** `lib/comms.ts` has a Strlex message saying "Draft capital call #3 … $4.2M at 8% of
commitments, due December 15". `lib/data.ts` (ledger) has STX-Anchor Capital Call No. 3 at **$3,650,000, due 9 Dec 2026**. Corporate Chat
uses the ledger figures and did not carry that message over. The old message is still shown in the GP portal chat (comms data unchanged).

**Not done yet / decisions for the owner:**
- **Sidebar colour as a tenant token** (owner decision, 25 Nov) is not wired yet. The Northbridge shot keeps the neutral sidebar. Proposal: add an
  optional `colors.sidebar` to `Brand` in the shell stage of the rollout.
- **Shell scope:** the Direction D top bar is used only by Corporate Chat. The other routes still use HubTopBar until the rollout (§6).
- **Viewer:** the preview viewer is Luiza Andrade (Head of Fund Services). When Supabase auth arrives, this becomes the signed-in user.
- **Next:** §5 Data rooms. Not started; waiting for the owner's review of the chat screens.

### 2026-11-25 — Direction D refinements (`docs/direction-d-refinements.md`)
- Direction D approved as the foundation. Applied refinements 1–9 and Part 2 §10–17 in HTML prototypes built on the tokens:
  `tools/stitch/direction-d-refined.mjs`, with every figure read from `src/lib` through `tools/stitch/ts-loader.mjs`.
- **Fonts:** installed the @fontsource Inter, Manrope, IBM Plex Sans and Source Serif 4 packages with `--no-save`, so `package.json` is
  unchanged until implementation. All four were confirmed as loaded.
- **Deliverables:** 16 frames in `design/stitch/direction-d/refined/`. Each was inspected and none overflows horizontally. Summary and decisions
  are in `docs/direction-d-refined.md`.
- **§16 audit:** checked calls, distributions and vehicle totals against the demo data. No inconsistencies were found. The financial
  definitions and audited totals were added to `docs/design-system.md`.
- **Q4 2026:** the quarter is real ledger data but still open. It is shown as "to date" (dashed, with a footnote), not as a sample series.
  No sample series was needed anywhere.
- **Contrast:** checked Aurum, Northbridge and Halcyon in both themes. Light-theme accent fills fail as graphics on white, so they get an
  `--accent-edge` token. Zoom at 150 % and 200 % renders without overflow.
- **Recommendation:** typography Option A (Manrope Light).
- **Status:** stopped for final approval. No production code was changed.

### 2026-11-25 — Direction D (owner brief `docs/direction-d.md`, supersedes P1–P5)
- **Setup:**
  - Verified that Stitch (`get_project`) and 21st.dev (`search`) respond.
  - Moved `References/` to `design/references/` and git-ignored it before staging anything.
  - Converted the references to PNG and uploaded them, plus both official logos, to Stitch.
- **Stitch:**
  - Created the design system "Aurum Direction D — Obsidian" `assets/8160601109885466765`.
  - Generated Home, Fund overview, Banking and treasury, and the Investor portal in Obsidian. The first Banking run failed with a network error and was resubmitted.
  - Ran one fix pass each on Home and Fund (status clipping, axis range, colour tokens, legend and tooltip overlap, an invented "Active" badge, a truncated GP name).
- **Themes:** `tools/stitch/render-direction-d.mjs` renders one HTML per screen in Obsidian, Platinum and Northbridge by swapping tokens only. That gives identical layouts per theme. The script also places the official logos and enforces no monospace.
- **Deliverables:** 14 frames in `design/stitch/direction-d/` (all of §18, plus Home at 1920 px). Each was inspected and widths were verified. See `docs/direction-d-prototypes.md`.
- **Data honesty:**
  - No "Sample series" was needed; all charts use ledger history or scheduled items.
  - BRL is converted at indicative 5.40 and labelled.
  - Ledger cash is shown as it is: $81,000.
- **Stitch inventions removed:** substitute logos (a stock photo and placeholders), an "Active" badge, the "Interval: 30 days (daily discrete)" note, and rainbow status colours.
- **Status:** stopped for owner approval. No production code was changed.

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
