# Redesign — Phase 3: 21st.dev component shortlist

Date: 2026-11-25. Searched through the 21st.dev MCP (`search`; no paid `get_component` retrievals used yet).

## Ground rules
- **21st.dev is a reference, not a dependency.** We take the interaction pattern and the anatomy. We rebuild each
  component in `src/components/ui/*` on our tokens. We never paste a component's styling as-is (brief §3, CLAUDE.md).
- **One headless layer underneath, so components share focus, keyboard and ARIA behaviour.** Most shortlisted items
  are built on either Radix or Base UI. Mixing the two would give two focus-trap and portal systems. Proposal:
  **Base UI** (`@base-ui-components/react`). It covers dialog, drawer, menu, select, combobox, popover, tooltip,
  tabs, toast and checkbox in one package, and it is unstyled.
- **New dependencies to approve at Phase 6.** Today there are none of these. Each one replaces hand-rolled code.

| Package | Replaces | Why |
|---|---|---|
| `@base-ui-components/react` | 13 hand-rolled overlays, 19 native `<select>`, 3 tab implementations | Accessible primitives, one focus model |
| `@tanstack/react-table` | 35 hand-written tables | Sorting, filtering, column visibility, pinning. Headless. |
| `recharts` | `analytics/charts.tsx`, `FlowsChart.tsx` | The **one chart library** (owner decision). Themed from CSS variables. |
| `cmdk` | the inert search pill | The command palette list (rendered inside a Base UI dialog) |
| `react-day-picker` | native date inputs | Date and range picker |
| `@fontsource-variable/inter` | — | Interface sans (brief §6). Hanken Grotesk stays available in the Brand studio. |

IBM Plex Mono is dropped from the interface (owner: no monospace numerals). It stays only for code and IDs if needed.

## Shortlist by brief §3 item
For each item: **chosen reference** → what we take → what we change.

