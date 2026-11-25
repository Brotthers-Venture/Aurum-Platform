# Aurum — Institutional Financial Platform Design Transformation

> How to use: in Claude Code, opened in this repo, say **"Read docs/redesign-brief.md and start Phase 1."**
> In later sessions: **"Read docs/redesign-brief.md and docs/redesign-log.md and continue."**

## 0. Precedence and continuity
- This brief **supersedes the visual rules** in `CLAUDE.md` ("Design rules") and `tools/stitch/design.md`
  where they conflict (palette, typefaces, canvas colour). After the owner approves a direction (Phase 6),
  update both files so every future session and every Stitch prompt follows the new system.
- Keep `docs/redesign-log.md` up to date: phase reached, decisions taken, Stitch project/screen IDs,
  21st.dev components chosen, open questions. Read it at the start of every session.
- Work on a branch named `redesign`. Vercel builds a preview for it; merge to `main` only after approval.

## 1. Role and objective
Act as an elite multidisciplinary team: Chief Design Officer, senior institutional financial product designer,
UX architect and principal frontend engineer.

Transform the existing platform into a world-class, proprietary institutional financial operating system.
Quality benchmarks (do **not** replicate, and never copy wording, icons or distinctive layouts):
BlackRock Aladdin (institutional authority), Bloomberg (information architecture), Mercury (elegance),
Stripe (interface craftsmanship), Linear (responsiveness and consistency), Blackstone (timeless identity).

The goal is not another attractive SaaS dashboard but serious financial infrastructure credible to asset
managers, fund administrators, GPs, family offices and institutional investors.

## 2. White label — non-negotiable
The platform is sold B2B and runs under clients' brands (`/admin/brand`, `src/lib/brand.ts`,
`src/components/brand/*`). The new Aurum design is the **default theme**, not hard-coded styling.
- Every colour, typeface and the logo must flow from the tenant brand: extend `Brand` / `brandVars()` with any
  new tokens (e.g. sidebar colour, theme mode) and expose them in the Brand studio.
- Logos only through `AurumLogo` / `AurumMark`; names through `useBrand()` / `<TenantName />`.
- Test the final design with the Northbridge and Halcyon presets as well as Aurum.

## 3. Mandatory use of design integrations
Verify both MCP servers are connected (`/mcp`). Never claim to have used one whose tools were unavailable.

### Google Stitch — visual direction and UX architecture
- Stitch cannot see the running app. Screenshot the current key pages (`npm run dev`, then a headless
  browser) and upload them to the Stitch project as references (`project.upload(...)` or the MCP tools).
- Generate **at least three distinct visual directions**, then refine the chosen one: global layout,
  navigation, dashboards, administration screens, investor portals, page structures.
- Use only the existing demo data (already fictional) in prompts. Never send real investor or banking data.

### 21st.dev — component craftsmanship
Source and adapt: navigation, financial data tables, search/command palette, buttons, dropdowns, filters,
dialogs, metric displays, charts, loading states, notifications, tooltips, date and currency selectors,
micro-interactions. Rebuild every component on the Aurum tokens; never mix incompatible styles.

## 4. Brand identity
Official assets: `public/brand/aurum-logo-dark.png` (light backgrounds) and `public/brand/aurum-logo-white.png`
(dark backgrounds). The yellow double-hexagon emblem is the signature.
- Never recreate, distort or recolour the official logo files; keep proportions and clear space.
- Use the emblem selectively. No unrelated brand symbols.
- The identity must communicate trust, capital preservation, precision, discretion and authority.

## 5. Colour architecture
Starting palette — validate against the logo and WCAG AA, then fix as tokens:
Obsidian Navy #0B1420 · Deep Navy #111D2B · Aurum Gold #FFC400 (the logo uses ≈ #F8C618 — match the logo)
· White #FFFFFF · Platinum #F7F8FA · Silver #E5E7EB · Slate #64748B.
- Gold is a controlled accent: selected indicators, brand details, a few key actions. Never a background.
- Conventional financial colours for gains, losses, warnings and statuses — always with a text label.
- Workspace colours (`FIRM` in `src/lib/firm-colors.ts`) stay distinguishable, including for colour-blind users.
- Avoid heavy beige, yellow backgrounds, gradients, glows and decorative effects.

