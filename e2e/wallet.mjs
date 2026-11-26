// End-to-end wallet suite. A mock EIP-1193 wallet signs for real (EIP-191 and EIP-712) and sends real Sepolia transactions,
// so every wallet action in the app runs for real against the node. Usage:
//   BASE=http://localhost:3201 WALLET_KEY=0x... TICK_SECRET=... node e2e/wallet.mjs
// WALLET_KEY must hold a little Sepolia ETH. Screenshots land in e2e/screens/wallet-*.png at 1440x900, 2x.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { privateKeyToAccount, generatePrivateKey } = await import("viem/accounts");
const { createWalletClient, http, createPublicClient } = await import("viem");
const { sepolia } = await import("viem/chains");

const BASE = process.env.BASE ?? "http://localhost:3201";
const KEY = process.env.WALLET_KEY; const TICK = process.env.TICK_SECRET;
if (!KEY || !TICK) { console.error("set WALLET_KEY and TICK_SECRET"); process.exit(2); }
const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
mkdirSync("e2e/screens", { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(`${c ? "PASS" : "FAIL"}  ${m}`); };

async function newWalletPage(browser, key) {
  const account = privateKeyToAccount(key); const transport = http(RPC);
  const wc = createWalletClient({ account, chain: sepolia, transport }); const pc = createPublicClient({ chain: sepolia, transport });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }); const page = await ctx.newPage();
  const sent = [];
  await page.exposeFunction("__wallet", async (method, params = []) => {
    switch (method) {
      case "eth_requestAccounts": case "eth_accounts": return [account.address];
      case "eth_chainId": return "0xaa36a7"; case "net_version": return "11155111";
      case "wallet_switchEthereumChain": case "wallet_addEthereumChain": case "wallet_requestPermissions": return null;
      case "personal_sign": return account.signMessage({ message: { raw: params[0] } });
      case "eth_signTypedData_v4": { const t = JSON.parse(params[1]); delete t.types.EIP712Domain; return account.signTypedData({ domain: t.domain, types: t.types, primaryType: t.primaryType, message: t.message }); }
      case "eth_sendTransaction": { const p = params[0]; const hash = await wc.sendTransaction({ to: p.to, data: p.data, value: p.value ? BigInt(p.value) : undefined }); sent.push(hash); return hash; }
      default: { const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }); const j = await r.json(); if (j.error) throw Object.assign(new Error(j.error.message), { code: j.error.code }); return j.result; }
    }
  });
  await page.addInitScript(() => { const listeners = {}; const provider = { isMetaMask: true, request: ({ method, params }) => window.__wallet(method, params), on: (e, f) => { (listeners[e] ??= []).push(f); }, removeListener: () => {}, selectedAddress: null, chainId: "0xaa36a7" };
    window.ethereum = provider;
    const info = { uuid: "350670db-19fa-4704-a166-e52e178b59d2", name: "MetaMask", icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjY4NTFCIi8+PC9zdmc+", rdns: "io.metamask" };
    const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: Object.freeze({ info, provider }) }));
    window.addEventListener("eip6963:requestProvider", announce); announce(); });
  void pc; return { page, account, ctx, sent };
}
const shot = (page, name) => page.screenshot({ path: `e2e/screens/wallet-${name}.png` });
async function connect(page) {
  if (await page.getByRole("button", { name: "Disconnect wallet" }).isVisible().catch(() => false)) return;
  await page.waitForTimeout(1200); if (await page.getByRole("button", { name: "Disconnect wallet" }).isVisible().catch(() => false)) return;
  await page.getByRole("button", { name: /^Connect wallet$/ }).first().click(); await page.waitForTimeout(600);
  await page.getByText(/MetaMask|Browser Wallet|Injected/i).first().click(); await page.waitForTimeout(1500);
}

const browser = await chromium.launch();
const A = await newWalletPage(browser, KEY); const page = A.page;
const errors = []; page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));

// 1 connect, show address, power icon disconnects, reconnect
await page.goto(BASE + "/", { waitUntil: "networkidle" }); await shot(page, "01-landing");
await page.waitForTimeout(1500); await connect(page);
const shortRe = new RegExp(`${A.account.address.slice(0, 4)}.{1,3}${A.account.address.slice(-4)}`, "i");
ok(await page.getByText(shortRe).first().isVisible().catch(() => false), "wallet connects and the short address shows in the navbar");
await shot(page, "02-connected");
await page.getByRole("button", { name: "Disconnect wallet" }).click(); await page.waitForTimeout(800);
ok(await page.getByRole("button", { name: /^Connect wallet$/ }).first().isVisible(), "the power icon disconnects");
await connect(page); ok(await page.getByRole("button", { name: "Disconnect wallet" }).isVisible(), "reconnect works");

// 2 fund a voyage for real: create, mint if short, approve, depositUSDCFor, server confirms from the ledger
await page.goto(BASE + "/voyage/new", { waitUntil: "networkidle" });
await page.getByPlaceholder("Iceland").fill("Ankie"); await page.getByPlaceholder("246546000").fill("244554000");
await page.locator("select").first().selectOption("FIKTK");
const cap = page.locator("label", { hasText: "Voyage cap" }).locator("input"); await cap.fill("0.30");
await shot(page, "03-fixture-form");
await page.getByRole("button", { name: /Fund the voyage and start watching/ }).click();
await page.waitForFunction(() => document.querySelectorAll(".chip.ok").length >= 4, null, { timeout: 300000 }).catch(() => {});
await page.waitForTimeout(1500); await shot(page, "04-funding-steps");
const doneChips = await page.locator(".chip.ok").count(); ok(doneChips >= 4, `all four funding steps finished (${doneChips} done chips)`);
const href = await page.getByRole("link", { name: "Open the voyage" }).getAttribute("href").catch(() => null); ok(!!href, `voyage created: ${href}`);
const id = href?.split("/").pop();

