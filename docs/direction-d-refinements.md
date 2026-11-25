# AURUM — Direction D: final refinements

> Owner decision, 25 Nov 2026. Direction D (`docs/direction-d.md`) is approved as the foundational design architecture,
> subject to the refinements below. Read both documents and `docs/redesign-log.md` before starting.
> Produce refined prototypes and the typography comparison, then **stop for final approval**.

## Part 1 — Refinements to the current prototypes
1. **Header:** move Light / Dark / System into the account menu and "Add widget" into the Layout menu. The header keeps
   the logo, application navigation, entity or vehicle switcher, search and command, notifications and the account.
2. **Navigation rule:** the top bar holds applications (Home, Fund, Corporate, Data rooms, Billing, Compliance; Sales,
   PMO and Chat Room through the app switcher). The sidebar holds only the pages inside the current application.
3. **Gold discipline:** gold for the primary chart series and the main action only. Row actions such as "Review" are
   neutral and turn gold on hover or focus.
4. **Panel controls** (drag, expand, menu) appear on hover, on keyboard focus and through an accessible touch
   interaction — not permanently.
5. **Upcoming obligations:** redesign as a compact dated list or timeline without dashed icons. Remove the dead space
   under the Capital activity chart and in the portal's "Your requests".
6. **Data honesty:** the Q4 2026 point and any series not in the demo data are labelled "Sample series" or removed.
7. **Platinum** gets the same refinement as Obsidian (see 11).
8. **Typography:** headline figures get a display face (see 12).
9. **Wording:** "Approver 1 (Empty)" becomes "Awaiting first approver".

## Part 2 — Further requirements

### 10. Proprietary visual identity
The Obsidian direction is strong, particularly the 1920 px Home, Fund overview and Banking & treasury screens.
Preserve their architecture. Refine the execution so Aurum is recognisable as a proprietary institutional platform,
not a collection of standard dashboard components: subtle tonal depth, intentional surface layering, refined
separators and exceptional typography. No excessive gradients, glassmorphism, glowing borders, oversized rounded
corners or decorative effects.

### 11. Platinum refinement
Platinum gets the same attention as Obsidian. It should evoke a private-banking statement combined with a
professional workstation: subtle warm-neutral surfaces, refined contrast, understated borders, deliberate hierarchy.
Identical functionality, layouts and component proportions across both themes.

### 12. Typography system
Install both combinations (open licence, self-hosted via @fontsource) and render them for real:
- **Option A:** Manrope Light for headline financial figures · Inter for operational interfaces · Source Serif 4 for
  selected investor-portal headings.
- **Option B:** IBM Plex Sans Light for headline figures · Inter for operational interfaces · Source Serif 4 for
  selected investor-portal headings.

Tabular numerals in financial tables; verify rendering of large currency values (e.g. $284,631,481 and R$ 24,500,000)
and their alignment. Show both options in the same Home hero component, in both themes, before selecting.

### 13. Widget architecture
Preserve the modular workstation. Each supported widget should eventually allow: drag and reposition, resize,
full-screen, minimise or collapse, remove and restore, configure supported data and display options, save within
named layouts, reset to default. Design a widget library organised by application and analytical purpose, and
default layouts for **Operations, Executive Overview, Fund Review and Treasury**, using only supported functionality
and data. Controls appear on hover, keyboard focus and accessible touch. **Do not implement widget customisation
before its scheduled stage.**

### 14. Financial chart refinement
One consistent Aurum charting language: chart proportions, axis typography, gridlines, interactive tooltips,
crosshairs, series visibility controls, forecast shading and full-screen analytical views. The right chart type for
each metric. Never introduce artificial NAV history, returns or bank balances to improve appearance. Clearly
distinguish **historical data, scheduled transactions, draft transactions and sample series**.

### 15. Responsive experience
Do not stack every desktop widget on mobile.
- **Admin on mobile:** urgent approvals, outstanding obligations, key balances, recent activity and essential actions
  first; secondary analytics collapsed or in dedicated views.
- **Investor portal on mobile:** a premium private-banking experience — prominent account value, upcoming
  obligations, documents and access to the relationship manager.

### 16. Financial consistency
Audit every displayed figure against the demo data. Define and consistently distinguish commitments, called capital,
contributed capital, outstanding receivables, uncalled commitments, unfunded commitments, distributions and NAV.
Validate totals, percentages, currency conversions, chart values and capital-account balances across admin and
investor screens. Record the definitions in `docs/design-system.md`. Never silently change financial logic to suit a
design; report any data inconsistency found instead of fixing it quietly.

### 17. Accessibility and interaction
Hover-only controls must work by keyboard and touch. Validate contrast in both themes and in the Northbridge and
Halcyon white-label presets. Consistent loading, empty, error, disabled, selected and focused states. Financial data
stays legible at different resolutions and browser zoom levels (100–200 %).

### 18. Implementation safeguards (after final approval only)
- Work exclusively on the `redesign` branch.
- Preserve business logic, routes, permissions and data models.
- Order: semantic tokens and themes → application shell and navigation → (later stages per `docs/direction-d.md` §17).
- Validate white label in both themes.
- Checks: `npx tsc --noEmit -p .`, `npx eslint src`, `npx next build` (there is no automated test suite yet), then
  click through key flows: sign-in, Home, a capital call, the data-room visitor gates, the formation flow, a brand switch.
- Document architectural decisions and any deviation from the approved design in `docs/redesign-log.md`.
- Push the branch and give the Vercel preview URL once deployed; if it cannot be read, tell the owner where to find it
  (Vercel → aurum-platform-6sal → Deployments → newest Preview for `redesign`).
- **Never merge into `main` without the owner's explicit approval.**

Use Stitch and 21st.dev selectively for exploration and component craftsmanship, without sacrificing consistency.
The objective: a proprietary institutional financial operating system that combines the analytical power of a
professional workstation with the sophistication of a private bank.

## Deliverables for this round
Save to `design/stitch/direction-d/refined/`:
1. Home — Obsidian and Platinum (1920 px), with refinements 1–9 applied
2. Investor portal — Obsidian and Platinum (desktop) and mobile (390 px)
3. Admin Home on mobile (390 px), prioritised per §15
4. Typography comparison: the Home hero in Option A and Option B, both themes
5. Widget library overview and the four default layouts (one sheet)

Inspect every image, update `docs/redesign-log.md`, present the results and **stop for final approval**.
