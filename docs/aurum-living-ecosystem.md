# Aurum Living Ecosystem
### Signature Experience — Design & Implementation Brief

## 1. Objective

Elevate the existing Aurum ecosystem landing page into a memorable, beautiful, distinctive and living digital experience.

The existing hexagonal architecture is approved. Do not abandon it, replace it with a conventional dashboard, application grid or generic SaaS interface.

The hexagonal ecosystem is intended to become a recognizable design signature of the Aurum platform.

The objective is to refine its atmosphere, geometry, motion, typography, interaction quality and visual sophistication to an exceptional institutional standard.

The experience should combine Apple's attention to motion and interaction design, the sophistication of a global private bank and the precision of a professional financial workstation.

The landing page should feel alive, intelligent and connected without becoming distracting.

## 2. Creative philosophy

Design around the concept of a living financial ecosystem.

The central symbol represents the heart of the platform. The surrounding applications represent interconnected capabilities operating within the same ecosystem.

The experience must communicate:

- Institutional sophistication.
- Quiet confidence.
- Architectural precision.
- Intelligence and connectivity.
- Technological innovation.
- Exclusivity without unnecessary ornamentation.
- A sense of life without visual distraction.

Avoid gaming aesthetics, cryptocurrency marketing aesthetics, excessive futuristic effects, neon illumination, generic AI-generated design language and conventional administrative templates.

The result should feel custom-designed for Aurum rather than assembled from an existing UI library.

## 3. Living background — ambient breathing

Introduce a sophisticated and extremely subtle ambient background animation.

Create a broad, diffused illumination originating behind the central ecosystem symbol.

The illumination should slowly breathe:

- One complete cycle approximately every 10–14 seconds.
- Smooth expansion and contraction.
- Gradual changes in opacity.
- No abrupt transitions.
- No flashing.
- No visible circular boundary.
- No aggressive neon glow.
- No visible gradient banding.

The illumination must resemble soft, edgeless environmental light, not a colored blob placed behind the logo.

The animation should feel organic and almost imperceptible, as though the ecosystem has a quiet heartbeat.

Use the supplied Platinum glow reference as the atmospheric target for both themes.

For Platinum, create warm champagne illumination against a refined platinum or ivory surface.

For Obsidian, create restrained golden illumination against a deep navy-black surface.

Do not reproduce the particle or sparkle field from the Obsidian reference.

The background must remain visually exceptional even when all animations are disabled.

## 4. Architectural background

Preserve the concept of a geometric background while refining the existing dotted pattern.

Explore an extremely fine architectural grid or subtle hexagonal lattice that gradually disappears toward the edges of the viewport.

The pattern should create spatial depth and reinforce Aurum's geometric identity.

It should never compete with the application icons, labels or central symbol.

In the Architectural variation, explore a very restrained illumination of existing lattice elements near the center.

Do not introduce:

- Floating particles.
- Decorative sparkles.
- Stars.
- Random moving dots.
- Visible digital noise.
- Sci-fi network graphics.
- Excessive animated elements.

On mobile, hide the lattice entirely and reduce the intensity of the ambient illumination.

## 5. Central ecosystem symbol

Preserve the exact official Aurum symbol for the default tenant, including its proportions, geometry and brand identity.

The symbol must be sourced from the existing AurumMark component and brand settings.

Do not redraw, approximate or distort the official mark.

The central symbol should feel like the architectural and visual anchor of the entire experience.

Introduce:

- A subtle ambient halo behind the symbol.
- Restrained illumination synchronized with the background breathing cycle.
- A refined hover response.
- A small and smooth scale transition upon interaction.
- A precise expansion into the existing six-module hexagonal architecture.

The symbol itself should remain sharp and visually authoritative.

Do not continuously rotate, bounce, deform or animate the geometry of the mark.

The motion should occur primarily around the symbol rather than compromising the symbol itself.

## 6. Geometric precision and application orbit

Preserve the existing hexagonal navigation architecture and the current application hierarchy.

The surrounding application icons must follow mathematically consistent positioning.

Use a shared geometric system for:

- Hexagon proportions.
- Vertex orientation.
- Stroke thickness.
- Orbit radius.
- Angular spacing.
- Expanded hexagon dimensions.
- Gaps between adjacent hexagons.
- Notification badge positioning.
- Label alignment.

All surrounding application icons should be positioned at consistent angular intervals around the center.

Avoid individually positioned elements that create subtle visual asymmetries.

