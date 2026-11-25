# Redesign — Phase 2: three directions

Date: 2026-11-25 · Stitch project `11182280680944937938` · Images in `design/stitch/directions/` (git-ignored).
The owner's decisions from 2026-11-25 apply to every direction:
- The honeycomb is retired. The home screen becomes an operational home plus an app switcher.
- Sponsor branding is a layer on top of the tenant brand.
- One chart library.
- One direction is a refined evolution of the cream look.

The same demo data was used for all three. Each direction has three screens:
- **Home:** the operational home that replaces the hub.
- **Capital calls:** a dense financial table.
- **Investor portal:** the Strlex Capital sponsor layer on the Calloway Family Trust account.

| | Design system | Home | Capital calls | Investor portal |
|---|---|---|---|---|
| **A · Obsidian sidebar** | `assets/7406439768140397741` | `5376946f8cfd4828ad2e37ff0ebdfd17` | `2a4d6d9144974497b5f1f6406a661530` | `2e18839acc7d46bc866afb1c9e697648` |
| **B · Platinum ledger** | `assets/8658933991532504272` | `0929ebab18254ff79eafb53c62eac92d` | `9dc455ae29ac491c901bcf41df07d7ba` | `d8e985ec3c0842ea8e5d1662c85adf2f` |
| **C · Ivory refined** | `assets/8852985485727741120` | `0ed69968446445918c97816aa90f2ed3` | `868f2de910d64b0b9689721cc44cdcb2` | `ece6a5d50f204966b3b2d33c9abc9ca5` |

The 14 reference screenshots of today's app were also uploaded to the same project.

## A · Obsidian sidebar
**Look:**
- A deep-navy sidebar (#0B1420) with a white/platinum workspace.
- Inter.
- Gold appears only as a 2px active bar and in the logo.

**Strengths:**
- It has the strongest identity and authority.
- The white logo and a gold indicator on navy pass contrast easily.
- The sidebar is the obvious place for the sponsor's colour in portals: in the Strlex portal it simply became #191E31. White label falls out naturally.
- The home screen's layout (approvals, due dates, alerts, tasks, then the application strip) is the clearest of the three.

**Weaknesses:**
- A dark sidebar on a white workspace is a common fintech pattern, so it needs our details (type, rules, the emblem) to feel proprietary.
- The capital-calls table overflowed: the Funded and Status columns were cut off.
- Money was rendered in a monospace font.

## B · Platinum ledger
**Look:**
- Fully light.
- Geist.
- An application switcher in the top bar.
- A light sidebar with a small gold square marker.

**Strengths:**
- The densest and most "terminal" of the three.
- The home is a single **work queue** with tabs (All · Approvals · Due · Exceptions · Tasks), which is the most efficient model for operators.
- The capital-calls **detail drawer** shows the collection rate, unmatched wire, LP allocation, and actions, and is the best interaction idea in the set.
- The portal's top-nav layout is clean and familiar to LPs.

**Weaknesses:**
- It has the least brand. It could be anyone's product.
- Monospace numbers again.
- The drawer squeezes the table instead of overlaying it.
- Stitch invented a footer ("Core Engine v4.2", "Audit trail verified").

## C · Ivory refined (evolution of today)
**Look:**
- Ivory canvas (#FAF8F4) instead of beige.
- A flush warm sidebar with a gold left rule instead of the floating card with a champagne block.
- A Source Serif title and Hanken Grotesk for interface text.
- Hairline white panels.

**Strengths:**
- Continuity with the current product and the existing white-label presets.
- The warmest and most "private bank" of the three.
- The serif title gives the portal a sense of occasion.

**Weaknesses:**
- It is the least dense: the dates in the capital-calls table wrapped onto three lines.
- Panels on a tinted canvas still read as cards.
- Every heading in serif risks feeling like an editorial template rather than infrastructure.
- Monospace numbers again in the portal.

## Problems shared by all three (not carried into the build)
- Stitch added figures and details that are not in our demo data:
  - "+14.2% vs 2025"
  - "Master Account #CF-0921-USD"
  - phone numbers
  - LP allocations in the B drawer
  - "Vault sync active"
- The build uses only `src/lib/*` data.
- Numbers must be tabular figures in the interface sans, never monospace.
- Wide tables need horizontal scroll with a pinned first column, never clipping.

## Recommendation
**A as the base, with two ideas from B and one from C:**
1. **A's shell and identity:**
   - A navy sidebar that takes the tenant ink colour, and the sponsor colour inside portals.
   - A white workspace and the gold indicator.
   - A's home layout.
2. **From B:**
   - The tabbed **work queue** model inside the home's approvals area (All / Approvals / Due / Exceptions / Tasks).
   - The **detail drawer** pattern for records (as an overlay on narrow screens).
3. **From C:** the serif only for editorial moments: sign-in, `/incorporate`, the data-room gate, the portal account title and reports. This matches brief §6.

Why A:
- It gives the platform the most recognisable identity.
- It keeps gold on navy, the one place where gold is legible.
- It makes white label a matter of one colour: the sidebar.
- It works for both the firm console and sponsor portals.

The open choice for the owner is whether the investor portal should use A's sidebar or B's top navigation. Top navigation is lighter for LPs, who visit rarely and have few pages. My view: use **top navigation for LP portals** and the sidebar for GP portals and the firm console.
