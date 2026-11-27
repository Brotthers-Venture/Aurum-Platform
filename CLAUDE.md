@AGENTS.md

# Aurum Platform

Institutional operating platform for **Aurum Asset Management** (aurumasset.us, Orlando, FL) — fund
administration, corporate services and client portals for GPs, LPs and companies in the US, Brazil and
offshore. It is sold **B2B and white-label**: other firms run it under their own brand.

Owner: Luca Ott (founder). Deployed on Vercel from GitHub (`Brotthers-Venture/aurum-platform`, branch `main`).
Live: https://aurum-platform-6sal.vercel.app

## Map of the app
- `src/app/admin` — the firm's console. Hub (`/admin`) with six **solutions** (Fund live, Corporate live, others
  coming) and six **firm workspaces** orbiting the centre: Sales, PMO, Chat Room, Data rooms, Billing, Compliance.
- `src/app/admin/fund` — Fund Solution: GPs, funds/vehicles, investors (per vehicle), capital activity, ledger.
- `src/app/gp/[gpId]`, `src/app/investor`, `src/app/portal` — client portals (GP and LP), branded per sponsor.
- `src/app/room/[linkId]` — public data-room visitor view. `src/app/incorporate` — public company-formation flow.
- `src/app/admin/brand` — **Brand & white label** studio. `src/lib/brand.ts` holds the tenant brand model.
- `src/lib/*` — demo data and domain logic (no database yet; Supabase migrations in `supabase/` are prepared).
- `tools/stitch` — Google Stitch CLI + design brief. `.mcp.json` — Stitch and 21st.dev MCP servers.

## Design rules (follow strictly — the owner rejects anything that looks AI-made)
- **Start with `.claude/skills/aurum-design/SKILL.md`** for any interface work: the owner-approved decisions (the published dark matte look, gold hexagon, module colours, hub and sidebar), the order of precedence over the third-party design skills in `.claude/skills/`, and the visual check required before presenting. Where a line below differs from what is published, the published, approved look wins.
- Read `tools/stitch/design.md`. Private-bank tone: warm cream canvas, navy ink, serif headlines
  (Source Serif 4), Hanken Grotesk interface, gold used sparingly, hairline borders, dense data layouts,
  tabular numbers, few colours. No gradient blobs, glassmorphism, emoji, icon-in-circle feature grids.
- **White label:** never hard-code brand colours. Use the tenant variables: `var(--tenant-ink)`,
  `var(--tenant-accent)`, `var(--tenant-accent-ink)`, `var(--tenant-metal)`, `var(--tenant-canvas)`,
  `var(--tenant-surface)`, Tailwind `ink-*`/`gold-*`/`stone-*` (rebuilt from the brand), and
  `FIRM.<module>` from `src/lib/firm-colors.ts` for workspace colours. Logos/marks via `AurumLogo`/`AurumMark`
  (`src/components/brand/Logo.tsx`), names via `useBrand()` or `<TenantName />` — never the literal "Aurum"
  in client-facing text.
- Shared UI: `src/components/firm/kit.tsx` (ModuleHeader, Card, Kpi, Pill, buttons, Toast), `src/components/ui.tsx`.
  Every admin page uses the same top bar (`AdminTopBar` → `HubTopBar`).
- English only. Plain, specific, institutional wording.

## Copyright
Learn from other products (Peony, Datasite, monday.com, Smartsheet, Vistra…) for ideas and flows only.
Never copy their wording, labels, icons, illustrations or distinctive layouts. Write our own copy.
Components from 21st.dev or designs from Stitch are starting points: adapt them to our tokens and voice.

## Working with Stitch and 21st.dev
- New screens: generate 2–3 options in Stitch (`npm run stitch -- generate "…"` or the MCP tools), show the
  owner, then rebuild the chosen one as real React components with our tokens and demo data.
- Use 21st.dev to find better components (tables, filters, date pickers, drawers) and adapt them.
- API keys live in the user's environment (`STITCH_API_KEY`, `API_KEY_21ST`). Never print or commit them.

## Engineering
- Next.js 16 App Router with `cacheComponents`: `searchParams`/`headers()` must sit inside `<Suspense>`.
- React 19 + React Compiler lint: no components defined inside render, no ref reads during render.
- Before finishing: `npx tsc --noEmit -p .`, `npx eslint src`, `npx next build`. Look at the page in a browser.
- Prettier has no config — if you reformat, use `--print-width 180` to match the codebase.
- Commit with a clear message, then push to `main` so Vercel deploys. Pull first if another session
  (Claude in the web app) may have pushed.
