# Architectural Matte — Direction D visual refinement (prototype)

Status: **prototype on the Investors page only, on the `redesign` branch. Awaiting owner approval before it is applied
across the platform.** Nothing outside `/admin/fund/investors` changes: every rule is scoped to `.ws[data-finish]`,
and only the Investors page sets `data-finish`.

## How to compare
Open `/admin/fund/investors` on the Vercel preview. A small "Finish preview" control at the bottom switches
A · Pure matte, B · Architectural (default), C · Atmospheric. `?finish=pure|arch|atmos` also works. Switch
Obsidian / Platinum from the account menu as usual. The choice is remembered in this browser only.

## Design decisions
- **Tonal layers before borders.** Canvas, navigation, panel, raised and inset surfaces are separate tones; panels
  carry a 1 px inset hairline at 70% of the line colour instead of a border and shadow. Corners 6 px (4 px on controls).
- **Obsidian, matte graphite** — canvas #14191F, navigation #11161C, panel #1A2027, inset #171C23, raised #232A32,
  text #E6E8EB / #AAB3BD / #8A949F. Derived from the brief's starting values; the panel was lowered slightly so
  panels sit in the canvas rather than on it.
- **Platinum, porcelain and warm stone** — canvas #E9E6E0, panel #F4F2EE (not white), inset #EEEBE6, raised #E6E2DC,
  text #191D22 / #4D535B / #5C6168.
- **The light** is a tenant-accent derivative: `color-mix(tenant accent 38%, warm neutral)` on Obsidian,
  16% into a porcelain white on Platinum — Aurum's yellow reads as muted champagne, and any tenant's accent works.
  One very large elliptical gradient behind the upper centre, six stacked stops (no visible ring), dithered with
  a static SVG grain at 3–3.5% so it does not band; the grain also gives the surfaces their matte tooth.
  Intensity: A 0, B 0.20, C 0.32 (Platinum 0, 0.8, 1.0 because light on light needs more). Halved on mobile.
- **Panels catch the light**: a 140 px top sheen derived from the same light colour (none in A).
- **Header and search sit on the canvas**: header transparent, search a tonal fill with a hairline on hover/focus;
  Hexa Room a translucent tone with a faint hairline. Navigation behaviour unchanged.
- **Investors register**: the outlined vehicle cards became one continuous register — a column header shared by
  every vehicle row (investors, commitments, called with a 3 px meter, NAV), tonal hover, the open vehicle's
  investors in an inset tone with hairline rows. Same filters, search, groupings, expand/collapse, totals, figures.
- **Typography**: page title 30 px at weight 560 (less heavy than 600–700), tabular lining numerals throughout.
- **Motion (C only)**: a 48 s ease-in-out drift of the light (transform only). Off when the Brand Studio ambient
  motion is "Off", when the user's motion preference is off, or with prefers-reduced-motion. No filters, blur or
  shadows are animated.

## Accessibility (WCAG 2.1 contrast, computed)
| Text | Obsidian (on canvas / panel / inset / raised) | Platinum |
|---|---|---|
| Primary | 14.4 / 13.4 / 13.9 / 11.8 | 13.6 / 15.1 / 14.2 / 13.1 |
| Secondary | 8.3 / 7.7 / 8.1 / 6.8 | 6.2 / 7.0 / 6.5 / 6.0 |
| Tertiary (labels) | 5.7 / 5.3 / 5.6 / 4.7 | 5.0 / 5.6 / 5.3 / 4.8 |
All pass AA for normal text (4.5:1). Tertiary on the brightest point of the light: 4.7 (Obsidian), 5.2 (Platinum).
Platinum tertiary was darkened from the first proposal (#686D74 failed at 4.0–4.2).
Keyboard focus, the switcher (radiogroup with aria-checked) and expanded state (aria-expanded) are preserved.

## Performance
One fixed pseudo-element with a static gradient and one with a static grain image; no per-frame work except the
optional C drift (transform on a composited layer). No new dependencies or libraries.

## Files
- `src/app/globals.css` — finish tokens, light layer, grain, surface integration, register rules (end of file)
- `src/components/shell/FinishScope.tsx` — new: workstation root, applies the finish on prototype pages, switcher
- `src/components/shell/AppShell.tsx` — uses FinishScope (same markup as before when no finish is set)
- `src/components/shell/WorkstationTopBar.tsx`, `HexaRoom.tsx` — `data-shell` hooks only
- `src/components/ui.tsx` — `data-panel` / `data-page-header` hooks only
- `src/components/fund/InvestorsView.tsx` — continuous register

## Limitations
- The expanded investor table still scrolls horizontally below ~1400 px with the Hexa Room open (10 columns kept).
- Legacy components elsewhere use 8–16 px radii and white cards; they change only when the finish is rolled out.
- The light is tuned for the Aurum accent and Northbridge's gold; very dark tenant accents give almost no light
  (by design — it falls back to Pure matte rather than a muddy glow).
