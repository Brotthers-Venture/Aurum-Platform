# Banking Solution: accounts, cash and payments (prototype)

Status: prototype for owner review (26 Nov 2026), `redesign` branch. **No bank is connected and no money moves.** Fund accounts mirror the funds' books; company and family accounts, and three receipts waiting to be matched, are illustrative and labelled.

## Model

The firm is not a bank and never holds client money. Each client entity's accounts are opened in the entity's own name at a partner bank (US) or a licensed partner institution (Brazil). The firm operates the platform under the client's mandate: it prepares payments and releases approved ones; client signatories approve under a policy they sign. Existing accounts at other banks are connected read-only (Open Finance in Brazil, an aggregator in the US) or kept from statements.

## What was learned from leading banks and treasury tools (ideas only, nothing copied)

- **Cash position with pending actions** on the home page, today against the prior business day (J.P. Morgan Access). Positions by entity and currency, with what is committed and expected (Kyriba, Trovata).
- **Approval and release are separate steps**; the releaser is a designated role (Ramp). The person who prepares a payment cannot approve it (Brex).
- **Approval tiers by amount**: single approval up to a limit, dual above (Itaú's _alçadas_).
- **A receiving number per investor**, so capital-call receipts match themselves (Increase, Carta).
- **Callbacks on changed bank details**: call a number already on record, never one from the request; place the call yourself; record who you spoke with (J.P. Morgan, Wells Fargo, BOK Financial guidance on payment-instruction fraud).
- **Accounts by purpose** (operating, collections, distributions, tax reserve) and instant transfers between accounts at the same bank (Mercury, Column).
- **Payment runs**: several payments approved and released together (Ramp, Wise).
- **Disclosure**: platforms state plainly that they are not a bank and name the partner bank (Mercury).

## Screens (`/admin/banking`)

- **Cash position**:
  - total cash and each entity's position: today, change on the prior day, committed out, expected in, projected;
  - pending actions: to approve, to release, on hold, payees to call back, receipts to match;
  - today's cutoffs and recent activity.
- **Payments**:
  - tabs by stage, with a drawer per payment showing the rail, why that rail was chosen, the funding check, the approval chain, the release step and the history;
  - new payment form with automatic rail choice and the policy it will need;
  - payment runs.
- **Payees**: confirmation status and the number on record; the callback checklist (confirm, or refuse and flag to compliance).
- **Accounts**: register by entity and how each account is reached; account detail with a balance chart, transactions and what each matches in the books, investor account numbers, and who can move money.
- **Reconciliation**: receipts the platform could not match, each with a suggestion and the reason, or a box to classify it.
- **Approval policies**: tiers, client signatories, firm approvers, releasers, payee rules.
- **Client portal → Banking**: the client's accounts, payments waiting for its approval (approve or reject), payments and recent activity.

## Data

- **Cordillera Infrastructure Partners I:** the account is the fund's cash account (1000). Capital Call No. 7 has $8.1M received and $4.65M owed, due Dec 1. The two payments it funds, $10.85M to Ribeira Solar and $1.9M of fees, are waiting for approval and release. The projected balance comes to exactly zero.
- **FIP Horizonte and Meridian:** their books hold no cash, so their accounts show zero.
- **Simulation:** approvals, releases and matches are kept in this browser (`aurum-banking-v1`) and written to the audit log. Posting a matched receipt to the general ledger is simulated.

## To make it real

- A partner bank in the US and a licensed institution in Brazil, chosen by the owner, plus the program agreement.
- Account opening in the client's name (KYB), and counsel's view on money transmission. Under the partner-bank model the firm stays out of the flow of funds.
- The bank's API for balances, payments, virtual account numbers and webhooks; Pix and TED through the Brazilian partner.
- Read-only connections for external banks.
- Ledger posting from matched receipts.
- Strong sign-in for approvers (passkeys), with approval by phone.
- An independent security review before any live payment.
