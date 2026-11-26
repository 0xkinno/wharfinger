// Browser smoke suite: zero console errors, no horizontal scroll, art never overlaps text, axe WCAG 2 A/AA, screenshots.
// Usage: BASE=http://localhost:3102 node e2e/smoke.mjs   (uses the preinstalled Playwright)
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSrc = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.env.BASE ?? "http://localhost:3000";
const PAGES = ["/", "/harbour", "/voyage/new", "/voyage/iceland-fiktk-preloaded", "/statement/iceland-fiktk-preloaded", "/verify", "/verify/iceland-fiktk-preloaded", "/evidence", "/judge", "/trace", "/settle"];
const VIEWPORTS = [[375, 812], [390, 844], [412, 915], [768, 1024], [1280, 800], [1440, 900]];
mkdirSync("e2e/screens", { recursive: true });
const browser = await chromium.launch(); let fails = 0; const log = (ok, m) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${m}`); };
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const page = await ctx.newPage();
  const errors = []; page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|favicon|WalletConnect|walletconnect|Reown|pulse\.walletconnect|api\.web3modal/i.test(m.text())) errors.push(m.text().slice(0, 140)); }); page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
  for (const p of PAGES) {
    errors.length = 0; await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {}); await page.waitForTimeout(400);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    log(scroll <= 1, `${w}px ${p} no horizontal scroll (${scroll})`);
    log(errors.length === 0, `${w}px ${p} console clean${errors.length ? ": " + errors[0] : ""}`);
    const overlap = await page.evaluate(() => { const A = [...document.querySelectorAll("[data-art]")].map((e) => e.getBoundingClientRect()), T = [...document.querySelectorAll("[data-text]")].map((e) => e.getBoundingClientRect()); return A.some((a) => T.some((t) => a.left < t.right - 1 && a.right > t.left + 1 && a.top < t.bottom - 1 && a.bottom > t.top + 1)); });
    log(!overlap, `${w}px ${p} art and text boxes do not overlap`);
    if (w === 1280 || w === 375) {
      await page.addScriptTag({ content: axeSrc }); const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] })).violations.map((x) => `${x.id}(${x.nodes.length})`));
      log(v.length === 0, `${w}px ${p} axe ${v.length ? v.join(" ") : "no violations"}`);
      await page.screenshot({ path: `e2e/screens/${w}${p.replace(/\//g, "_") || "_home"}.png`, fullPage: false });
    }
  }
  await ctx.close();
}
await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
