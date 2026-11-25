// Screenshot key pages with the local Chrome. Dev server must be running.
// Usage: node tools/screenshots.mjs [outDir=design/audit] [base=http://localhost:3100]
// Env: ONLY=hub,login  WIDTHS=1440,390  FULL=1 (full-page)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
import fs from "fs";

const out = process.argv[2] || "design/audit";
const base = process.argv[3] || "http://localhost:3100";
fs.mkdirSync(out, { recursive: true });

const routes = [
  ["login", "/login"],
  ["hub", "/admin"],
  ["fund-overview", "/admin/fund"],
  ["fund-analytics", "/admin/fund/analytics"],
  ["fund-gps", "/admin/fund/gps"],
  ["fund-gp-detail", "/admin/fund/gps/strlex"],
  ["fund-funds", "/admin/fund/funds"],
  ["fund-fund-detail", "/admin/fund/funds/atlantico-vp-ii"],
  ["fund-investors", "/admin/fund/investors"],
  ["fund-onboarding", "/admin/fund/onboarding"],
  ["fund-capital-calls", "/admin/fund/capital-calls"],
  ["fund-capital-call-new", "/admin/fund/capital-calls/new"],
  ["fund-distributions", "/admin/fund/distributions"],
  ["fund-ledger", "/admin/fund/accounting"],
  ["fund-transfers", "/admin/fund/transfers"],
  ["fund-closes", "/admin/fund/closes"],
  ["fund-documents", "/admin/fund/documents"],
  ["fund-reports", "/admin/fund/reports"],
  ["fund-banking", "/admin/fund/banking"],
  ["corporate", "/admin/corporate"],
  ["sales", "/admin/sales"],
  ["pmo", "/admin/pmo"],
  ["chat", "/admin/communication"],
  ["dataroom", "/admin/dataroom"],
  ["billing", "/admin/billing"],
  ["compliance", "/admin/compliance"],
  ["access", "/admin/access"],
  ["brand", "/admin/brand"],
  ["gp-portal", "/gp/strlex"],
  ["investor-portal", "/investor/strlex"],
  ["investor-login", "/investor/strlex/login"],
  ["room-visitor", "/room/cascade-lps"],
  ["incorporate", "/incorporate"],
];
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const widths = (process.env.WIDTHS || "1440,390").split(",").map(Number);

const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [name, path] of routes) {
    if (only && !only.includes(name)) continue;
    try {
      const res = await page.goto(base + path, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(600);
      const file = `${out}/${name}-${w}.png`;
      await page.screenshot({ path: file, fullPage: process.env.FULL === "1" });
      console.log(w, name, res?.status(), page.url().replace(base, ""));
    } catch (e) {
      console.log(w, name, "ERROR", e.message.split("\n")[0]);
    }
  }
  await ctx.close();
}
await browser.close();
