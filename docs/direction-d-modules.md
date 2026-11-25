# Direction D — Approval, Corporate Chat and Data Room (functional + visual)

Owner: Luca Ott · 25 Nov 2026 · Branch: `redesign` only.
This brief adds to `docs/direction-d.md` and `docs/direction-d-refinements.md`. Where they conflict, this file wins.

---

## 0. Status and git (do this first)

1. Nothing from Direction D has been pushed yet. Commit what exists now on `redesign` (docs, `design/stitch/direction-d/refined/src`, components) and **push `redesign`** so the work is backed up and Vercel builds a preview.
   - Do not commit anything under `design/references/`. Confirm it is in `.gitignore` before staging.
   - Never merge to `main` and never push to `main`. The owner approves merges.
2. After each phase below: run `npx tsc --noEmit -p .`, `npx eslint src`, `npx next build`. Then commit and push `redesign`.
3. Keep `docs/redesign-log.md` updated: what changed, which routes, and what is still to do.

---

## 1. Verdict on the refined deliverables (01–10)

**Approved.** The home (Obsidian and Platinum), the mobile admin home, the widget library and the chart language are the direction. Fix these before building on them:

1. **Typography: choose Option A** (Manrope Light display + Inter interface and tables + Source Serif 4 for investor-portal headings only).
   - Use Manrope only for hero figures and page titles. Every table and list figure stays in Inter with tabular numerals.
   - The "display face, right-aligned" sample is harder to scan in tables, so don't use the display face in tables.
2. **Work queue "Review" links.** Every row repeats "Review". Show the action on row hover or focus only. Keep it visible on touch. The whole row opens the drawer.
3. **Recent activity bullets** sit above the text baseline. Align them to the first line, or drop the dots and use a 2px left rule per entry.
4. **Dead space.** Recent activity has empty space at the bottom of the home. Let the bottom row size to its content, or add one more row of activity.
5. **Gold on dark.** The filled gold "Record receipt" button on mobile is right because it is the one primary action. Allow **one** filled gold control per screen at most. Everywhere else, gold is used for lines, the selected state and the primary chart series.
6. **Header.** Keep it, but check it at 1280 px. If the top nav, entity, search and layout controls collide, collapse the layout selector into the ⋮ menu first, then the entity selector into the search bar as a filter chip.
7. **Brand-neutral.** In every screen, the logo, gold and module colours must come from tenant variables. Before calling a phase done, switch to the Northbridge and Halcyon presets in `/admin/brand` and take a screenshot.

---

## 2. Authorisation for functional changes

The redesign brief says "no business-logic changes unless authorised". **For the two modules below, functional changes are authorised**:

- **Corporate Chat** (currently "Chat Room")
- **Data rooms** (admin console and the public visitor view at `/room/[linkId]`)

Rules:
- Demo data and domain logic live in `src/lib/*`. Add new types and seed data there. Persist to `localStorage` the same way the PMO plans and formations do (versioned keys, safe parse). No backend yet; keep shapes ready for the Supabase tables in `supabase/`.
- Do not change fund calculations, the ledger, capital-call maths or onboarding logic.
- Keep existing behaviour working: data-room Q&A, permissions, audit trail, engagement scoring, and the PMO "Send in Chat Room" action, which becomes "Send to Corporate Chat".
- Every new feature needs realistic demo data drawn from our existing entities: Cordillera Infrastructure I, FIP Horizonte, STX-Anchor, Atlântico Venture II, Duarte Participações, and so on. No lorem ipsum, and no "Acme".

---

## 3. Rename: Chat Room → Corporate Chat

- Visible name: **Corporate Chat**. Change it everywhere: hub orbit, top nav, ⋮ menu, PMO actions, notifications and empty states.
- Make the module label **tenant-editable** in the Brand & white label studio (a "Module names" section). A tenant can call it "Correspondence", "Desk" or "Matters". Default: "Corporate Chat".
- Keep the internal module key (`chat`) and storage keys so no saved data is lost. If the route is renamed (e.g. `/admin/corporate-chat`), keep the old route as a redirect.

---

## 4. Corporate Chat — Linear-inspired workstation

