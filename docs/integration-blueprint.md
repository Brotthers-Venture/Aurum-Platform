# Aurum Platform — Integration Blueprint

How every hexagon works as one system. Owner: Luca Ott · Draft 1 · 25 Nov 2026

> Kerzner's rule for programmes like this: the hardest work is **integration management**, meaning the seams between parts, not the parts themselves. Each hexagon already works on its own. This plan is about the seams.

---

## 1. Principles (the rules every module follows)

1. **One record, many views.** An investor, a capital call, a company or a document exists once. Every hexagon links to it; none copies it.
2. **Every change is an event.** When something changes state (a submission is sent, a screening clears, a call is funded, a task is done), the change is written once to an event ledger. Activity feeds, notifications, the audit trail and Corporate Chat timelines all read from that ledger. Nothing is posted twice by hand.
3. **One kind of work item.** A PMO task, a chat matter, a compliance review, a data-room question and a bank-detail approval are all *work*: an owner, a due date, a status and a linked record. They share one model, so "what's on my plate" works across hexagons.
4. **Discuss anything, anywhere.** Every record has a conversation in Corporate Chat, one click away, with the record's live figures beside it.
5. **Access is role × hexagon × scope.** A role opens hexagons, and a scope narrows them (e.g. "Infrastructure I and Atlântico II only"). This is the same rule on the ecosystem page, the Hexa Room, search, notifications and the database.
6. **Four eyes on money and identity.** Bank details, KYC dispositions, capital calls and distributions need two people, and the person who asks can't approve. Enforce this once, centrally.
7. **The ledger and the documents are the truth.** Dashboards read; they never hold numbers of their own.

---

## 1a. Parties and default access (owner, 25 Nov 2026)

| Party | Who | Opens by default | Where they work |
|---|---|---|---|
| **Employee** | Aurum staff | Corporate Chat, PMO | Console |
| **General Partner** | Manager or sponsor that onboards to Fund Solution | Corporate Chat and PMO (their own conversations and plans only) | Console, and GP portal |
| **Tenant** | Firm running the platform under its brand (for now Corporate and Multi-Family) | Corporate Chat, PMO, Corporate Solution, Multi-Family Office (their own clients only) | Console, in its brand |
| **Client** | A tenant's end customer (B2B2C) or Aurum's direct customer (B2C) | Corporate Solution; once a company is formed, the client portal (the Multi-Family platform), with Messages | Client portal, in its tenant's brand |
| **Limited Partner** | Investor subscribing into a GP's fund | Messages (own conversations) | Investor portal |
| **External guest** | Auditor, counsel, bank, prospect | Nothing | Only where invited, with an end date (90 days) |

Everything beyond the defaults is an **invitation**, recorded with who invited and when:
- The **main administrator** (Platform administrator) invites anyone.
- A **tenant's administrator** invites its own people and clients into the tenant's hexagons.

The rules live in `src/lib/parties.ts` and `src/lib/hexa.ts`. The screen is Access & permissions → Hexagon access.

## 2. Where we are today

| Connection | Status |
|---|---|
| Chat ↔ capital calls, investors, subscriptions, rooms, plans, bank changes | **Partly done.** Matters link to records; `/task` and `/request` create PMO rows. Links are one-way and the kinds of record are fixed. |
| Chat → Data-room Q&A | **Done (one-way).** A message becomes a draft answer for review. |
| PMO → Chat | **Partly done.** "Send to Corporate Chat" exists; status changes don't post back. |
| Onboarding ↔ Compliance | **Not connected.** Onboarding has its own KYC field; Compliance alerts point to onboarding only through free text ("Investor onboarding · Atlântico II"). |
| Sales → Onboarding / PMO / Treasury | **Not connected.** A won deal starts nothing. |
| Corporate formations ↔ Compliance / Treasury / Data rooms | **Not connected.** |
| Treasury ↔ Fund (fees, receipts) | **Not connected.** Invoices are separate from fund fee calculations. |
| Activity / audit | **Fragmented.** Each module keeps its own log; there's no shared ledger. |
| Access | **Done for navigation** (ecosystem page and Hexa Room by role); not yet for data, search or notifications. |

Every module stores its data in the browser separately. That's fine for a demo, but it's the main reason the hexagons can't see each other.

---

## 3. The connective spine (what we build once)

Six shared services. Each module plugs into them instead of into each other, so there are 6 connections, not 30.

