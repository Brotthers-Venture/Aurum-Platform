#!/usr/bin/env node
/**
 * Screenshots of the built Direction D modules for owner review (design/stitch/direction-d/modules/, git-ignored).
 * Needs the app running: npx next build && npx next start -p 3100.
 *   node --experimental-strip-types --no-warnings --import ./tools/stitch/ts-loader.mjs tools/stitch/shoot-modules.mjs [base]
 *   ONLY=chat-inbox node … to render one shot.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(join(root, "package.json"));
const { chromium } = require("playwright-core");
const B = await import(pathToFileURL(join(root, "src/lib/brand.ts")).href);
const base = process.argv[2] ?? "http://localhost:3100";
const OUT = join(root, "design", "stitch", "direction-d", "modules");
mkdirSync(OUT, { recursive: true });

const preset = (id) => B.serialiseBrand(B.PRESETS.find((p) => p.id === id));
const CHAT = "/admin/communication";

/** [name, path, width, { theme, brand, act }] — act runs in the page before the screenshot. */
const SHOTS = [
  ["chat-inbox-obsidian-1920", CHAT + "?m=mt-cc7", 1920, { act: async (p) => (await p.getByRole("button", { name: /^Inbox/ }).first().click(), await p.locator("[role=list] button").first().click()) }],
  ["chat-matter-obsidian-1920", CHAT + "?m=mt-cc7", 1920, {}],
  ["chat-matter-platinum-1920", CHAT + "?m=mt-cc7", 1920, { theme: "light" }],
  ["chat-command-menu", CHAT + "?m=mt-cc7", 1440, { act: async (p) => (await p.keyboard.press("Control+k"), await p.keyboard.type("call", { delay: 30 })) }],
  ["chat-mobile-390", CHAT + "?m=mt-cc7", 390, {}],
  ["chat-mobile-390-list", CHAT, 390, {}],
  ["chat-approval-obsidian-1440", CHAT + "?m=mt-cc2", 1440, {}],
  ["chat-four-eyes-platinum-1440", CHAT + "?m=mt-cc3", 1440, { theme: "light" }],
  ["chat-thread-obsidian-1440", CHAT + "?m=mt-cc7", 1440, { act: async (p) => await p.getByRole("button", { name: /2 replies/ }).first().click() }],
  ["chat-slash-commands-1440", CHAT + "?m=mt-pln1", 1440, { act: async (p) => (await p.locator("#chat-composer").click(), await p.keyboard.type("/", { delay: 30 })) }],
  ["chat-channel-external-1440", CHAT + "?m=mt-cc7", 1440, { act: async (p) => await p.getByRole("button", { name: /client-cordillera/ }).click() }],
  ["chat-shortcuts-1440", CHAT + "?m=mt-cc7", 1440, { act: async (p) => (await p.locator("body").click({ position: { x: 5, y: 300 } }), await p.keyboard.press("?")) }],
  ["chat-change-request-1440", CHAT + "?m=mt-bnk5", 1440, {}],
  ["chat-wire-request-channel-1440", CHAT, 1440, { act: async (p) => await p.getByRole("button", { name: /client-cordillera/ }).click() }],
  ["chat-mobile-390-expanded", CHAT + "?m=mt-cc7", 390, { act: async (p) => await p.getByRole("button", { name: /Awaiting client ·/ }).click() }],
  ["chat-matter-obsidian-1280", CHAT + "?m=mt-bnk4", 1280, {}],
  ["chat-northbridge-1920", CHAT + "?m=mt-cc7", 1920, { brand: "northbridge", theme: "light" }],
  ["chat-northbridge-obsidian-1920", CHAT + "?m=mt-cc7", 1920, { brand: "northbridge" }],
  ["chat-halcyon-1920", CHAT + "?m=mt-cc7", 1920, { brand: "halcyon", theme: "light" }],
  ["brand-module-names-1440", "/admin/brand", 1440, { theme: "light", act: async (p) => await p.getByRole("heading", { name: "Module names" }).scrollIntoViewIfNeeded() }],
];

const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ channel: "chrome" });
for (const [name, path, width, o] of SHOTS) {
  if (only && !only.some((x) => name.includes(x))) continue;
  const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : width >= 1920 ? 1080 : 900 }, deviceScaleFactor: width < 800 ? 2 : 1.5 });
  await ctx.addInitScript(
    ([theme, brand]) => {
      try {
        if (sessionStorage.getItem("seeded")) return;
        sessionStorage.setItem("seeded", "1");
        localStorage.clear();
        localStorage.setItem("aurum-theme-v1", theme);
        if (brand) localStorage.setItem("aurum-tenant-brand", brand);
      } catch {}
    },
    [o.theme ?? "dark", o.brand ? preset(o.brand) : null],
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + path, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (o.act) await o.act(page);
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: join(OUT, name + ".png") });
  console.log("shot", name, overflow > 0 ? `OVERFLOW ${overflow}px` : "", errors.length ? "ERRORS " + errors.join(" | ") : "");
  await ctx.close();
}
await browser.close();