| # | Item | Chosen reference (21st.dev) | Take | Change / reject |
|---|---|---|---|---|
| 1 | **Navigation (sidebar)** | `starc007/animated-sidebar` (#29334) | Collapses to an icon rail on desktop. On mobile it becomes a focus-trapped sheet. Nested groups. | No spring or morph animation; 150 ms width transition only. Colours from `--tenant-sidebar`. Active state = 2 px gold rule plus white text, never a filled block. |
| | | `wensity/sidebar` (#31454) | Section labels, count badges, user footer | Badges become plain counts in tabular figures, not coloured pills. |
| 2 | **Financial data tables** | `felipemenezes098/table-20` (#22177) | TanStack wiring: sort, column filter, column visibility, row selection, row actions | Our anatomy: sticky header, **pinned first column with horizontal scroll** (never clip), right-aligned numerals, density toggle (compact 32 px / regular 40 px rows), hairline rules, no zebra stripes. |
| | | `sean0205/data-grid-table` (#4821) | Sticky header and loading-skeleton variants | — |
| 3 | **Search / command palette** | `vovalopuh13/command-palette` (#46285) | ⌘K / Ctrl+K, grouped results, matched-letter highlight, full combobox/listbox semantics, Home/End | **Reject** the cursor-tilt preview pane. Groups: Go to · Funds · Investors · Records · Actions. |
| 4 | **Buttons** | `coss.com/coss-button` (#11387) | Variant set (primary, secondary, outline, ghost, destructive, link), sizes, built-in loading spinner, `asChild` | Primary = tenant ink fill (navy). **Never gold fill.** Three sizes only (28 / 32 / 36 px). Radius 4 px. |
| 5 | **Dropdowns / select** | `kemiljk/combobox` (#46227) | WAI-ARIA 1.2 combobox with grouped results (vehicle pickers, investor pickers) | Hairline popover, 13 px items, check mark instead of a filled selection. |
| | | Base UI `Menu` / `Select` | Row-action menus and simple selects | Replaces the 19 native `<select>`. |
| 6 | **Filters** | `kuratlielia/filter-toolbar` (#35030) | Active-filter chips with remove and clear-all, plus an "Add filter" menu that steps field → value | Chips are hairline-bordered text, not coloured. No bounce animation. |
| | | `laziekiki/filter-token-bar` (#26824) | Roving-tabindex keyboard model for the chips | **Reject** the hand-drawn avatars. |
| 7 | **Dialogs / drawers** | `ddoemonn/drawer` (#23558) | Right-side record **detail drawer** (B's idea): scrim, scroll lock, focus trap, headless hook | Overlays the table, never squeezes it. Full-screen sheet under 768 px. No drag-to-dismiss on desktop. |
| | | `adit-firdaus/sheet` (#43698) | Confirmation dialog that becomes a bottom sheet on phones | Used for four-eyes approvals and destructive confirmations. |
| 8 | **Metric displays** | `shadcnspace/statistics-02` (#19125) | A **horizontal KPI band** in one row, divided by hairlines (not cards) | **Reject** the count-up, sparkline and halftone tiles (#39900, #40086). Values do not animate (brief §10). A change shows a signed figure plus a text label, never a colour alone. |
| 9 | **Charts** | `mahmoudilyan/marmo-chart` (#45569) | A Recharts container with theme-aware colours from CSS variables, an **accessible tooltip** and a legend | Chart palette = ink scale plus one accent, from tokens. Tooltip values in tabular sans. No gradient fills. |
| | | `uiable/chart-tooltip` (#26600) | Tooltip content anatomy (series indicator, label, value) | — |
| 10 | **Loading states** | `arihantcodes/table-empty` (#29396) | The table keeps its header and column widths while loading or empty, with a skeleton and add/import actions | Static skeleton: no shimmer, which respects reduced motion. |
| | | `uiable/uiable-skeleton-table` (#19969) | Row skeleton geometry | — |
| 11 | **Notifications** | `cnippet-dev/toast` (#24297) | Base UI toast stack, auto-dismiss, an action button, positions | Bottom-right, 4 s, status shown as text plus icon. **Reject** the gravity and fanned stacks (#33302, #47304). The bell panel in the top bar is a plain list, built ourselves. |
| 12 | **Tooltips** | `a11ypros/a11y-tooltip` (#34686) | WCAG behaviour: `aria-describedby`, Escape to dismiss, hoverable, edge clamping | Built on Base UI Tooltip. Dark ink surface, 12 px. |
| | | `wensity/tooltip` (#31328) | Keyboard-shortcut hint slot | Shows shortcuts in the command palette and on the sidebar rail. |
| 13 | **Date selectors** | `sean0205/c-calendar-16` (#29224) | Range calendar with a preset sidebar | Presets adapted to fund work: This quarter · Last quarter · YTD · Since inception · Custom. |
| | | `shadcn/date-picker` (#1552) | Single date plus trigger button (notice and due dates) | — |
| 14 | **Currency selectors** | `cnippet-dev/v-group-13` (#28357) | Joined currency select plus amount field | Currency = ISO code (USD, BRL, EUR) without flags. |
| | | `kuratlielia/money-input` (#39640) | Digit grouping while typing; value returned in minor units | **Reject** auto-scaling of font size. Must not change existing calculation code: the input only formats. |
| 15 | **Tabs** (work queue, module tabs) | `cnippet-dev/v-tabs-2` (#24956) | Underline tabs with an animated indicator | Tabs carry counts (All 14 · Approvals 3 …). The indicator is ink, not gold. Replaces 3 tab implementations. |
| 16 | **Micro-interactions** | patterns from the above | Button pressed state, 120–180 ms popover fade/scale, sidebar width transition, drawer slide | Everything respects `prefers-reduced-motion`. No springs, no count-ups, no motion on financial values. |

## Rejected across the board
- Glow, gradient or halftone effects.
- Animated number counters.
- Draggable decorative stacks.
- Emoji or illustrated empty states.
- Any component whose distinctive look would be recognisable as someone else's product.