### 4.1 What we take from Linear, and what we must not

The owner likes Linear's feel. Take the **principles**:
- Calm, dense dark UI, keyboard-first, very little chrome
- A narrow sidebar, a list pane and a detail pane
- Activity timelines where system events and human messages share one stream
- An inbox for everything that needs you
- Instant command menu
- Subtle 1px borders, small type, generous line-height in reading areas

**Do not copy:**
- Linear's logo, mark, icon set, purple accent, illustrations, or marketing screenshots and compositions
- Its product vocabulary: "Pulse", "Triage", "Cycles", "Initiatives", "My issues", "Agent Insights"
- Its exact spacing system, or a pixel-for-pixel layout

Use lucide icons, our tenant tokens and our own wording. Someone familiar with Linear should feel the same speed and calm, not see a clone.

Reference screenshots are in `design/references/Corporate Chat/` (local only, never committed).

### 4.2 Core idea

In a fund administrator, conversation is always **about something**: a capital call, a formation, a KYC exception, a bank-detail change, a data-room question. So Corporate Chat is organised around **matters** (threads tied to an entity or record), plus normal channels and direct messages.

### 4.3 Layout (desktop ≥ 1280)

```
┌ Top bar (shared HubTopBar) ─────────────────────────────────────────────┐
│ Sidebar 232 │ List pane 380             │ Detail pane (flex)  │ Context │
│             │                           │                     │ rail 300│
│ Inbox    12 │ Filter row · Saved views  │ Matter header       │(toggle) │
│ Assigned  4 │ ─────────────────────────  │ Status · Owner · Due│ Entity  │
│ Mentions  3 │ ● CC-7  Capital Call No.7 │ Activity timeline   │ Amounts │
│ Drafts      │   Cordillera · 2m · @you   │ (events + messages) │ People  │
│ ─────────── │ ○ FOR-12 Duarte formation │                     │ Files   │
│ Matters     │ ...                       │ Composer            │ Links   │
│ Channels    │                           │                     │         │
│ Direct      │                           │                     │         │
│ Favourites  │                           │                     │         │
└─────────────┴───────────────────────────┴─────────────────────┴─────────┘
```

- Below 1280: the context rail becomes a drawer. Below 1024: two panes (list → detail). Mobile: one pane with a back arrow and the composer pinned to the bottom.
- Both themes (Obsidian and Platinum) must look finished. Obsidian is the hero.

### 4.4 Objects (add to `src/lib/chat.ts` or extend the existing comms data)

- **Matter**
  - `id`, `ref` (e.g. `CC-7`, `FOR-12`, `KYC-3`; the prefix comes from the record type)
  - `title`, `status` (Open · Awaiting client · Awaiting approval · Resolved)
  - `priority` (None, Low, Normal, High, Urgent)
  - `owner`, `participants`, `dueDate`
  - `linked: {kind: 'call'|'formation'|'investor'|'room'|'plan'|'vehicle', id}`
  - `labels`, `createdAt`, `updatedAt`
