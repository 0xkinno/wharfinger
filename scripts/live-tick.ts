// One live tick against the real Telegraph testnet node, paid from the probe house escrow. Appends every purchase to
// evidence/live/purchases.ndjson. Usage: pnpm exec tsx scripts/live-tick.ts [mmsi] [locode] [portQuery]
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnv } from "./lib/env.ts";
import { escrowClient } from "../packages/telegraph/src/index.ts";
import { tick, type Store, type PurchaseRow, type VoyageState } from "../packages/watch/src/index.ts";
import type { Stats } from "../packages/evidence/src/index.ts";

loadEnv();
const [mmsi = "246546000", locode = "FIKTK", portArg = "none"] = process.argv.slice(2);
const portQuery = portArg === "none" ? null : portArg; // Kotka cannot be bought correctly: see PLATFORM_PROBE.md F24
const FILE = "evidence/live/purchases.ndjson";
class NdjsonStore implements Store {
  private leases = new Set<string>();
  async tryLease(id: string, slot: number) { const k = `${id}:${slot}`; if (this.leases.has(k)) return false; this.leases.add(k); return true; }
  async append(r: PurchaseRow) { appendFileSync(FILE, JSON.stringify(r, (_, v) => (typeof v === "bigint" ? v.toString() : v)) + "\n"); }
  async stats(): Promise<Stats> { const s: Stats = {}; if (!existsSync(FILE)) return s; for (const l of readFileSync(FILE, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); if (r.minerId && r.verdictOk !== null) { s[r.minerId] ??= { pass: 0, total: 0 }; s[r.minerId].total++; if (r.verdictOk) s[r.minerId].pass++; } } return s; }
  async setStatus(id: string, status: string, reason: string) { console.log("STATUS", id, status, reason); }
}
const account = privateKeyToAccount((process.env.HOUSE_PRIVATE_KEY || process.env.PROBE_HOUSE_PRIVATE_KEY) as `0x${string}`);
const client = escrowClient(account);
const v: VoyageState = { id: `live-${mmsi}`, status: "WATCHING", mmsi, portLocode: locode, portQuery, moored: true, lastBought: {}, ownOperators: [] };
const out = await tick(v, {
  buy: (b, m) => client.ask(b, m), now: () => Date.now(), store: new NdjsonStore(),
  signalCreatedAt: async (h) => { const r = await client.signal(h); return r.json?.signal?.created_at ?? null; },
  available: async () => BigInt((await client.ledger()).json?.available ?? 0),
});
console.log(JSON.stringify({ held: out.held ?? null, skipped: out.skipped ?? null, purchases: out.purchases, spentUusdc: out.spentUusdc.toString(),
  facts: out.facts.map((f) => ({ kind: f.kind, status: f.corroboration?.status, independence: f.corroboration?.independence, operators: f.corroboration?.operators.length, families: f.corroboration?.families, note: f.corroboration?.note })) }, null, 1));
