// Captures the README screenshots and the social card from a running build. Usage: BASE=http://localhost:3204 node e2e/screens.mjs
import { createRequire } from "node:module"; import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000"; const OUT = "apps/web/public/readme"; mkdirSync(OUT, { recursive: true });
const ID = "iceland-fiktk-preloaded";
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
const jpg = (name, opts = {}) => p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 86, ...opts });
await p.goto(BASE + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(600); await jpg("hero");
await p.goto(BASE + `/voyage/${ID}`, { waitUntil: "networkidle" }); await p.waitForTimeout(500); await jpg("voyage");
await p.goto(BASE + `/statement/${ID}`, { waitUntil: "networkidle" }); await p.waitForTimeout(500); await jpg("statement");
await p.goto(BASE + `/verify/${ID}`, { waitUntil: "networkidle" }); await p.getByRole("button", { name: "Recompute in this browser" }).first().click(); await p.waitForSelector("text=PASS", { timeout: 60000 }); await p.waitForTimeout(500); await jpg("verify");
await p.goto(BASE + "/evidence", { waitUntil: "networkidle" }); await p.waitForTimeout(500); await jpg("evidence");
await p.goto(BASE + "/judge", { waitUntil: "networkidle" }); await p.getByRole("button", { name: "Tamper one minute" }).click(); await p.waitForSelector("text=FAIL", { timeout: 60000 }); await p.waitForTimeout(500); await jpg("judge-break", { fullPage: false });
const o = await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 }); const op = await o.newPage(); await op.goto(BASE + "/og", { waitUntil: "networkidle" }); await op.waitForTimeout(800);
await op.locator("#og").screenshot({ path: "apps/web/public/og.png" });
const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const mp = await m.newPage(); await mp.goto(BASE + `/statement/${ID}`, { waitUntil: "networkidle" }); await mp.waitForTimeout(500); await mp.screenshot({ path: `${OUT}/mobile-statement.jpg`, type: "jpeg", quality: 86 });
await b.close(); console.log("screens written");