// 3 the watcher buys (tick with the bearer secret), the voyage page shows receipts
const tickRes = await fetch(`${BASE}/api/watch/tick`, { method: "POST", headers: { authorization: `Bearer ${TICK}` } }).then((r) => r.json());
const mine = tickRes.voyages?.find((v) => v.voyage === id); ok(mine && mine.purchases >= 2, `tick bought ${mine?.purchases} answers for the new voyage`);
await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" }); await shot(page, "05-voyage-evidence");

// 4 Statement of Facts with real signatures, then REVIEW resolution
await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" }); await connect(page).catch(() => {});
const nowMin = Math.floor(Date.now() / 60000); const iso = (m) => new Date(m * 60000).toISOString().slice(0, 16);
const add = page.getByRole("button", { name: "Add event" });
const events = [["LOADING_START", 7 * 60, ""], ["LOADING_STOP", 9 * 60, "loading stopped, snow"], ["LOADING_RESUME", 11 * 60, ""], ["COMPLETED", 40 * 60, ""]];
for (const [kind, offset, remark] of events) {
  await add.click(); const sel = page.locator("select").filter({ has: page.locator("option", { hasText: "NOR_TENDERED" }) }).last(); await sel.selectOption(kind);
  const idx = (await page.locator('input[type="datetime-local"]').count()) - 1; await page.locator('input[type="datetime-local"]').nth(idx).fill(iso(nowMin + offset));
  if (remark) await page.getByPlaceholder("for example: loading stopped, snow").last().fill(remark);
}
await page.getByRole("button", { name: "Sign and save" }).click(); await page.waitForTimeout(6000);
await page.waitForLoadState("networkidle"); await shot(page, "06-sof-saved");
ok(await page.getByText("Laytime clock").isVisible().catch(() => false), "after the signed save the laytime clock appears");
ok(await page.getByText(/Resolve REVIEW intervals/).isVisible().catch(() => false), "the weather stop with no receipt is a REVIEW interval");
const sel2 = page.locator("select").filter({ has: page.locator("option", { hasText: "Unresolved" }) }).first(); await sel2.selectOption("COUNTS");
await page.getByText("Reason (kept as a durable note)").locator("..").locator("input").fill("No weather receipt for the snow stop, so the hours count (conservative).");
await page.getByRole("button", { name: "Sign and save" }).click(); await page.waitForTimeout(6000); await page.waitForLoadState("networkidle"); await shot(page, "07-review-resolved");

// 5 statement: sign as analyst with EIP-712
await page.goto(`${BASE}/statement/${id}`, { waitUntil: "networkidle" }); await connect(page).catch(() => {}); await shot(page, "08-statement-draft");
await page.getByRole("button", { name: /Sign as analyst/ }).click(); await page.waitForTimeout(7000); await page.waitForLoadState("networkidle"); await shot(page, "09-statement-signed");
ok(await page.getByText("SIGNED", { exact: false }).first().isVisible().catch(() => false), "the statement is signed by the analyst wallet and frozen");
for (const p of ["pdf", "xlsx"]) { const r = await fetch(`${BASE}/api/statement/${id}/${p}`); ok(r.status === 200 && (await r.arrayBuffer()).byteLength > 3000, `${p.toUpperCase()} export downloads (${r.status})`); }

// 6 owner: a different wallet recomputes in the browser and countersigns
const O = await newWalletPage(browser, generatePrivateKey()); const op = O.page;
await op.goto(`${BASE}/verify/${id}`, { waitUntil: "networkidle" });
await op.getByRole("button", { name: "Recompute in this browser" }).first().click(); await op.waitForSelector("text=PASS", { timeout: 90000 }).catch(() => {});
ok(await op.getByText("PASS", { exact: true }).first().isVisible().catch(() => false), "owner recompute in the browser: PASS"); await shot(op, "10-owner-recompute");
await connect(op); await op.getByRole("button", { name: /Sign acceptance with my wallet/ }).click(); await op.waitForTimeout(7000); await op.waitForLoadState("networkidle"); await shot(op, "11-owner-countersigned");
ok(await op.getByText(/Agreed/i).first().isVisible().catch(() => false), "owner countersignature recorded: AGREED");

// 7 judge door and failure buttons
await page.goto(BASE + "/judge", { waitUntil: "networkidle" }); await page.getByPlaceholder("MMSI, nine digits").fill("244554000");
await page.getByRole("button", { name: "Buy two answers" }).click(); await page.waitForSelector("text=paid answers", { timeout: 120000 }).catch(() => {}); await shot(page, "12-judge-door");
ok(await page.getByText(/paid answers/).first().isVisible().catch(() => false), "the judge door bought live answers with the house key");
await page.getByRole("button", { name: "Tamper one minute" }).click(); await page.getByText("FAIL", { exact: true }).first().waitFor({ state: "visible", timeout: 60000 }).catch(() => {}); await shot(page, "13-tamper-fails");
ok(await page.getByText("FAIL", { exact: true }).first().isVisible().catch(() => false), "tampered statement fails the recompute in the browser");
for (const m of ["Wrong place", "Stale position", "Operators disagree", "Obedient model", "Budget drain"]) { await page.getByRole("button", { name: m }).click(); await page.waitForTimeout(900); }
await shot(page, "14-failure-buttons");

ok(errors.length === 0, `no uncaught page errors${errors.length ? ": " + errors[0] : ""}`);
console.log(`voyage ${id}; wallet txs sent: ${A.sent.length}`);
await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
