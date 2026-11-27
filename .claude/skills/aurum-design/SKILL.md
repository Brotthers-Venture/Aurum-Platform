---
name: aurum-design
description: Aurum Platform's design engineering rules. Use for any interface work in this repository — a new screen, a refinement, a component, motion, a chart, a table, icons, theming or white label — and before presenting any UI change. It says which decisions are already approved, how the third-party design skills in .claude/skills rank against them, and the visual check every change must pass.
---

# Aurum design engineering

Aurum is institutional infrastructure: fund administration, corporate services and client portals, sold white-label. Interfaces here are tools people operate all day. The bar is precision and calm, and the owner decides the look.

## 1. Order of precedence

When instructions disagree, the higher line wins. Third-party skills never override lines 1–3.

1. **Owner-approved Aurum decisions** (section 2). What is published on `main` is the approved look unless the owner says otherwise.
2. **Aurum's brand and white-label system** (`src/lib/brand.ts`, the tenant variables, `CLAUDE.md`).
3. **Institutional financial software usability**: correct numbers, clear basis and dates, dense scannable registers, accessible in both themes.
4. **Impeccable** (`.claude/skills/impeccable`) — refinement method. Aurum's screens are its *Operate* mode.
5. **Jakub Krehel** (`better-ui`, `better-typography`, `better-layout`, `better-colors`, `better-motion`, `better-accessibility`, `better-writing`, `interface-review`) — interface precision.
6. **Emil Kowalski** (`emil-design-eng`, `review-animations`) — interaction and motion.
7. Taste Skill and UI/UX Pro Max principles — not installed (see section 6); use only the ideas quoted in section 4.

## 2. Approved decisions — do not change without the owner's explicit approval

- **The dark matte look.** Obsidian (dark) is the default theme; Platinum (light) is the alternative. Near-black matte surfaces, hairline borders, the workstation tokens (`d-*` in `globals.css`). Never restyle toward cream, paper or a light default. (A cream redesign was proposed and rejected on 27 Nov 2026.)
- **Gold and the hexagon.** The gold hexagon mark is the brand's centre; gold is the tenant accent (`--tenant-accent`), never hard-coded.
- **Module colours.** Each firm workspace keeps its own colour (`FIRM.<module>` in `src/lib/firm-colors.ts`) on its hexagon and active state.
- **The hub.** Hovering the mark opens the six solutions with the six workspaces around them. That is the deepest the hub goes: a click on any hexagon opens its page. No further rings on hover or dwell.
- **Hexa Room sidebar.** Structure, names and behaviour as published. Clicking a row opens or folds its pages. Solutions use the bespoke marks in `src/components/shell/SolutionIcons.tsx` (20 × 20 grid, 1.5px square strokes, `currentColor`; secondary text colour inactive, primary active). Workspaces use their coloured hexagons.
- **Fonts as shipped.** Do not swap typefaces as a side effect of other work.
- **PMO runs on project plans only**; reports print on US Letter landscape.
- **Corporate Chat is one store shared with the portals**; internal notes never reach a portal.
- **Wording and data.** English only. Never the literal "Aurum" in client-facing text (use `useBrand()`, `<TenantName />`). Never invent figures: unknown is "n/a", illustrative data is labelled.

