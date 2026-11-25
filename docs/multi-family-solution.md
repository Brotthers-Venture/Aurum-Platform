# Multi-Family Solution — private wealth and family office

Status: **design and specification only. Awaiting owner approval before any implementation.**
Prototypes: `design/stitch/multi-family/` (gitignored; renderer in `src/index.html`, data in `src/data.js`).
Date: 25 Nov 2026. Everything below uses **demo data** (reporting date 24 Nov 2026, USD, EUR 1.08, BRL 5.40).

## 1. Research note

- The Copia pages could not be fetched in this session: the fetch needed an approval while you were away. Nothing from
  Copia was used. Send a message and I will read them for **function and mood only**, as the brief says.
- The direction below comes from the brief itself and from how family offices actually work: consolidated net worth
  across entities, ownership that is legal and economic at once, private markets reported quarterly and late,
  liquidity planned around capital calls, and a relationship manager who owns the client relationship.
- No layout, icon, label or terminology was taken from any third-party product.

## 2. Prototypes delivered (17 images)

| # | Experience | Shell | Platinum 1440 | Obsidian 1440 | Other |
|---|---|---|---|---|---|
| 1 | Private client wealth overview | Client portal | ✓ | ✓ | 1024, 390, Northbridge |
| 2 | Investments and performance | Workstation | ✓ | ✓ | |
| 3 | Ownership intelligence | Workstation | ✓ | ✓ | Client view 1024 (map), 390 (structured list) |
| 4 | Banking and liquidity | Workstation | ✓ | ✓ | |
| 5 | Multi-family administrator workstation | Workstation | ✓ | ✓ | |
| 6 | Documents and private client services | Client portal | ✓ | ✓ | |

Design decisions worth reviewing:
- **Two shells.** Families see a calm portal (top navigation, serif titles, one large figure). Staff work in the Direction D
  workstation with the Hexa Room. Same data, two densities.
- **Net worth is explained, not just shown.** The YTD change is split into investment return, contributions and
  withdrawals, and currency, so a family never mistakes a deposit for performance.
- **Every value carries its source and age.** Investments show the source (custodian, manager report, appraisal, board
  valuation, manual) and freshness; stale values are flagged (the art valuation is 512 days old).
- **Ownership uses one record per entity.** Legal ownership lines carry %, beneficial interest is dashed, family roles
  dotted; asset groups are hexagons valued net of debt. The foundation is outside the consolidation and drawn dashed.
  On a phone the map becomes a structured list, because a tree is unreadable at 390 px.
- **Liquidity separates what is known from what is assumed.** Ledger (solid), confirmed (accent) and projected (dashed,
  hatched future) never share a line. No live bank connection is claimed; balances are "from statements".
- **Private markets show what can be computed honestly.** TVPI, DPI and RVPI come from commitment, called, distributed and
  NAV. Net IRR is shown as "needs dated cash flows" rather than invented.
- **Document extraction is labelled "Proposed capability"** and nothing is applied until a person reviews it.
- **White label.** The Northbridge variant (Valença family) swaps logo, ink, accent, serif and RM; layout is unchanged.

## 3. Information architecture

Multi-Family Office hexagon (staff), pages in the Hexa Room:
Overview (families) · Investments · Performance · Private markets · Ownership · Real estate · Banking & liquidity ·
Planning · Managers & advisors · Tax center · Documents · Family governance · Reports.

