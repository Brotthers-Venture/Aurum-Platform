#!/usr/bin/env node
/**
 * Google Stitch for the Aurum Platform.
 *
 *   npm run stitch -- setup "Aurum Platform"         create the Stitch project + Aurum design system
 *   npm run stitch -- generate "Investor statement page" [--device DESKTOP] [--model GEMINI_3_PRO]
 *   npm run stitch -- edit <screenId> "Make the table denser"
 *   npm run stitch -- variants <screenId> "Try calmer layouts" [--n 3] [--range REFINE|EXPLORE|REIMAGINE]
 *   npm run stitch -- upload design/audit/hub-1440.png [more files…]   add screenshots as reference screens
 *   npm run stitch -- list
 *   npm run stitch -- pull                            download every screen (HTML + assets) to design/stitch/
 *
 * The API key is read from STITCH_API_KEY or ~/.config/stitch/api-key — never from the repo.
 * Create one in Stitch → Settings → API keys.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Stitch, StitchToolClient } from "@google/stitch-sdk";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const CONFIG = join(here, "project.json");
const OUT = join(root, "design", "stitch");

function apiKey() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY.trim();
  const f = join(homedir(), ".config", "stitch", "api-key");
  if (existsSync(f)) return readFileSync(f, "utf8").trim();
  console.error("No Stitch API key. Create one in Stitch → Settings → API keys, then either\n  export STITCH_API_KEY=…\nor save it to ~/.config/stitch/api-key");
  process.exit(1);
}
const sdk = () => new Stitch(new StitchToolClient({ apiKey: apiKey(), timeout: 300_000 }));
const config = () => (existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf8")) : {});
const projectId = () => config().projectId ?? (console.error('Run `npm run stitch -- setup "Aurum Platform"` first.'), process.exit(1));
const flag = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const designMd = readFileSync(join(here, "design.md"), "utf8");
/** Every prompt carries the house rules, so screens come back on-brand. */
const brief = (p) => `${p}\n\nFollow the Aurum design system strictly: warm cream canvas, navy ink text, serif headlines (Source Serif 4), Hanken Grotesk interface text, gold used sparingly, hairline borders, dense institutional data layouts, English only, no decorative illustrations.`;
const show = (s) => console.log(`screen ${s.id}`);

const [cmd, ...rest] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !(all[i - 1] ?? "").startsWith("--"));

switch (cmd) {
  case "setup": {
    const s = sdk();
    const project = await s.createProject(rest[0] ?? "Aurum Platform");
    const ds = await project.createDesignSystem({
      displayName: "Aurum",
      theme: {
        colorMode: "LIGHT",
        headlineFont: "SOURCE_SERIF_FOUR",
        bodyFont: "HANKEN_GROTESK",
        labelFont: "HANKEN_GROTESK",
        roundness: "ROUND_EIGHT",
        customColor: "#0F2340",
        overridePrimaryColor: "#0F2340",
        overrideSecondaryColor: "#B8975A",
        overrideTertiaryColor: "#F8C618",
        overrideNeutralColor: "#78716C",
        colorVariant: "NEUTRAL",
        designMd,
      },
    });
    writeFileSync(CONFIG, JSON.stringify({ projectId: project.id, designSystemId: ds.id }, null, 2) + "\n");
    console.log(`Stitch project ${project.id} with the Aurum design system ${ds.id}. Saved to tools/stitch/project.json.`);
    break;
  }
  case "generate": {
    const screen = await sdk().project(projectId()).generate(brief(rest.join(" ")), flag("device", "DESKTOP"), flag("model", "GEMINI_3_PRO"));
    show(screen);
    console.log("html  ", await screen.getHtml());
    console.log("image ", await screen.getImage());
    break;
  }
  case "edit": {
    const [id, ...p] = rest;
    const screen = await sdk().project(projectId()).screen(id).edit(brief(p.join(" ")), flag("device", "DESKTOP"), flag("model", "GEMINI_3_PRO"));
    show(screen);
    console.log("image ", await screen.getImage());
    break;
  }
  case "variants": {
    const [id, ...p] = rest;
    const list = await sdk()
      .project(projectId())
      .screen(id)
      .variants(brief(p.join(" ")), { variantCount: Number(flag("n", "3")), creativeRange: flag("range", "EXPLORE") }, flag("device", "DESKTOP"), flag("model", "GEMINI_3_PRO"));
    for (const v of list) {
      show(v);
      console.log("image ", await v.getImage());
    }
    break;
  }
  case "upload": {
    // Upload screenshots (png/jpg/webp) or HTML as reference screens: upload <file> [<file>…]
    const project = sdk().project(projectId());
    for (const f of rest) {
      const screens = await project.upload(f, { title: f.split(/[\\/]/).pop().replace(/\.\w+$/, "") });
      for (const s of screens) console.log(`screen ${s.id}  ${f}`);
    }
    break;
  }
  case "list": {
    for (const s of await sdk().project(projectId()).screens()) console.log(s.id, s.data?.title ?? "");
    break;
  }
  case "pull": {
    mkdirSync(OUT, { recursive: true });
    const res = await sdk().project(projectId()).downloadAssets(OUT);
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
}
