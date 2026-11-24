# Aurum Platform

The client platform for Aurum Asset Management. Phase 1 is the interface skeleton with sample data; Supabase (auth + storage) and Plaid come next.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. In the preview, any password and any 6-digit code work:

- an email ending in `@aurumasset.us` opens the **administrator** view (`/admin`)
- any other email opens the **investor portal** (`/portal`)

## What's here

| Area | Route | Notes |
|---|---|---|
| Login + MFA | `/login`, `/login/verify` | Split-screen institutional login, SSO button, 6-digit verification step |
| Admin home | `/admin` | Honeycomb — hover over **Client Portal** to reveal the six solutions |
| Coming soon | `/admin/corporate`, `/offering`, `/multi-family`, `/banking`, `/blockchain` | Planned modules per solution |
| Fund Solution | `/admin/fund` | Overview, funds, fund detail (capital accounts, calls, distributions, documents), investors, onboarding pipeline + submission review, capital calls, distributions, documents, reports, banking (Plaid placeholder) |
| Investor portal | `/portal` | Holdings, capital call notice, documents, subscriptions |
| Subscription flow | `/subscribe/[fundId]` | Passthrough-style 8-step onboarding with profile reuse |

## Fund accounting engine (`src/lib/accounting/`)

Every number on the platform — capital accounts, NAV, DPI/TVPI, calls, distributions — is derived from a double-entry general ledger:

- `coa.ts` — chart of accounts; partner-level accounts (1200, 3000, 3100) are tagged by investor.
- `schedules.ts` / `commitments.ts` — source events per vehicle (calls, distributions, valuations, transfers, closes). These become database rows in Supabase.
- `engine.ts` — posts balanced entries chronologically in integer cents and maintains the partner subledger:
  - capital calls allocated pro rata (largest-remainder rounding, so partner amounts always sum to the call)
  - subsequent-close equalization with interest on prior contributions; existing partners refunded the excess
  - P&L allocated to partners by commitment
  - secondary transfers move commitment and every capital component to the transferee
- `waterfall.ts` — European waterfall: return of capital → preferred return → GP catch-up → carried interest split.

Screens: General ledger (trial balance, financial statements, partners' capital, journal, chart of accounts), Transfers, Closes & equalization, capital call detail and wizard, distribution wizard with waterfall, investor profile self-service with change review.

## Database

`supabase/migrations/20261124000000_fund_accounting_core.sql` — tables for funds, investors, closes, commitments, ledger, capital activity, transfers, equalizations, bank accounts/transactions and profile change requests. The database itself enforces:

- every journal entry balances (deferred constraint trigger)
- partner-level accounts carry an investor; others don't
- posted entries are immutable — corrections use reversing entries
- four-eyes: a capital call or profile change can't be reviewed by the person who prepared it
- row-level security: staff see everything; investors see only their own entities

## Brand

- Logos live in `public/brand/` (`aurum-logo-dark.png`, `aurum-logo-white.png`, `aurum-mark.svg`). Replace these files to update the logo everywhere.
- The hexagon mark is also drawn as a vector in `src/components/brand/Logo.tsx`.
- Colors and fonts are defined once in `src/app/globals.css` (`@theme`). UI type is Hanken Grotesk with Source Serif 4 for display; BlackRock's own typeface (BLK Fort) is proprietary — if Aurum licenses a typeface, change `--font-sans` only.

## Code map

- `src/lib/data.ts` — all sample data. Each type mirrors a future Supabase table (funds, investors, capital_accounts, capital_calls, distributions, onboarding_submissions, documents, bank_accounts).
- `src/lib/solutions.ts` — the six solutions shown in the honeycomb.
- `src/components/ui.tsx` — buttons, panels, stats, status badges.

## Next phase

1. Create the Supabase project, run the migration, load the sample data, and switch `src/lib/data.ts` to live queries.
2. Replace the preview login with Supabase Auth (password + MFA).
3. Integrations: Plaid (US accounts), statement import for non-US banks, KYC/AML screening, e-signature.