Client portal (family members, in the serving firm's brand):
Overview · Wealth · Ownership · Documents · Messages (Corporate Chat, scoped to the family).

Scope rule: a **family is a permission scope**. Staff see families they serve; a tenant (Northbridge) sees only its own
families; a family member sees only their family, and only the entities they are entitled to (for example a beneficiary
may see the trust but not the foundation).

## 4. Data architecture and gaps

What the codebase has today: Fund Solution vehicles, investors, capital activity and bank accounts for vehicles;
Corporate Solution formations (companies); `lib/accounting`, `lib/lpa`; `Currency = "USD" | "BRL"`.

What the Multi-Family Solution needs (proposed, not built):

| Record | Key fields | Reuses |
|---|---|---|
| Family | id, name, servedBy (firm or tenant), rm, members | parties `client` |
| Person | id, family, roles (principal, trustee, beneficiary, adviser) | comms people |
| Entity | id, family, type (trust, LLC, LP, foundation, company), jurisdiction, consolidated? | Corporate formation record |
| Ownership | parent, child, legal %, economic %, class (legal, beneficial, GP) | — |
| Holding / asset | id, owner entity, class, ccy, value, cost, source, asOf, liquid, manager/custodian | — |
| Valuation | asset, date, value, source, document | — |
| Liability | owner, lender, ccy, balance, rate, maturity, secured asset | — |
| Account | institution, entity, ccy, balance, asOf | `BankAccount` (generalised beyond vehicles) |
| Obligation | date, amount, kind, confirmed/projected, source document | Fund capital calls when administered here |
| Private-market position | commitment, called, distributed, NAV, cash-flow dates | Fund Solution capital account when administered |
| Document | family, related record, type, extraction status | Data rooms storage |

Gaps to close first: generic Entity/Ownership/Holding/Valuation records; `Currency` must include EUR (and more);
`BankAccount` generalised from vehicles to any entity; one rule that a company exists once (Corporate Solution) and the
Multi-Family Solution references it.

## 5. Demo dataset and reconciliation

Halvorsen family (served directly): gross assets $94.9M, liabilities $9.3M, **net worth $85,550,000**.
- YTD: investment return +$6.48M, contributions and withdrawals −$1.35M, currency +$0.31M = **+$5.44M** (start $80.11M).
- Halvorsen Holdings LLC held directly $37.8M = 4.2 + 18.4 + 12.5 + 3.6 + 0.6 − 1.5 (credit line).
- Ownership groups reconcile to net worth: trust direct 12.1 + Holdings 37.8 + Real Estate LP 9.4 + Nordvik 20.3 +
  Marine 6.0 = 85.6 (rounding).
- Kestrel Growth Fund III: commitment 4.0M, called 3.0M, distributed 0.9M, NAV 3.6M → TVPI 1.50×, DPI 0.30×,
  RVPI 1.20×, unfunded 1.0M; outstanding call $400,000 due 4 Dec.
- 90-day liquidity: confirmed −$638,000 (call 400k, property tax 96k, mortgage 142k); projected +$115,000
  (distribution +85k, rent +280k, Meridian call −250k).

Valença family (served by Northbridge): gross $40.2M, net $39.1M, mostly BRL.
Administrator view: assets under administration $135.1M = 94.9 + 40.2; open requests 4; documents pending 12.

Labelled throughout: "Demo data". Charts of history are marked **Sample series**; TWR figures are sample values; the
manager names marked "(sample)" are fictional.

## 6. Proposed vs available

| Capability | Status |
|---|---|
| Consolidated net worth, allocation, exposure from recorded holdings | Proposed — can be built on demo data now |
| Ownership map and drawer | Proposed — needs Entity/Ownership records |
| Fund Solution positions flowing into a family's investments | Proposed — uses existing capital accounts |
| Liquidity projection from notices and schedules | Proposed |
| Document extraction | **Proposed capability** — needs a provider; not without approval |
| Live bank or custodian feeds | Not proposed now — paid providers need approval |
| Payments or trading | Excluded — no financial execution without approval |

## 7. Stages (after approval)

1. Data model and demo seed (Family, Entity, Ownership, Holding, Valuation, Liability, Obligation); EUR currency.
2. Client portal: Overview and Ownership (both themes, tenant brand, 390 px).
3. Workstation: Families, Investments, Banking & liquidity, Ownership.
4. Documents and requests, wired to Corporate Chat and the spine (each request becomes a matter; approvals are ledger events).
5. Fund Solution link: administered funds feed private-market positions; Corporate formations become entities.
6. Supabase persistence and row-level security per family (P4 of the integration blueprint).

Each stage: tsc, eslint, build, visual check in both themes, then deploy.
