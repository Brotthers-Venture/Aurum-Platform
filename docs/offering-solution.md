# Offering Solution — architecture assessment and prototype

Status: prototype approved; **phase 1 built** (26 Nov 2026) on the `redesign` branch. Nothing here moves money, signs documents or sends messages.

## Phase 1 (built)

- **Offerings register:** create an offering (linked to a vehicle in Fund Solution, which then supplies its own name, sponsor, domicile, strategy and target, or standalone); edit terms. A field someone changes stops being illustrative; untouched illustrative fields stay marked.
- **Investor register:** add prospects; edit a prospect's identity; record stated preferences for anyone. Identity of investors on record is changed in Fund Solution, not here.
- **Pipeline per offering:** add any investor or prospect to an offering (one opportunity per investor and offering), at a stage a person may record (Identified to Soft commitment). Subscriptions, accepted commitments and funding come from Fund Solution and the books; NDA executed needs an executed agreement.
- **Amounts:** potential, indicated and soft amounts recorded by hand replace estimates; accepted, called and received stay with the books.
- **Follow-ups:** schedule from an opportunity or an investor; complete and reopen; **My work** groups them by overdue, today, next seven days and later, beside what the pipeline is waiting on. Overview shows follow-ups due within three days.
- Everything is kept in this browser (`aurum-offering-v1`) until the database is connected, and every change is written to the audit log.

## What already exists and is reused (no copies)

| Need                                              | Existing record                                                                                | Where                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Investors (master identity)                       | `investors` (LPs, with type, jurisdiction, KYC, relationship manager)                          | `src/lib/data.ts`                            |
| Accepted commitments, called and received capital | capital accounts built from the books (`buildBooks`) — the ledger is the evidence for "funded" | `src/lib/accounting/engine.ts`               |
| Subscriptions in progress                         | onboarding submissions (invited → in progress → submitted → approved → countersigned)          | `src/lib/data.ts` (`onboarding`)             |
| KYC / AML / PEP / sanctions                       | screening cases with four-eyes decisions                                                       | `src/lib/screening.ts`, Compliance workspace |
| Confidential documents, NDA, engagement           | data rooms, room users with NDA state, views, downloads, Q&A                                   | `src/lib/dataroom.ts`, Data Rooms workspace  |
| Funds and offering cards                          | funds (status Fundraising), offering card content                                              | `src/lib/data.ts`, `src/lib/offerings.ts`    |
| Activity and audit                                | the spine: record references and the event ledger                                              | `src/lib/spine.ts`, `audit-local.ts`         |
| Reports                                           | Report Studio (templates, languages, approvals)                                                | `src/lib/studio/*`                           |
| Navigation                                        | Hexa Room hexagon `offering` (slot "w", was "coming") with its own side room                   | `src/lib/solutions.ts`, `src/lib/hexa.ts`    |
| Roles                                             | permission keys, roles, preview roles                                                          | `src/lib/access.ts`                          |

The Sales workspace (`src/lib/sales.ts`) is Aurum's own business development and stays separate.

## New, in `src/lib/offering/`

- **Offering** — references a fund (`fundId`) when one exists, or a data room for a vehicle not yet set up (Cascade Real Estate Fund I). Holds only what the fund record doesn't: exemption, eligibility, minimum, opening and target closing dates, authorized distributors, relationship lead.
- **Prospect** — a party that isn't an LP yet. When it subscribes it becomes an `investors` record; the prospect keeps a `becameInvestorId` pointer, never a copy. Existing LPs are never duplicated as prospects.
- **Opportunity** — one investor (or prospect) × one offering: stage, amounts by kind (potential, indicative, soft, accepted), owner, distributor, next action. The same investor can be in diligence for one offering and funded in another.
- **Agreement** — NDA, confidentiality, subscription, side letter; status, signatories, version, evidence. Data-room NDAs are read from the room, not re-entered.
- **Interaction / follow-up** — meetings, calls, notes, with author and date.

Stages derive from the source of truth wherever one exists: subscription stages from onboarding, "commitment accepted" from countersignature, "funded" only from the ledger, NDA state from the data room. A stage set by hand is recorded as such.

## Pipeline: twelve stages in four phases

| Phase        | Stages                                                        |
| ------------ | ------------------------------------------------------------- |
| Prospecting  | Identified, Contacted, Interested                             |
| Diligence    | NDA sent, NDA executed, Due diligence, Indication of interest |
| Subscription | Soft commitment, Subscription in progress, Pending approval   |
| Closed       | Commitment accepted, Funded                                   |

Outside the flow: On hold, Declined, Withdrawn, Not eligible. Three stages are gates and can't be dragged into: **NDA executed** (needs an executed agreement with evidence), **Commitment accepted** (needs the GP's countersignature and a cleared compliance file), **Funded** (needs a receipt in the books).

## Amounts are never mixed

Potential, indicative, soft, accepted, called and received are separate columns and separate bars. Weighted pipeline appears only where probabilities are configured per stage (not configured in the demo, so it shows "not configured"). All demo offerings are in USD; if a BRL offering joins, totals convert at a stated rate and date shown beside the total.

## Illustrative data

Accepted commitments, called and received capital, subscriptions, data-room engagement and NDA states come from existing demo records. Prospects at the early stages, their potential tickets, meetings and notes do not exist anywhere yet; they are marked **Illustrative** wherever they appear.

## Boundaries

Aurum appears as administrator and infrastructure. Distribution is done by the GP's own people or an authorized broker-dealer or placement agent recorded on the offering (Cascade: Summit Securities). Placement fees (phase 4) will record agreements and approvals made elsewhere and hand approved amounts to Billing; they won't compute amounts as owed or pay them.

## Not in the prototype

Closings, mandates, placement agents, fees, matching, e-signature and mail/calendar sync. NDA-gated access is enforced in the app today; enforcement on the server needs the database and sign-in (see `docs/report-studio.md`, "To switch the database on"). E-signature: provider-neutral first (upload the executed PDF and the signature certificate as evidence); DocuSign or Adobe Sign after the owner chooses one (paid).

Stitch and 21st.dev weren't available in this environment (no keys), so the screens were designed directly in the existing workstation components and tokens.

## Risks

1. One identity from prospect to LP: needs a party table in the database; today prospects live in demo data.
2. Regulatory: fee administration and any wording that makes Aurum look like the distributor.
3. Engagement signals (views, downloads) are information, not intent; never scored without a stated method.
4. Server-side NDA gating depends on Supabase.

## Sequence

Prototype (this) → owner approval → phase 1 (registers, pipeline, profiles, follow-ups) → 2 (agreements, data rooms, timeline, e-signature) → 3 (commitments, closings, compliance, Fund Solution, Treasury) → 4 (placement agents, mandates, fees, GP reporting) → 5 (intelligence, matching, integrations).
