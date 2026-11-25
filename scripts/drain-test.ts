// B4, live: a voyage funded with only 0.05 USDC must stop with the node's own refusal text and the watcher must hold rather than
// retry with another key. The ledger gate is switched off so the NODE's refusal is what stops it (with the gate on, the watcher
// would stop one answer earlier, before asking). Every purchase is recorded in the database under voyage id starting drain-test.
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const { createVoyage } = await import("../apps/web/lib/voyages.ts");
const { PgStore } = await import("../apps/web/lib/pgstore.ts");
const { voyageClient } = await import("../apps/web/lib/clients.ts");
const { q } = await import("../apps/web/lib/db.ts");
const { tick } = await import("../packages/watch/src/index.ts");
const D = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const, U = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const funder = privateKeyToAccount((process.env.PROBE_HOUSE_PRIVATE_KEY || process.env.HOUSE_PRIVATE_KEY) as `0x${string}`);
const transport = http("https://ethereum-sepolia-rpc.publicnode.com"); const pub = createPublicClient({ chain: sepolia, transport }); const w = createWalletClient({ account: funder, chain: sepolia, transport });
const abi = parseAbi(["function approve(address,uint256) returns (bool)", "function depositUSDCFor(address,uint256)"]);
const terms = { laytimeMinutes: 2160, turnTimeMinutes: 360, norRule: "PORT_LIMITS", weatherWorkingDays: true, shex: false, holidays: [], reversible: false, demurrageUusdcPerDay: "18000000000", despatchUusdcPerDay: "9000000000", onceOnDemurrage: true, tz: "Europe/Helsinki" };
const v = await createVoyage({ vessel: "Drain test", mmsi: "246546000", port: "FIKTK", portQuery: null, funder: funder.address, capUusdc: 50_000n, terms, label: "Budget drain test (B4), funded with 0.05 USDC" });

await pub.waitForTransactionReceipt({ hash: await w.writeContract({ address: U, abi, functionName: "approve", args: [D, 50_000n] }) });
await pub.waitForTransactionReceipt({ hash: await w.writeContract({ address: D, abi, functionName: "depositUSDCFor", args: [v.voyageAddress as `0x${string}`, 50_000n] }) });
console.log("voyage", v.id, v.voyageAddress, "funded 50000 uUSDC");
const client = voyageClient(v.voyageIndex); const store = new PgStore(); let now = Date.now(); let held: string | null = null, total = 0, msg = "";
const state = { id: v.id, status: "WATCHING" as const, mmsi: "246546000", portLocode: "FIKTK", portQuery: null, moored: false, lastBought: {} as any, ownOperators: [] as string[] };
for (let i = 0; i < 8 && !held; i++) {
  const out = await tick(state, { buy: (b, m) => client.ask(b, m), now: () => now, store, signalCreatedAt: async (h) => (await client.signal(h)).json?.signal?.created_at ?? null, available: async () => 1_000_000n /* gate off */ });
  total += out.purchases; held = out.held ?? null; msg = out.message ?? ""; now += 31 * 60_000; state.lastBought = {};
  console.log(`tick ${i}: ${out.purchases} paid, held=${out.held ?? "no"} ${out.message ?? ""}`.slice(0, 200));
}
const rows = await q("select attempt, status, refusal, receipt_hash from purchases where voyage_id=$1 order by id", [v.id]);
console.log(JSON.stringify({ paid: total, held, node_text: msg, rows: rows.length, refusals: rows.filter((r: any) => r.status === 402).map((r: any) => r.refusal) }));
