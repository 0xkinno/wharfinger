// Phase 1 paid probe, run in stages. Every stage that sends a transaction or buys an answer needs --yes.
// Testnet only: the script refuses to write unless the chain id is 11155111.
//
//   pnpm probe:paid --stage=balances                     read only
//   pnpm probe:paid --stage=mint --yes                   mint test USDC to the house wallet if short
//   pnpm probe:paid --stage=deposit --yes                house: approve + depositUSDC into its own escrow
//   pnpm probe:paid --stage=voyage --yes                 house: gas to voyage key, depositUSDCFor(voyage key); times the ledger
//   pnpm probe:paid --stage=limit --yes                  voyage key: setMyChargeLimit, refusal text
//   pnpm probe:paid --stage=asks --yes                   the paid matrix (about 30 answers, about 0.30 USDC)
//   pnpm probe:paid --stage=withdraw-request --yes       voyage key: requestWithdraw
//   pnpm probe:paid --stage=withdraw-exec --yes          voyage key: executeWithdraw when the ledger says ready
import { createPublicClient, createWalletClient, http, parseAbi, formatEther, formatUnits, parseEther, type Hex } from "viem";
import { generateMnemonic, english, mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { writeFileSync, mkdirSync } from "node:fs";
import { loadEnv, setEnvVar } from "./lib/env.ts";
import { escrowClient, NODE, type Purchase } from "./lib/telegraph.ts";

loadEnv();
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? "true"]; }));
const stage = args.stage ?? "balances";
const yes = args.yes === "true";
const RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const DIAMOND = (process.env.TELEGRAPH_DIAMOND ?? "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b") as Hex;
const USDC = (process.env.TELEGRAPH_USDC ?? "0xcc194e1a843B658526D0D5C431f670028582Ae17") as Hex;
const OUT = "evidence/probe/paid";
mkdirSync(OUT, { recursive: true });

const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
const diamondAbi = parseAbi([
  "function depositUSDC(uint256 amount)", "function depositUSDCFor(address beneficiary, uint256 amount)",
  "function requestWithdraw(uint256 amount)", "function cancelWithdraw()", "function setMyChargeLimit(uint256 limit)",
  "function chargeLimitOf(address) view returns (uint256)",
  "function ledgerAccount(address) view returns (uint256 deposited, uint256 withdrawn, uint256 requested, uint256 requestedAt)",
]);
const erc20 = parseAbi(["function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)", "function mint(address to, uint256 amount)"]);

const pk = process.env.HOUSE_PRIVATE_KEY || process.env.PROBE_HOUSE_PRIVATE_KEY;
const house = pk ? privateKeyToAccount(pk as Hex) : null;
if (!process.env.PROBE_MNEMONIC) { const m = generateMnemonic(english); setEnvVar("PROBE_MNEMONIC", m); process.env.PROBE_MNEMONIC = m; }
const voyage = mnemonicToAccount(process.env.PROBE_MNEMONIC!, { addressIndex: 0 });
const log = (name: string, data: unknown) => { writeFileSync(`${OUT}/${name}.json`, JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v), 1)); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function need(cond: unknown, msg: string): asserts cond { if (!cond) { console.error(msg); process.exit(2); } }
function needWrite() {
  need(yes, `stage ${stage} sends transactions or buys answers: pass --yes`);
  need(house, "no HOUSE_PRIVATE_KEY or PROBE_HOUSE_PRIVATE_KEY in .env.local");
}
const wallet = (account: any) => createWalletClient({ account, chain: sepolia, transport: http(RPC) });
async function chainOk() { need((await pub.getChainId()) === 11155111, "refusing to write: RPC is not Ethereum Sepolia"); }
async function send(label: string, account: any, req: any) {
  await chainOk();
  const hash = await wallet(account).writeContract({ ...req, chain: sepolia, account });
  const rc = await pub.waitForTransactionReceipt({ hash, timeout: 180_000 });
  console.log(`${label}: ${rc.status} ${hash}`);
  return { label, hash, status: rc.status, block: String(rc.blockNumber), gasUsed: String(rc.gasUsed) };
}
const ledger = async (addr: string) => (await fetch(`${NODE}/v1/ledger/account/${addr.toLowerCase()}`)).json();

