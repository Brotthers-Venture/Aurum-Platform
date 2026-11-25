#!/usr/bin/env node
/**
 * Screenshots of the ecosystem hub variations (design/stitch/direction-d/ecosystem/, git-ignored).
 *   node --experimental-strip-types --no-warnings --import ./tools/stitch/ts-loader.mjs tools/stitch/shoot-ecosystem.mjs [base]
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(join(root, "package.json"));
const { chromium } = require("playwright-core");
const B = await import(pathToFileURL(join(root, "src/lib/brand.ts")).href);
const base = process.argv[2] ?? "http://localhost:3200";
const OUT = join(root, "design", "stitch", "direction-d", "ecosystem");
mkdirSync(OUT, { recursive: true });
const preset = (id) => B.serialiseBrand(B.PRESETS.find((p) => p.id === id));

const hoverFund = async (p) => {
  await p.mouse.move(400, 300);
  await p.locator("svg[role=group] g[role=button]").first().hover();
  await p.waitForTimeout(900);
};
const openModule = async (p) => {
  await p.locator("g.orbit-mark").nth(2).click({ trial: true }).catch(() => {});
  await p.mouse.move(300, 300);
  const m = p.locator("g.orbit-mark").nth(2);
  await m.hover();
  await p.mouse.move((await m.boundingBox()).x + 30, (await m.boundingBox()).y + 30);
  await p.waitForTimeout(1200);
};

const SHOTS = [];
for (const v of ["ambient", "architectural", "pulse", "off"])
  for (const theme of ["dark", "light"]) SHOTS.push([`${v}-${theme === "dark" ? "obsidian" : "platinum"}-1440`, 1440, { v, theme }]);
SHOTS.push(
  ["ambient-obsidian-solutions-1440", 1440, { v: "ambient", theme: "dark", act: hoverFund }],
  ["ambient-platinum-solutions-1440", 1440, { v: "ambient", theme: "light", act: hoverFund }],
  ["architectural-obsidian-module-1440", 1440, { v: "architectural", theme: "dark", act: openModule }],
  ["architectural-obsidian-1920", 1920, { v: "architectural", theme: "dark" }],
  ["ambient-obsidian-tablet-1024", 1024, { v: "ambient", theme: "dark" }],
  ["ambient-obsidian-mobile-390", 390, { v: "ambient", theme: "dark" }],
  ["ambient-platinum-mobile-390", 390, { v: "ambient", theme: "light" }],
  ["ambient-mobile-390-solutions", 390, { v: "ambient", theme: "dark", act: async (p) => (await p.locator("svg[role=group] g[role=button]").first().tap(), await p.waitForTimeout(800)) }],
  ["northbridge-ambient-obsidian-1440", 1440, { v: "ambient", theme: "dark", brand: "northbridge" }],
  ["northbridge-architectural-platinum-1440", 1440, { v: "architectural", theme: "light", brand: "northbridge" }],
  ["focus-ring-keyboard-1440", 1440, { v: "ambient", theme: "dark", act: async (p) => { for (let i = 0; i < 14; i++) await p.keyboard.press("Tab"); await p.waitForTimeout(300); } }],
  ["prototype-switcher-1440", 1440, { v: "pulse", theme: "dark", act: async (p) => (await p.getByRole("button", { name: "More", exact: true }).click(), await p.waitForTimeout(300)) }],
);

const only = process.env.ONLY?.split(",");
const browser = await chromium.launch({ channel: "chrome" });
for (const [name, width, o] of SHOTS) {
  if (only && !only.some((x) => name.includes(x))) continue;
  const mobile = width < 800;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : width >= 1920 ? 1080 : 900 }, deviceScaleFactor: mobile ? 2 : 1.5, hasTouch: mobile, isMobile: mobile });
  await ctx.addInitScript(
    ([theme, brand, v]) => {
      try {
        sessionStorage.setItem("aurum-eco-entered", "1"); // screenshots show the settled state
        localStorage.setItem("aurum-theme-v1", theme);
        localStorage.setItem("aurum-eco-preview-v1", v);
        if (brand) localStorage.setItem("aurum-tenant-brand", brand);
        else localStorage.removeItem("aurum-tenant-brand");
      } catch {}
    },
    [o.theme, o.brand ? preset(o.brand) : null, o.v],
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/admin", { waitUntil: "load" });
  await page.waitForTimeout(1800);
  if (o.act) await o.act(page);
  // freeze the breathing at its mid-point so stills are comparable
  await page.addStyleTag({ content: ".eco-anim .breathe, .eco-anim .eco-hex-lit { animation-delay: -6s !important; animation-play-state: paused !important; }" });
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: join(OUT, name + ".png") });
  console.log("shot", name, overflow > 0 ? `OVERFLOW ${overflow}px` : "", errors.length ? "ERRORS " + errors.join(" | ") : "");
  await ctx.close();
}
await browser.close();
