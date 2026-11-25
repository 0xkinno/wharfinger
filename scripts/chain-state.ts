// Read-only state snapshot: token, escrow account struct, charge limit, active root. No keys.
import { createPublicClient, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import { writeFileSync } from "node:fs";

const RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const D = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const;
const U = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const c = createPublicClient({ chain: sepolia, transport: http(RPC) });
const abi = parseAbi([
  "function usdcToken() view returns (address)",
  "function jobBasePrice() view returns (uint256)",
  "function ledgerAccount(address) view returns (uint256 deposited, uint256 withdrawn, uint256 requested, uint256 requestedAt)",
  "function chargeLimitOf(address) view returns (uint256)",
  "function activeLedgerRoot() view returns (bytes)",
  "function minerBondParams() view returns (uint256,uint256,uint256,uint256,uint256)",
  "function entityBonds() view returns (uint64,uint64,uint256,uint256)",
  "function paused() view returns (bool)",
  "function nextEpochToSettle() view returns (uint256)",
  "function withdrawalStatus(address) view returns (uint256,uint256,uint8)",
]);
const erc20 = parseAbi(["function decimals() view returns (uint8)", "function symbol() view returns (string)", "function totalSupply() view returns (uint256)"]);
const probeAddr = (process.argv[2] || "0x0000000000000000000000000000000000000001") as `0x${string}`;
const out: Record<string, unknown> = { at: new Date().toISOString(), probeAddr };
async function t(name: string, fn: () => Promise<unknown>) {
  try { const v = await fn(); out[name] = JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x))); }
  catch (e) { out[name] = { error: String(e).split("\n")[0].slice(0, 200) }; }
}
await t("usdcToken", () => c.readContract({ address: D, abi, functionName: "usdcToken" }));
await t("jobBasePrice", () => c.readContract({ address: D, abi, functionName: "jobBasePrice" }));
await t("ledgerAccount", () => c.readContract({ address: D, abi, functionName: "ledgerAccount", args: [probeAddr] }));
await t("chargeLimitOf", () => c.readContract({ address: D, abi, functionName: "chargeLimitOf", args: [probeAddr] }));
await t("activeLedgerRoot", () => c.readContract({ address: D, abi, functionName: "activeLedgerRoot" }));
await t("minerBondParams", () => c.readContract({ address: D, abi, functionName: "minerBondParams" }));
await t("entityBonds", () => c.readContract({ address: D, abi, functionName: "entityBonds" }));
await t("paused", () => c.readContract({ address: D, abi, functionName: "paused" }));
await t("nextEpochToSettle", () => c.readContract({ address: D, abi, functionName: "nextEpochToSettle" }));
await t("withdrawalStatus", () => c.readContract({ address: D, abi, functionName: "withdrawalStatus", args: [probeAddr] }));
await t("usdcDecimals", () => c.readContract({ address: U, abi: erc20, functionName: "decimals" }));
await t("usdcSymbol", () => c.readContract({ address: U, abi: erc20, functionName: "symbol" }));
await t("usdcTotalSupply", () => c.readContract({ address: U, abi: erc20, functionName: "totalSupply" }));
await t("usdcCodeLen", async () => (await c.getCode({ address: U }))?.length);
writeFileSync("evidence/probe/chain_state.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
