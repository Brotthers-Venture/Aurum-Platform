# Google Stitch

Stitch generates interface designs; this folder connects it to the Aurum Platform so new screens start
from Stitch and are then rebuilt as platform components (with white-label colours, not hard-coded ones).

## One-time setup (on your computer)
1. In Stitch, open **Settings → API keys** and create a key.
2. Save it outside the repo: `mkdir -p ~/.config/stitch && pbpaste > ~/.config/stitch/api-key`
   (or `export STITCH_API_KEY=…`). Never commit it.
3. `npm install`, then `npm run stitch -- setup "Aurum Platform"` — creates the Stitch project with the
   Aurum design system from `design.md` and records its id in `project.json`.

## Use
- `npm run stitch -- generate "Capital call detail page for an LP portal"`
- `npm run stitch -- variants <screenId> "Calmer, denser table" --n 3 --range REFINE`
- `npm run stitch -- pull` → HTML and images in `design/stitch/` (ignored by git)

## Claude
`.mcp.json` registers Stitch as an MCP server, so Claude Code opened in this repo — or Claude Desktop
with the same entry — can create, edit and download Stitch screens directly.