## 6. Typography
- Interface: Inter, Geist or an equally refined professional sans (self-hosted via @fontsource; add it to the
  Brand studio's font options).
- Clear hierarchy for page titles, section headings, financial metrics, table headings, body, navigation,
  supporting text and disclosures.
- Tabular numerals for money, percentages and NAV; consistent decimal alignment and currency formatting.
- Serif only for the brand and selected editorial moments (sign-in, public entrances, reports).

## 7. Global application architecture
Evaluate (a) a deep-navy sidebar with a white/platinum workspace and (b) a fully light institutional shell.
Sidebar: official logo, refined monochrome icons, clear groups, collapsible, elegant active state, compact
and expanded modes. Header: universal search, application/workspace switching, notifications, profile,
contextual navigation, global actions. The current hub (hexagon solutions + six orbiting workspace marks)
and Google-style top bar exist — keep what works, redesign what doesn't, explain why.
Avoid oversized navigation, floating containers and clutter.

## 8. Financial interface excellence
Tables first: precise column alignment, right-aligned values, consistent currency/percentage formats,
sorting and filtering, sticky headers, optional density, subtle row hover, clear statuses, accessible row
actions, professional empty and loading states. Do not turn every metric into a large rounded card — use
structured layouts, fine separators and real hierarchy. Dense but immediately readable.

## 9. Platform-wide consistency — every module
Fund Solution (overview, analytics, GPs, funds and vehicles, investors per vehicle, onboarding, capital calls,
distributions, general ledger, transfers, closes and equalization, NAV/valuation, documents, reports, banking),
Corporate Solution (formation pipeline) and the public `/incorporate` flow, the hub, Sales, PMO and project
plans, Chat Room, Data rooms (console and visitor room), Billing, Compliance, Access & permissions,
Brand & white label, sign-in, GP portals and investor portals. One operating system — no module with its own
visual identity. GP portals keep their sponsor branding on top of the shared system.

## 10. Interaction and motion
Short, restrained motion: navigation transitions, dropdowns, button feedback, table interactions, sidebar
collapse, contextual loading, dialogs. Respect `prefers-reduced-motion`. Never animate in a way that slows
work or risks transaction accuracy.

## 11. Prohibited
Generic AI-SaaS look, heavily rounded cards, purple/blue gradients, neon, glassmorphism, oversized headings,
needless illustrations, heavy shadows, decorative charts, mixed icon sets, too much gold, consumer or gaming
styling, whitespace that hurts efficiency, impressive features that hurt usability.

## 12. Centralised design system (before any page redesign)
Define colour, typography, spacing, border, radius, elevation, iconography, motion, financial-formatting
conventions, component variants, breakpoints and light/dark theme architecture. Implement them in
`src/app/globals.css` (Tailwind v4 `@theme`), `src/lib/brand.ts` and shared components
(`src/components/ui.tsx`, `src/components/firm/kit.tsx`). No page-specific hard-coded styling.
Document it in `docs/design-system.md`.

## 13. Engineering safeguards
There is no production database yet: all data is fictional demo data in `src/lib/*`, and Supabase migrations
in `supabase/` are prepared but not connected. Keep the demo data as it is.
This is a visual and UX transformation — do not change business logic, calculations (NAV, fees, equalization,
FX), approval and four-eyes workflows, permissions, audit logging, encryption, or the data model.
Keep accessibility, keyboard navigation, responsive behaviour and performance. Follow `AGENTS.md` (Next.js 16)
and the engineering notes in `CLAUDE.md`. Never print or commit API keys.

## 14. Execution
1. Audit the app (screenshots at 1440px and 390px), the frontend architecture and the brand assets.
2. Stitch: three institutional directions, from uploaded screenshots plus this brief.
3. 21st.dev: shortlist components for each item in section 3.
4. Pick the strongest direction with reasons; draft the design system.
5. Prototype in Stitch: app shell, Fund overview dashboard, a dense financial table, treasury/banking.
6. **Stop and present to the owner** (images + rationale + trade-offs). Wait for approval.
7. Implement incrementally on `redesign`: tokens → shell → shared components → modules, one commit each.
8. Render every module at desktop, laptop and mobile widths and inspect the screenshots.
9. Refine alignment, type, spacing, states, accessibility, consistency.
10. Regression check: `npx tsc --noEmit -p .`, `npx eslint src`, `npx next build`, click through key flows
    (sign-in, hub, capital call, data-room visitor gates, formation flow, brand switch). Then ask to merge.

## 15. Quality bar
Judge against: institutional credibility, sophistication, brand distinctiveness, typography, financial
readability, component consistency, navigation efficiency, interaction quality, accessibility and
engineering quality — by inspecting real screenshots, not by self-assessment alone. It must look designed
by a world-class institutional fintech team, never like an AI template, with a recognisable identity of its own.