Preserve the existing application identities, colors, functionality, routing and notification counts.

Refine their visual treatment through sophisticated surface layering, precise geometry, restrained shadows and carefully balanced typography.

Application colors should remain recognizable without becoming overly saturated or visually competitive.

On hover or keyboard focus, the application should subtly illuminate in its own semantic accent color and reveal its name where appropriate.

Application identity must not depend on color alone.

Notification badges must represent existing application data. Do not invent counts or continuously animate badges.

## 7. Expanded application experience

Preserve the existing hexagonal expansion behavior.

When the user selects an application:

- The central symbol transitions smoothly to the selected application's identity.
- The surrounding module hexagons emerge in mathematically correct positions.
- Labels and contextual information appear with a restrained staggered fade.
- The background illumination gently adapts to the selected application's accent.
- Navigation remains immediately available.

The animation should feel like a single coordinated transformation rather than a collection of unrelated effects.

Target approximately 300–500 ms for interactive transitions.

Use consistent easing and motion tokens across all applications.

Expanded hexagons should have refined surface treatment, clear typography and subtle depth.

Preserve existing module names and functionality, with one approved exception: rename Chat Room to Corporate Chat, following docs/direction-d-modules.md, section 3.

Do not rename other applications or modules without approval.

Coming-soon modules must remain visually distinguishable from active modules without introducing excessive visual noise.

## 8. Signature energy transmission

Explore a distinctive Aurum micro-interaction exclusively within the Pulse variation.

At occasional intervals, a very faint illumination may travel outward from the central symbol toward one of the surrounding applications.

This should communicate the concept of connectivity rather than serve as decoration.

The effect must be:

- Slow and restrained.
- Geometrically precise.
- Infrequent.
- Almost imperceptible during normal use.
- Consistent with the tenant's brand accent.

Allow at most one transmission every 20–40 seconds.

Never trigger energy transmission while the user is hovering, navigating, typing in search, interacting with a menu or using keyboard navigation.

Do not queue missed transmissions or replay them immediately after interaction.

Do not introduce persistent animated connection lines.

The ecosystem must never resemble a blockchain marketing website or a gaming interface.

## 9. First arrival experience

When the user first enters the ecosystem during a browser session, create a brief and refined entrance sequence:

1. The ambient background illumination gradually appears.
2. The central symbol fades into view.
3. The surrounding application icons emerge in a coordinated sequence.
4. The interface settles into its ambient breathing state.

The complete sequence should take approximately 700–1,000 ms.

It must not block interaction or introduce artificial loading time.

Play the entrance sequence only once per browser session using sessionStorage.

Do not replay the complete entrance animation when returning from another application during the same session.

If sessionStorage is unavailable, fail gracefully without blocking the interface.

Do not play the entrance sequence when reduced motion or the Off setting is enabled.

## 10. Intelligent motion behavior

The ecosystem should feel responsive to the user's presence.

When the user is idle, the ambient breathing animation may operate normally.

When the user begins interacting with the ecosystem, the interface should become visually quieter.

During application expansion, menu interaction, search or navigation:

- Suppress decorative energy transmissions.
- Avoid competing animations.
- Prioritize clarity and responsiveness.
- Preserve immediate access to all functionality.

Pause unnecessary animations when the browser tab is not visible.

Resume gracefully without abrupt changes in illumination.

Motion should enhance the user's understanding of the interface, not demand their attention.

## 11. Platinum and Obsidian

Both themes must receive equal design attention.

### Platinum

A contemporary private banking environment.

- Refined warm platinum or ivory surfaces.
- Soft champagne illumination.
- Subtle architectural depth.
- Precise navy typography.
- Restrained use of gold.
- Sophisticated surface transitions.

Platinum must not feel like a conventional white administrative interface.

### Obsidian

A premium financial command center.

- Deep navy-black surfaces.
- Restrained golden illumination.
- Subtle tonal layering.
- Cinematic depth without dramatic effects.
- High-quality contrast and legibility.

Obsidian must not feel like a gaming interface or a cryptocurrency terminal.

Preserve the official Aurum gold values for the default tenant:

- Platinum: #F8C618
- Obsidian: #FFCA00

Use an accessible darker accent derivative where necessary for text on light surfaces.

All colors must come from the existing semantic theme and brand architecture.

Do not hardcode theme colors into individual components.

## 12. White-label architecture

The Aurum symbol and gold illumination represent the default tenant experience only.