if (stage === "balances") {
  const rows: any = { at: new Date().toISOString(), voyageAddress: voyage.address };
  for (const [name, a] of [["house", house?.address], ["voyage", voyage.address]] as const) {
    if (!a) { rows[name] = "no key"; continue; }
    rows[name] = { address: a, eth: formatEther(await pub.getBalance({ address: a })),
      usdc: formatUnits(await pub.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [a] }), 6),
      chargeLimit: String(await pub.readContract({ address: DIAMOND, abi: diamondAbi, functionName: "chargeLimitOf", args: [a] })),
      ledger: await ledger(a) };
  }
  console.log(JSON.stringify(rows, null, 1)); log("stage_balances", rows);
} else if (stage === "mint") {
  needWrite();
  const bal = await pub.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [house!.address] });
  if (bal >= 3_000_000n) { console.log("house already holds", formatUnits(bal, 6), "USDC"); } else {
    log("stage_mint", await send("mint 5 USDC", house, { address: USDC, abi: erc20, functionName: "mint", args: [house!.address, 5_000_000n] }));
  }
} else if (stage === "deposit") {
  needWrite();
  const amt = BigInt(args.uusdc ?? 1_000_000);
  const r1 = await send("approve diamond", house, { address: USDC, abi: erc20, functionName: "approve", args: [DIAMOND, 3_000_000n] });
  const r2 = await send(`depositUSDC ${amt}`, house, { address: DIAMOND, abi: diamondAbi, functionName: "depositUSDC", args: [amt] });
  const t0 = Date.now(); let seen: any = null;
  for (let i = 0; i < 40; i++) { const l: any = await ledger(house!.address); if (BigInt(l.deposited ?? 0) >= amt) { seen = l; break; } await sleep(5000); }
  log("stage_deposit", { r1, r2, ledgerShowedDepositAfterMs: seen ? Date.now() - t0 : null, ledger: seen ?? await ledger(house!.address) });
} else if (stage === "voyage") {
  needWrite();
  const cap = BigInt(args.uusdc ?? 200_000);
  await chainOk();
  const gasHash = await wallet(house).sendTransaction({ to: voyage.address, value: parseEther("0.002"), chain: sepolia, account: house! });
  const gasRc = await pub.waitForTransactionReceipt({ hash: gasHash });
  const gas = { hash: gasHash, status: gasRc.status }; console.log("gas to voyage key:", gasRc.status, gasHash);
  const dep = await send(`depositUSDCFor(voyage, ${cap})`, house, { address: DIAMOND, abi: diamondAbi, functionName: "depositUSDCFor", args: [voyage.address, cap] });
  const t0 = Date.now(); let seen: any = null;
  for (let i = 0; i < 60; i++) { const l: any = await ledger(voyage.address); if (BigInt(l.deposited ?? 0) >= cap) { seen = l; break; } await sleep(5000); }
  log("stage_voyage", { voyage: voyage.address, gas, dep, ledgerShowedDepositAfterMs: seen ? Date.now() - t0 : null, ledger: seen ?? await ledger(voyage.address) });
} else if (stage === "limit") {
  needWrite();
  const c = escrowClient(voyage);
  const body = { intent: "FX_NOW_EUR", params: { currency: "EUR" } };
  const set1 = await send("setMyChargeLimit(10000)", voyage, { address: DIAMOND, abi: diamondAbi, functionName: "setMyChargeLimit", args: [10_000n] });
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) { const v = String(await pub.readContract({ address: DIAMOND, abi: diamondAbi, functionName: "chargeLimitOf", args: [voyage.address] })); seen.push(v); if (v === "10000") break; await sleep(2000); }
  const asks: any[] = [];
  for (let i = 0; i < 4; i++) { const p = await c.ask(body); asks.push({ i, status: p.status, ms: p.ms, reason: p.ok ? "served" : (p.body?.reason ?? p.body?.error ?? p.body), receipt: p.receipt, ledger: await c.ledger() }); console.log(`ask ${i}: ${p.status} ${asks[i].reason}`); }
  log("stage_limit", { set1, chargeLimitReadbacks: seen, asks });
} else if (stage === "asks") {
  needWrite();
  await import("./lib/probe-matrix.ts").then((m) => m.runMatrix({ house: house!, voyage, OUT, log }));
} else if (stage === "withdraw-request") {
  needWrite();
  const l: any = await ledger(voyage.address);
  const amt = BigInt(args.uusdc ?? l.available ?? 0);
  need(amt > 0n, "nothing available to withdraw");
  const r = await send(`requestWithdraw(${amt})`, voyage, { address: DIAMOND, abi: diamondAbi, functionName: "requestWithdraw", args: [amt] });
  log("stage_withdraw_request", { requestedAt: new Date().toISOString(), amt, r, ledger: await ledger(voyage.address) });
} else if (stage === "withdraw-exec") {
  needWrite();
  const l: any = await ledger(voyage.address);
  console.log("request status:", l.request?.status);
  need(l.request?.status === "ready", `withdrawal not ready yet (status ${l.request?.status})`);
  const p: any = await (await fetch(`${NODE}/v1/ledger/proof/${voyage.address.toLowerCase()}`)).json();
  await chainOk();
  const hash = await wallet(voyage).sendTransaction({ to: DIAMOND, data: p.calldata, chain: sepolia, account: voyage });
  const rc = await pub.waitForTransactionReceipt({ hash });
  log("stage_withdraw_exec", { hash, status: rc.status, selector: String(p.calldata).slice(0, 10), usdcAfter: String(await pub.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [voyage.address] })) });
  console.log("executeWithdraw", rc.status, hash);
} else { console.error("unknown stage", stage); process.exit(2); }
