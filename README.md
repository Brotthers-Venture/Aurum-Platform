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

## Brand

- Logos live in `public/brand/` (`aurum-logo-dark.png`, `aurum-logo-white.png`, `aurum-mark.svg`). Replace these files to update the logo everywhere.
- The hexagon mark is also drawn as a vector in `src/components/brand/Logo.tsx`.
- Colors and fonts are defined once in `src/app/globals.css` (`@theme`). UI type is Hanken Grotesk with Source Serif 4 for display; BlackRock's own typeface (BLK Fort) is proprietary — if Aurum licenses a typeface, change `--font-sans` only.

## Code map

- `src/lib/data.ts` — all sample data. Each type mirrors a future Supabase table (funds, investors, capital_accounts, capital_calls, distributions, onboarding_submissions, documents, bank_accounts).
- `src/lib/solutions.ts` — the six solutions shown in the honeycomb.
- `src/components/ui.tsx` — buttons, panels, stats, status badges.

## Next phase

1. Supabase: schema from `src/lib/data.ts`, Auth with MFA, row-level security (staff vs investor), Storage for documents.
2. Replace the preview login with Supabase Auth.
3. Plaid Link for fund operating accounts and investor distribution-account verification.