The central symbol must come from AurumMark and the existing brand settings.

Ambient illumination must use transparent derivatives of var(--tenant-accent).

A white-label tenant must see its own configured mark, accent color and brand identity.

Preserve the hexagonal navigation architecture for every tenant.

Do not force Aurum gold or the Aurum symbol onto a white-label tenant.

If a tenant's logo has different proportions, contain it within the central composition without distorting it.

Verify that tenant accents remain legible and visually refined in both Platinum and Obsidian.

Use the existing Northbridge preset to demonstrate that the ecosystem is genuinely white-label rather than merely recolored.

Do not create a separate implementation for each tenant.

## 13. Brand & white label studio

Add a new configuration setting:

**Ambient motion**

Available options:

- Off
- Ambient
- Architectural
- Pulse

The tenant administrator should be able to configure the default experience.

The final default will be the variation I approve after reviewing the prototypes.

Individual users should also have the ability to disable ambient motion for their own experience without modifying the tenant-wide setting.

The operating system's prefers-reduced-motion preference must take precedence over decorative animation settings.

The Off setting must preserve the refined static illumination and architectural composition while disabling ambient animation.

Persist preferences through the existing brand and user preference architecture where supported.

Do not introduce a parallel settings system.

## 14. Header refinement

Preserve the existing minimalist header, official brand logo, global search, application switcher and account controls.

Refine the search bar and header surfaces to integrate naturally with the ambient background.

The header should remain visually secondary to the ecosystem.

Maintain the approved navigation and account-menu conventions.

Do not introduce:

- Promotional slogans.
- Unnecessary welcome messages.
- Additional decorative buttons.
- Dashboard metrics on the landing page.
- Permanent animation controls in the main composition.

The landing page is the gateway to the ecosystem, not another operational dashboard.

## 15. Responsive experience

The ecosystem must remain beautiful and functional across desktop, tablet and mobile.

### Desktop

Preserve the generous negative space and central composition.

The ecosystem should remain visually centered within the available viewport beneath the header.

Avoid unnecessary scrolling in the collapsed landing state.

### Tablet

Scale the ecosystem proportionally.

Preserve the mathematical relationships between the central symbol and surrounding applications.

### Mobile — 390 px

The entire application orbit must fit within the viewport without horizontal scrolling.

- Reduce ambient illumination.
- Hide the architectural lattice.
- Scale the hexagonal geometry proportionally.
- Preserve readable application labels.
- Preserve accessible touch targets.
- Ensure notification badges remain fully visible.
- Prevent collisions between application icons.
- Allow vertical scrolling in expanded states when necessary.

Do not replace the hexagonal experience with a generic mobile application grid.

If an expanded state cannot accommodate all labels at a readable size, adapt its spacing and vertical composition without abandoning the hexagonal design language.

## 16. Technical implementation

Inspect the existing implementation before making changes.

Reuse the existing components, geometry, application definitions, routing, theme tokens, brand settings and user preferences.

There is currently no animation library in the project. Do not introduce one.

Use:

- CSS keyframes.
- CSS transitions.
- SVG for precise geometric elements.
- Existing React components and state management.

Animate only opacity and transform.

Do not animate blur, filter, box-shadow, background-position or layout properties.

Static gradients and static surface effects are permitted where appropriate.

Use composited layers for ambient illumination and transform-based motion.

Avoid unnecessary WebGL, canvas rendering, heavy dependencies and continuous JavaScript animation loops.

Requirements:

- Smooth performance on desktop and mobile.
- Respect prefers-reduced-motion.
- Provide a static alternative.
- Pause unnecessary animations when the page is not visible.
- Preserve keyboard navigation.
- Preserve visible focus indicators.
- Maintain accessible contrast.
- Avoid layout shifts.
- Avoid unnecessary re-renders.
- Clean up timers and event listeners when components unmount.
- Prevent decorative layers from intercepting pointer events.
- Do not invent application data or notification counts.

Where the existing implementation differs from these assumptions, inspect it and report the discrepancy before making architectural changes.

## 17. Three interactive variations

Build all three variations as real, functional code on the existing ecosystem hub.

All variations must share the same application architecture, geometry, components, brand settings and navigation.

### A — Aurum Ambient

The most minimalist and institutional interpretation.

- Soft, breathing illumination.
- Refined surfaces.
- Subtle geometric background.
- Precise hover interactions.
- No energy transmission.

The experience should feel quietly alive.