- **Channel**: e.g. #fund-ops, #corporate, #compliance, #client-cordillera. Has internal/external visibility.
- **Direct conversation**: 1:1 and small groups.
- **Message**
  - `id`, `author`, `body` (markdown-lite: bold, italic, code, lists, links)
  - `mentions`, `refs` (#CC-7 style), `attachments` (from data rooms or uploads)
  - `replyTo` (thread), `reactions` (a small fixed set, no emoji pickers), `editedAt`
- **Event** (system): status change, owner change, document uploaded, receipt matched, approval given, and so on. Shown inline in the timeline in muted text.
- **Participant flags**: Internal / External (client, counsel, bank). External participants are shown with a clear "External" tag, and channels that include them show a banner.

### 4.5 Features (all working on demo data)

1. **Inbox**
   - Shows mentions, assignments, status changes on watched matters, and client replies.
   - Actions: mark read, snooze (1h / tomorrow / next week), mark done, and open.
   - Unread counts in the sidebar.
2. **List pane**
   - Grouping by status or by linked entity.
   - Sorting by updated, due or priority.
   - Filter chips for owner, status, label, linked type and external.
   - Saved views, persisted.
3. **Matter detail**
   - Header with an inline-editable status, owner, priority and due date.
   - The timeline merges events and messages. Replies open in a thread side panel.
4. **Composer**
   - `@` mentions a person; `#` references a matter, vehicle or document.
   - Attach from a data room (picker), with a draft autosave per matter.
   - Slash commands:
     - `/task` creates a PMO task in the linked plan
     - `/request` creates a party request (the PlanSheet "Requests")
     - `/approve` and `/reject` record an approval event (four-eyes: the author can't approve their own request)
     - `/status <state>`
     - `/assign @person`
5. **Convert a message** into a matter, PMO task or Q&A answer from the message ⋯ menu.
6. **Command menu (Ctrl/⌘ K)**: jump to any matter, channel, person or record, and run actions (new matter, change status, assign). It uses the platform's existing command search where possible.
7. **Keyboard**
   - `C` new matter · `J`/`K` move · `Enter` open · `E` mark done
   - `S` status · `A` assign · `P` priority · `R` reply
   - `/` search · `G I` inbox · `G M` matters · `Esc` back
   - `?` shows the shortcut sheet
   - Every action must also be reachable by mouse and touch.
8. **Search** across matters, messages and attachments, with highlighted results.
9. **Context rail**
   - The linked record summary (e.g. a call's amount, received %, partners outstanding)
   - People, files in the matter, related matters
   - "Open record"
10. **Audit**: every status, owner or approval change writes to the platform audit log, which already feeds Recent activity. Messages can be edited, but the edit history is kept.
11. **Notifications**: the top-bar bell shows Corporate Chat mentions and assignments.
12. **Empty, loading and error states** written in our voice. Use a skeleton, not a spinner.

### 4.6 Visual spec

- Sidebar items: 28–30px rows, 13px Inter, counts right-aligned in tabular numerals, the selected row on `--tenant-surface` with a 2px accent bar.
- List rows: 44px, with the ref in a muted mono style, title, linked entity, time and an avatar stack. Unread is shown as a weight change plus a small dot, not colour alone.
- The timeline reading column has a max width of 720px, 14px text and 1.55 line height.
- Statuses use a small outlined ring icon with fill states: open is empty, awaiting is half, resolved is filled. Draw our own shapes; do not copy Linear's status icons.
- Use the gold accent only for the selected item, focus rings and the primary send action. No purple.
- Motion: 120–160ms ease-out on panel transitions. Respect `prefers-reduced-motion`.

---

## 5. Data rooms — references and changes

The references in `design/references/Dataroom/` are Papermark screenshots: document analytics, room templates and room branding.
- Papermark is open source under **AGPL**. **Do not copy its code, wording, icons or images** into this proprietary product. Take ideas only.
- Keep our current strengths: Index, Engagement, Q&A, Permissions, Audit trail.

### 5.1 Restructure the room console (Linear-calm, like Corporate Chat)

Tabs: **Documents · Links · Analytics · Q&A · Permissions · Branding · Audit trail · Settings**.
- Use the same three-pane rhythm as Corporate Chat: folder tree | document list | details rail.
- Keep the current readiness checklist as the Documents empty state.

### 5.2 Document analytics (new, functional)

On the document details page:
1. **Time per page** bar chart, one bar per page, with series per **version** (v1, v2…). A tooltip shows a page thumbnail and the time per version.
   - Follow the chart language in deliverable 08: gold is the primary version, neutrals for older ones, and a "Sample series" label on demo data.
2. KPI row: **Visits**, **Unique viewers**, **Average time on document**, **Completion %** (pages viewed ÷ pages).
3. A toggle to **exclude internal visits**.
4. **Viewers table**: viewer, firm, link used, time, pages reached, last viewed and downloads. Clicking a row opens the viewer's page-by-page path.
5. **Versions**: upload a new version, keep the history, mark the current version, and show what changed in views since the update.

### 5.3 Links (new, functional)

Multiple share links per room and per document. Each link has:
- a name, an audience (from Permissions), an expiry and an email gate
- NDA acceptance before entry (text from Settings), a download on/off switch and a dynamic watermark (viewer email + time)
- view-only or allowed folders, and a revoke action

Links table: name, URL (copy button), views, last viewed, status (Active / Expired / Revoked) and ⋯. Every link resolves to `/room/[linkId]` and its settings are enforced in the visitor view (demo enforcement in the client is acceptable for now).

### 5.4 Room templates (new, functional)

"New room" opens a template gallery:
- Fund raise (LP due diligence)
- Real estate transaction
- M&A sell-side
- Fund of funds
- Corporate formation and KYC
- Annual investor reporting

Each template card shows "View index" (the folder structure preview) and "Use template" (creates the room with that folder tree and the readiness checklist). Write our own copy.
- **No colourful stock gradients or 3D renders.** Use either the restrained photographic treatment from our sign-in Backdrop (desaturated, tenant-tinted), or a typographic card with the folder outline drawn as hairlines. Show both options in the prototype and the owner will pick.

### 5.5 Room branding (new, functional)

A per-room override of the tenant brand. It has:
- logo, a banner (1920×320 minimum), accent colour (with a contrast check), entry-page background (from the tenant neutrals) and welcome text
- a live preview with three tabs: **Room view · Document view · Entry page**
- "Save" and "Reset to firm brand"

Overrides are stored per room and fall back to the tenant brand. Reuse the controls from `BrandStudio.tsx`; do not build a second colour system.

### 5.6 Visitor view `/room/[linkId]`

- Entry page: the room banner, the sponsor's name and mark, then the email gate and NDA when required.
- Room: the banner header with the room name and "Updated …", a folder tree on the left, and a file list on the right (name, type, size, updated).
- Document viewer: page-by-page with a page counter. It records time per page into the analytics demo store, shows the watermark when enabled, and offers download only when allowed.
- Ask a question, which feeds the existing Q&A queue.
- Mobile: the folder tree becomes a sheet.

---

## 6. Rollout to the whole platform

After Corporate Chat and Data rooms are done, continue the checklist in `docs/redesign-log.md` until every audited route (33) uses the Direction D shell, tokens and typography:
- Admin hub and the six firm workspaces: Sales, PMO, Corporate Chat, Data rooms, Billing, Compliance
- Fund Solution (GPs, funds, investors, capital activity, ledger) and Corporate Solution (pipeline, formation drawer, `/incorporate`)
- GP portal, investor portal and `/portal`, which keep Source Serif 4 headings
- Sign-in, the Brand studio and `/room/[linkId]`

Order: shared shell and kit → Corporate Chat → Data rooms → Fund → Corporate → PMO → Billing / Compliance / Sales → portals → public pages. Tick each route in the log with a screenshot path.

---

## 7. Deliverables for owner review (before building the next module)

Save to `design/stitch/direction-d/modules/` (gitignored like the other Stitch output) and list them in the log:
1. `chat-inbox-obsidian-1920.png`, `chat-matter-obsidian-1920.png` (with the context rail open), `chat-matter-platinum-1920.png`, `chat-command-menu.png`, `chat-mobile-390.png`
2. `room-documents-obsidian-1920.png`, `room-analytics-obsidian-1920.png`, `room-links.png`, `room-templates-A-photo.png`, `room-templates-B-typographic.png`, `room-branding.png`, `room-visitor-entry.png`, `room-visitor-viewer.png`
3. One Corporate Chat screen and one data-room screen under the **Northbridge** preset to prove white label.

Generate 2–3 Stitch options per new screen first, then build the chosen one as real React components. Use 21st.dev only as a starting point for complex pieces (command menu, resizable panes, date picker, virtualised list), adapted to our tokens.

---

## 8. Guardrails (unchanged)

- English only. Plain, specific, institutional wording.
- No literal "Aurum" in client-facing text: use `useBrand()`, `<TenantName />` and the logo components.
- No gradient blobs, glassmorphism, emoji, or icon-in-circle feature grids.
- No API keys in code, logs, commits or chat.
- Next 16 rules: `searchParams` / `headers()` inside `<Suspense>`. React Compiler: no components defined in render, no ref reads in render.
- Never merge to `main`. Report back with: what was built, screenshots, the checks passed, and anything that needs an owner decision.