| Service | What it holds | Who uses it |
|---|---|---|
| **Record registry** | A reference for anything: `{ kind, id, label, hexa, scope }`, e.g. `investor:inv-monteiro`. One resolver turns a reference into its title, status, figures and link. | Everything. Chat's "linked record", search, mentions (`#CC-7`), notifications. |
| **Parties** | People and organisations once (investors, GPs, companies, counsel, banks), with their roles in each context. | Onboarding, Compliance, Sales, Chat participants, data-room guests, Treasury clients. |
| **Event ledger** | Append-only `{ at, actor, type, ref, data }`, e.g. `onboarding.submitted`, `screening.cleared`, `call.receipt_matched`, `task.done`. | Activity feeds, chat timelines, notifications, audit trail, PMO progress, metrics. |
| **Work items** | `{ ref, kind, title, owner, due, status, linked, approvals[] }`, kinds: task, request, review, approval, question, matter. | PMO grid, chat inbox, compliance queue, data-room Q&A, the top-bar bell, "My work". |
| **Documents vault** | One file store with versions; rooms, onboarding, formations and chat attachments reference it. | Data rooms, onboarding packs, formation files, chat, reports. |
| **Access** | Grants: role × hexagon × scope; four-eyes rules. | Navigation, data queries, search, notifications, exports. |

**How it runs now and later.** Today an in-browser event bus (`lib/bus.ts`) and registry, using exactly the contracts above. Later the same contracts in Supabase: tables `records`, `parties`, `events` (written with an outbox so nothing is lost), `work_items`, `documents`, `grants`, and row-level security derived from grants. Live updates come over Supabase Realtime. **Swapping storage changes only the transport, not the modules.**

**Shared UI parts:**
- `RecordChip`: shows any reference and opens it.
- `DiscussButton`: opens or creates the record's chat matter.
- `ActivityFeed`: the ledger filtered to a record.
- `LinkedWork`: open work on a record.
- `ApprovalBar`: the four-eyes control.

---

## 4. Integration map: the end-to-end flows

### A. Investor onboarding ↔ Compliance (first priority)
1. An investor **submits** in onboarding. This raises `onboarding.submitted`, and a **screening case** opens automatically in Compliance (a work item of kind *review*, linked to the submission and the investor party). It runs PEP, sanctions and adverse-media screening on the investor and its beneficial owners.
2. **No match** → `screening.cleared`, and the onboarding KYC field shows *Clear* with who cleared it and when.
3. **Potential match** → an alert in the Compliance **Screening** queue, a first reviewer and a second approver (four eyes). The submission shows *Potential match* and **cannot be approved or countersigned** until the case is closed.
4. The **disposition** (cleared / escalated / rejected) writes back to onboarding and the investor record, and is kept in the audit trail.
5. **Expiry:** KYC that expires within 60 days goes onto the Compliance calendar, creates a task for the relationship manager, and opens a chat matter with the investor. The same pipeline handles **data-room guests** and **Sales prospects** (alerts al2 and al5 already show the need).

### B. Corporate Chat ↔ every hexagon
- **Discuss** on every record, in every hexagon, opens its matter, or creates one already linked.
- The record's important events appear in the matter timeline automatically (from the ledger), so people stop typing "FYI, receipt matched".
- From a message you can create a task, a request to a party, a change request, a Q&A answer or a compliance note; the result links back to the message.
- **Rule:** client-visible channels never receive internal events. External participants only see what was posted to them.

### C. PMO ↔ Corporate Chat
- **Every plan has a channel**, and every row can open a thread. A row's status, owner or due-date change posts to its thread; overdue rows go to the owner's inbox.
- `/task`, `/request` and `/status` in chat act on the plan. Party requests reach external participants in their client channel.
- PMO progress (% complete, slipped milestones) comes from the ledger, not manual updates.

### D. Client lifecycle: Sales → Onboarding → PMO → Treasury
1. A deal is marked **Won**. A client record is created (Parties), and the onboarding plan is created from a **PMO template** for the solution (Fund or Corporate).
2. Alongside that: a **KYC case** opens in Compliance, a **client channel** in Chat, a **collection data room** from a template, and a **fee schedule** in Treasury from the agreed terms ("5 bps on NAV · $80k minimum").
3. Each completed step closes its PMO row automatically through the ledger.

### E. Corporate formation
A formation application opens a matter with: KYC on directors and beneficial owners (Compliance), document collection (data room), a formation-fee invoice (Treasury), and a filing timeline (PMO). When it's incorporated, the new entity enters the record registry and can be used anywhere.

### F. Capital activity ↔ Treasury ↔ Chat
A **capital call** issued raises `call.issued`, opens a call matter, and adds expected receipts to Treasury. A **bank receipt matched** posts to the matter and updates "% received". When a call is overdue, reminders become work items for the relationship manager. **Bank-detail changes** only go through a change request with four eyes, never chat (already started).

### G. Data rooms
- A visitor's question becomes a work item.
- A chat answer becomes a draft (already in place).
- New guests are screened (flow A).
- A room created from a fund or formation inherits its record link, so its activity shows on that record.

### Who connects to whom

