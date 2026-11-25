# AURUM — Direction D: Institutional Financial Workstation

> Approved by the owner on 25 Nov 2026. Supersedes prototypes P1–P5 as the visual direction.
> Design exploration only — **no production implementation until the owner approves the visual direction.**

## 1. Primary design direction
Use the dark financial workstation reference as the primary inspiration for Aurum's application architecture,
visual composition, navigation, modularity and interface sophistication. Users can switch seamlessly between
light and dark themes.

The objective is a proprietary institutional financial operating system combining the institutional authority of
BlackRock, the prestige of private banking, the sophistication of advanced financial workstations, the operational
capability of enterprise treasury platforms and the craftsmanship of world-class financial technology.

Do not reproduce any reference platform. Extract principles only and establish an original Aurum identity.

## 2. Visual excellence is the primary objective
Do not let technical requirements dilute the visual ambition. The platform must feel bespoke, exceptionally refined,
prestigious and technologically sophisticated — never a conventional enterprise dashboard with different colours.
Every component must show intentional craftsmanship. Do not confuse minimalism with a lack of sophistication.

## 3. Mandatory design integrations
Verify both MCP servers are connected before starting; never claim to have used one that was unavailable.
- **Google Stitch** — visual composition, application architecture, design exploration and screen prototyping.
- **21st.dev** — discover, adapt and refine premium components: navigation, buttons, charts, tables, dropdowns,
  tooltips, command menus, widgets, micro-interactions. Never import generic components unchanged; customise each
  into one cohesive Aurum design system.

## 4. Application architecture — desktop-first financial workstation
A sophisticated workstation layout, not a conventional SaaS admin dashboard:
- Refined global navigation bar; collapsible contextual sidebar.
- Modular financial workspaces; customisable dashboard widgets; resizable panels where operationally useful.
- Contextual detail drawers; integrated analytics; full-screen analytical views.
- Universal search and command centre; workspace and entity switching.
- Configurable information density; persistent user layout preferences.

Prioritise the administrative experience at **1440, 1920 and 2560 px**. Use space intelligently for analytics,
operational tables and modular workspaces; it must feel natural on large professional monitors and multi-monitor
set-ups. Avoid excessive padding, oversized cards and empty areas. Every element needs an operational or
analytical purpose.

**Responsive:** the investor portal gets equal attention on desktop and mobile. Show how Home and the investor
portal adapt to tablet (≈1024 px) and phone (390 px): panels stack, the sidebar becomes a drawer, nothing overflows.

## 5. Unified light and dark themes — one architecture
Design **Obsidian (dark) first**, establish its architecture, then translate the same components and layout into
**Platinum (light)**. Both themes share identical layouts, navigation, component dimensions and proportions,
typography hierarchy, financial information, interactions, widget positions and functionality. Switching themes
must never rearrange the application. No separate visual architecture per theme, no second frontend.

### Obsidian — dark
Technological sophistication, institutional intelligence, financial precision. A premium workstation — never a
gaming interface or crypto exchange.
Suggested: background #0B1015 · secondary #10171F · elevated #161F29 · borders #25303C · text #F1F3F5 ·
secondary text #98A4B3. Differentiate surface layers for depth without heavy shadows. A very subtle atmospheric
gradient in the global header only if it improves the composition — nowhere else.

### Platinum — light
Private-banking elegance, clarity, prestige — equally compelling as the dark theme.
Suggested: background #F3F4F6 · secondary #FFFFFF · elevated #FAFBFC · borders #DFE3E8 · text #101820 ·
secondary text #64707D. Refined neutral surfaces, subtle depth, precise separation between areas. No heavy beige,
washed-out type or generic white dashboard cards.

### Gold
Match the official logo gold: **#F8C618 on light, #FFCA00 on dark** (not #FFC400). Use a darker accessible gold for
any text on light surfaces. Gold is a sophisticated accent — never a dominant background.

### Theme controls
A refined selector in the global header or user preferences: **Light / Dark / System**, persisted per user across
sessions. Implemented through centralised semantic tokens and CSS variables. Validate every colour against the
official branding and WCAG AA.

## 6. Official Aurum branding
Use `public/brand/aurum-logo-dark.png` (light surfaces) and `public/brand/aurum-logo-white.png` (dark surfaces) —
upload both to Stitch and place the correct one on **every** screen. No placeholders. Never recreate, distort,
recolour or replace the logo. The yellow double-hexagon emblem is the signature: explore subtle hexagon-derived
details (selected navigation indicators, loading states, distinctive interface details) — sparingly.

## 7. White-label design integrity
Obsidian and Platinum are the **default theme presets**. Every theme colour comes from semantic tokens in the brand
model (`src/lib/brand.ts`), so a tenant's brand — and a sponsor's inside its own portal — re-skins both themes,
including configurable sidebar and brand colours. Tenants may change colours, logos and supported theme tokens;
typography hierarchy, spacing, component proportions, interaction patterns and accessibility stay fixed.
Validate tenant colours for contrast and fall back to accessible alternatives automatically. White label must
never compromise visual quality. Show one screen in the **Northbridge** preset to prove it.