### B — Aurum Architectural

A more geometric and architectural interpretation.

- Refined hexagonal lattice.
- Greater spatial depth.
- Precise geometric relationships.
- Restrained ambient illumination.
- Architectural surface treatment.

The experience should emphasize structure, order and precision.

### C — Aurum Pulse

A more expressive interpretation of the living ecosystem.

- Soft ambient breathing.
- Occasional energy transmission.
- Coordinated illumination.
- Refined application transitions.
- Intelligent suppression of decorative motion during interaction.

The experience should feel connected and intelligent without becoming futuristic or distracting.

All three variations must be available in Platinum and Obsidian.

Include the Off state for comparison.

## 18. Interactive prototype switcher

Add a temporary variation switcher inside the existing ⋮ menu on the ecosystem hub.

Options:

- Ambient
- Architectural
- Pulse

Allow me to switch between the three variations directly within the Vercel preview.

The switcher must work independently of the existing theme selection, allowing each variation to be evaluated in both Platinum and Obsidian.

Do not require a page reload to change variations.

The temporary preview switcher must not overwrite the tenant's permanent default configuration.

Remove the temporary switcher after I approve the final direction.

Retain the permanent Ambient motion setting in the Brand & white label studio.

## 19. Quality assurance and acceptance criteria

Before presenting the preview, verify:

- The existing hexagonal architecture remains intact.
- The official Aurum mark is preserved.
- The application orbit is geometrically consistent.
- All existing application routes continue to function.
- Application names and notification counts remain accurate.
- Platinum and Obsidian receive equal visual refinement.
- White-label branding works in both themes.
- The Northbridge preset correctly replaces the default tenant identity.
- Ambient motion can be disabled.
- Reduced-motion preferences are respected.
- The entrance sequence plays only once per browser session.
- Pulse transmissions never interrupt user interaction.
- No horizontal overflow occurs at 390 px.
- Keyboard navigation and focus states remain functional.
- Decorative layers do not interfere with interaction.
- No new animation libraries are installed.
- No third-party reference assets are committed.
- The approved Direction D operational workstations remain unaffected.

Review the actual motion in a browser, not only the static screenshots.

Document any limitations, unresolved issues or deviations from this brief.

## 20. Sequence, branch and scope

Start this assignment only after I approve the Corporate Chat screenshots.

Continue working on the existing redesign branch.

Never work directly on main.

This assignment applies only to:

- The ecosystem landing page.
- Expanded application navigation states.
- Supporting ambient motion components.
- Relevant Brand & white label settings.
- The temporary prototype variation switcher.

Do not redesign the approved Direction D operational workstations or Corporate Chat as part of this assignment.

Keep the third-party reference images excluded from Git under the existing design/references/ policy.

Do not reproduce the layouts, visual assets or proprietary design elements of third-party references.

## 21. Deliverables and approval

Once the Corporate Chat screenshots have been approved:

1. Inspect the existing ecosystem implementation.
2. Build the three interactive variations.
3. Implement the temporary preview switcher.
4. Verify both themes and responsive behavior.
5. Demonstrate white-label compatibility.
6. Run the existing relevant build, type-check, lint and test commands.
7. Commit and push the changes to the redesign branch.
8. Provide the Vercel preview URL.
9. Provide representative desktop and mobile screenshots.
10. Summarize the implementation, files changed and any known limitations.

Stop and wait for my approval.

Do not select the final variation on my behalf.

Do not merge into main or deploy to production.

After I approve a variation, configure it as the default, remove the temporary preview switcher and retain the permanent ambient motion preferences.

## 22. Final design standard

The objective is not to make the Aurum interface more decorative.

The objective is to make Aurum unmistakable.

The ecosystem should feel alive without looking animated, technologically advanced without looking futuristic, luxurious without looking ornamental, and institutional without looking generic.

Every visual and motion decision should contribute to that standard.

The landing page should become an experience that users recognize immediately, even without seeing the Aurum name.
## 23. Background research with 21st.dev (owner addition)

Use the 21st MCP to search for background patterns: grid or dot pattern with a radial fade, flickering grid, spotlight, hexagon pattern.
Avoid aurora, beams, meteors, sparkles, particles and shader gradients.
Show me 3–4 candidates before installing anything (free plan: 2 installs per day).
Check each component's licence. Rebuild the chosen idea in CSS/SVG with our tokens rather than adding framer-motion, canvas or WebGL (section 16 still applies).