A refinement keeps all of this and changes only what was asked. If a third-party skill pushes against any line above (Impeccable's ban on small labels above headings, a "pick light or dark by use scene" rule, a palette or font recommendation), follow this section and mention the conflict instead of acting on it.

## 3. Approval gates

- Visual changes beyond a bug fix: show before/after screenshots of the real screen, in both themes, and wait for the owner's yes before pushing.
- Never present a redesign as a fait accompli. Never ship on `main` what the owner has not seen.
- Bug fixes, data fixes and changes the owner asked for in specific terms can be pushed after the checks in section 5.

## 4. Craft rules distilled from the installed skills

**Surfaces and hierarchy** (Impeccable Operate mode, Krehel `better-ui`)
- Hierarchy comes from type weight, spacing and alignment before colour or boxes. One primary action per view.
- Nest radii: an inner radius equals the outer radius minus the padding between them.
- Hover is a quiet change of surface (`bg-d-raise`), never a hard-coded light colour that breaks the dark theme.
- Icons take `currentColor`; align them optically to the cap height of the text beside them, not to the box.

**Numbers and tables**
- Tabular numerals for every figure that lines up; amounts right-aligned; currency once per group; the valuation or as-of date in the header or a note.
- Totals across currencies need a stated basis; default to per-currency.
- Counts say what they count ("18 investors, 22 commitments").

**Typography** (Krehel `better-typography`)
- Use the existing scale; avoid one-off sizes. Sentence case for labels and buttons. `text-wrap: balance` on headings, `pretty` on paragraphs. Truncate with a tooltip or full text on hover, never silently.

**Colour and contrast** (Krehel `better-colors`, `better-accessibility`)
- Text 4.5:1, large text and icons 3:1, in Obsidian and Platinum and for tenant brands. Status always pairs colour with a word or icon.

**Motion** (Kowalski `emil-design-eng`, Krehel `better-motion`)
- Animate only to explain a change the user caused: a drawer opening, a row folding, a value updating. Nothing moves on its own except the hub's established ambience.
- Durations 150–250ms for UI, ease-out curves for entering, never `ease-in` for something the user triggered; animate `transform` and `opacity`, never `all`.
- Popovers scale from their trigger; modals stay centred. Buttons may press to `scale(0.97)`.
- No animation on actions repeated many times a minute (keyboard navigation, typing, frequent toggles).
- Respect `prefers-reduced-motion` and the per-user motion setting.

**Copy** (Krehel `better-writing`)
- Buttons say what happens ("Issue the notice"); errors say what went wrong and what to do; empty states invite the next action.

**Originality** (ideas from Taste Skill and Impeccable)
- Avoid what reads as generated: rows of identical stat tiles, identical rounded cards with soft shadows, gradient text, glowing borders, decorative badges, an icon beside every title, arrows after link text, oversized type, motion without purpose. Fix these only inside the approved look, and only with approval when the change is visible.

## 5. Visual check — before presenting any interface

Never say a screen is checked unless it was rendered and looked at.

1. Run the app (`npx next dev -p 3000`) and render the real page with Playwright (`/opt/npm-tools/node_modules/playwright/index.mjs` in Claude's environment) or the browser tools.
2. Capture 1440 (desktop), 1024 (tablet) and 390 (phone).
3. Both themes: set `localStorage["aurum-theme-v1"]` to `"dark"` and `"light"` before load.
4. Look at typography, spacing and alignment; zoom on dense areas.
5. Exercise interactive states: hover, focus, active, open, empty, error, long text.
6. Check motion timing and reduced motion.
7. Check contrast on the changed elements (text 4.5:1, icons 3:1) and for one non-Aurum tenant brand.
8. Look for the generic patterns listed in section 4.
9. Compare with the approved decisions in section 2.
10. Fix what the look shows, look again, then present with the screenshots.

Then `npx tsc --noEmit -p .`, `npx eslint src`, `npx next build`, as `CLAUDE.md` requires.

## 6. About the installed third-party skills

- Vendored copies with their licences in each folder (`LICENSE`, `SOURCE.md`); keep the notices if files are moved.
- **Impeccable**: written guidance only. Its `scripts/` launcher (which downloads and runs a compiled engine), live-browser mode, generate mode and detector hooks are not installed. Skip any step that calls `scripts/impeccable`; read the references directly.
- **Not installed**: Taste Skill (written for marketing websites; adds a Stop hook that runs a Node script and mandates photographs, hero animations and hover lifts that do not fit an operations platform), UI/UX Pro Max (generic palettes and font pairings that compete with the brand), and the component libraries (shadcn/ui, Base UI, Magic UI, React Bits, Motion Primitives, Tremor). Study a library's technique when it helps, rebuild it with Aurum tokens, and add no dependency without the owner's approval.