## 8. Typography
Typography is a defining characteristic of Aurum.
- A sophisticated display typeface for major financial figures (light to medium weight, exceptional spacing) and a
  highly legible professional sans for operational interfaces.
- **Open-licence fonts only** (e.g. SIL OFL, self-hosted via @fontsource). Ask the owner before proposing any
  commercial typeface.
- Tabular numerals in financial tables — never monospace.
- Clear contrast between headline figures, page titles, section headings, financial data, supporting information
  and controls.
- Always capitalise NAV, TVPI, DPI, IRR. No oversized marketing type in operational screens.

## 9. Financial dashboard composition
Move away from repetitive KPI-card grids. Compose headline figures, integrated charts, compact breakdowns and
operational intelligence — different compositions for different purposes, one design language. Where relevant:
total NAV, assets under administration, cash balances, commitments, unfunded commitments, capital activity,
liquidity forecasts, cash by institution, NAV by vehicle, capital-call collection progress, upcoming obligations,
recent activity.

## 10. Proprietary financial visualisation system
A recognisable, consistent Aurum charting language: refined area charts, sparklines, allocation charts, stacked bars,
capital-activity timelines, liquidity forecasts, cash-flow views, portfolio breakdowns, collection-progress indicators.
Craft: elegant chart typography, refined gridlines and axes, interactive crosshairs, sophisticated financial tooltips,
period selectors, forecast shading, integrated sparklines, allocation breakdowns, consistent formatting, smooth and
purposeful interaction. Both themes supported seamlessly. Gold for the primary series, neutrals for secondary series,
conventional green/red only for gains, losses and status. Charts are analytical instruments — use them only where
they add genuine analytical value.

## 11. Data honesty
Use only figures that exist in the demo data (`src/lib/*`). Never invent historical performance, projections or
percentage changes. Where a chart needs history or a forecast that does not exist, label it **"Sample series"** in the
prototype and list it in `docs/redesign-log.md`; at implementation it becomes clearly labelled demo data, never
presented as real performance. No invented claims (security, SLAs, audits, versions) and no truncated status labels.

## 12. Premium component craftsmanship
Refine with 21st.dev: navigation and workspace switching, financial tables, search and command menus, buttons and
segmented controls, date-range selectors, filters and dropdowns, transaction drawers, confirmation dialogs,
notifications, loading and empty states, widget customisation, theme switching. Restrained micro-interactions,
smooth transitions; no neon, glassmorphism or over-rounded components.

## 13. Performance and interaction quality
Exceptionally responsive: efficient rendering, lightweight animation, fast navigation, smooth interaction. Respect
`prefers-reduced-motion`. No unnecessary dependencies or decorative effects that cost performance.

## 14. Investor portal
Same design system, calmer and personal — an exclusive private-banking relationship, not an admin interface.
Prioritise: investor name, relationship manager, total account value, commitments, contributions and distributions,
holdings, upcoming obligations, statements, documents, personalised next actions. Sponsor white label preserved;
both themes available.

## 15. Reference management
- Move `References/` to `design/references/` and add `design/references/` to `.gitignore` **before staging anything**.
  Third-party screenshots are mood references only and must never be committed.
- Convert AVIF/SVG/WebP to PNG if Stitch requires it, then upload them to Stitch as mood references.
- Take principles only (density, interaction patterns, sophistication) — never proprietary layouts, specific
  arrangements, colours, header treatments, logos, wording, icons or visual identities.
- Never send confidential or production data to external design services.

## 16. Preserve existing functionality
A design and UX transformation, not a backend rebuild. Preserve calculations, fund-administration workflows,
accounting logic, payment approvals and four-eyes controls, authentication, authorisation, permissions, data model,
audit trails, investor records and business logic. Keep the work queue, detail drawers and the corrections already
agreed (no monospace numerals, uppercase financial abbreviations, sidebar colour as a white-label token).

## 17. Implementation staging (after approval only)
Design widgets, resizable panels, full-screen views and saved layouts now; build them in stages:
tokens and themes → shell and navigation → tables and charts → drawers and command menu → widget customisation last.

## 18. Deliverables
Reject P1–P5 as the final direction. Save everything to `design/stitch/direction-d/`:
1. Home — Dark  2. Home — Light
3. Fund Overview — Dark  4. Fund Overview — Light
5. Banking and Treasury — Dark  6. Banking and Treasury — Light
7. Investor Portal — Dark  8. Investor Portal — Light
9. One screen in the **Northbridge** white-label preset
10. Tablet (≈1024 px) and phone (390 px) adaptations of **Home** and the **investor portal**

Light and dark pairs must share identical layouts and information architecture.

## 19. Quality control and approval
Before presenting, visually inspect every prototype for institutional credibility, originality, brand recognition,
typography, financial readability, alignment and proportions, component craftsmanship, theme consistency,
information accuracy, accessibility and operational efficiency. Re-check every Stitch image for invented content.
If anything still resembles a generic admin template, refine it before submission.

The goal is not merely a clean interface: it is a world-class, recognisable, proprietary institutional financial
platform that credibly belongs to a multibillion-dollar institution with its own design department.

Present all deliverables, record progress in `docs/redesign-log.md`, then **stop**. No production implementation
until the owner approves the visual direction.