| | Fund | Corporate | Chat | Data rooms | Treasury | Compliance | PMO | Sales |
|---|---|---|---|---|---|---|---|---|
| **Fund** | — | entities | discuss calls, investors | LP rooms | fees, receipts | onboarding KYC | close plans | won → onboarding |
| **Compliance** | KYC on investors | KYC on owners | case discussion | guest screening | — | — | remediation tasks | prospect screening |
| **Chat** | ✓ | ✓ | — | Q&A drafts | change requests | case notes | tasks, requests | deal threads |
| **PMO** | close plans | formation plans | threads per row | collection rooms | billing milestones | remediation | — | onboarding template |

---

## 5. How we run it (programme governance)

**Phases with stage gates.** No phase starts until the gate before it is passed and you have signed off.

| Phase | Scope | Exit criteria (gate) |
|---|---|---|
| **P0 Spine** | Record registry, event bus, work-item model, `RecordChip`, `DiscussButton`, `ActivityFeed`, all in the browser on the final contracts. | Every hexagon emits its events; any record can be discussed; one "My work" list. |
| **P1 Compliance ↔ Onboarding** | Flow A end to end, including the four-eyes disposition and the approval block. | A submission with a potential match can't be countersigned until two people close the case; the audit shows every step. |
| **P2 Chat everywhere + PMO ↔ Chat** | Flows B and C. | Every plan has a channel; row changes post automatically; `/task` and `/request` round-trip. |
| **P3 Client lifecycle** | Flows D and E. | Marking a deal Won creates the onboarding plan, KYC case, channel, room and fee schedule in one step. |
| **P4 Database** | Supabase: auth, grants with row-level security, events with outbox, realtime. | Two people on two computers see the same thing live; access enforced by the database. |
| **P5 Outside services** | Bank feeds, e-signature, screening provider, e-mail. | Real receipts match; real screening results; signed documents stored. |

**Work breakdown.** Each phase is broken down in the PMO hexagon itself (plan "Platform integration" under Corporate → Internal). We use our own tool and see the gaps first-hand.

**RACI (per phase).**
- Responsible: Claude for the build.
- Accountable: Luca for gate sign-off.
- Consulted: Fund Services Head (Fund, Treasury) and Compliance Officer (P1).
- Informed: the team, through the #platform channel.

**Change control.** New requests go into a change log. Each one is assessed against its phase: in scope, deferred, or a new phase. Nothing jumps the queue unless it's a defect.

**Definition of done (every item):**
- the event contract is written
- it works in both themes and for white-label tenants
- access is respected
- the audit entry is written
- the type check, lint and build all pass
- the screens have been checked by eye
- it is deployed

**Risks:**

| Risk | Response |
|---|---|
| Building integrations on browser storage that must later move to the database | The P0 contracts are the database contracts; only the transport changes in P4. |
| Scope creep from new ideas mid-phase | Change log and gates. |
| Four-eyes rules implemented in many places and drifting | One central approval service. |
| Client data leaking into internal channels, or the reverse | Visibility is a field on every event, and it's tested. |
| One person doing everything (key-person risk) | This blueprint and the phase notes live in the repo; every phase ends with a written handover. |

**Measures of success (from the ledger):**
- days from invitation to countersigned subscription
- KYC review time
- share of matches cleared within SLA
- days to collect a capital call
- PMO rows done on time
- questions answered within 3 days

---

## 6. Decisions (owner, 25 Nov 2026)

1. **Order approved:** P0 → P1 → P2 → P3 → P4 → P5. P0 and P1 were built together.
2. **KYC rule:** while a screening case is open, a subscription can be **neither approved nor countersigned**.
3. **KYC refresh** starts **30 days** before expiry.
4. **Four eyes on screening:** first review by the **Compliance Officer**, second approval by the **Head of Fund Services**; never the same person.
5. **Access:** everyone (except investors, who use their portal) always opens **Corporate Chat, PMO and one solution**. Every other hexagon is granted **person by person by the main administrator** (Platform administrator), on Access & permissions → Hexagon access; each grant is logged. Grants move to the database in P4.

## 7. Progress

| Phase | Status |
|---|---|
| P0 Spine | **Built (in-browser).** Event ledger with records (`lib/spine.ts`), events written to the audit log and posted automatically into linked chat matters; `DiscussButton` and `ActivityFeed` (`components/spine`); Discuss opens or starts the record's matter. |
| P1 Compliance ↔ Onboarding | **Built.** Screening case per submitted subscription (`lib/screening.ts`); no match clears automatically; a match needs a first review and a second approval by two different people; the result writes back to KYC on the subscription, the onboarding list and the chat record panel; approve and countersign are locked while a case is open; KYC refresh 30 days before expiry on the Compliance calendar. |
| P2 Chat everywhere + PMO ↔ Chat | Next. |
