import { q, hasDb } from "./db";
import { NODE, houseAccount } from "./clients";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export async function measure() {
  const out: any = { at: new Date().toISOString(), node: null, escrowHouse: null, database: null, lastTick: null, epoch: null };
  const t0 = Date.now();
  try { const r = await fetch(`${NODE}/engine/v1/intents/VESSEL_TELEMETRY_VERIFY_GENERAL`, { signal: AbortSignal.timeout(10_000) }); const j: any = await r.json(); out.node = { ok: r.ok, ms: Date.now() - t0, vesselMiners: j.miner_count }; } catch (e: any) { out.node = { ok: false, error: String(e.message).slice(0, 100) }; }
  try { const a = houseAccount().address; const l: any = await (await fetch(`${NODE}/v1/ledger/account/${a.toLowerCase()}`, { signal: AbortSignal.timeout(10_000) })).json(); out.escrowHouse = { address: a, availableUusdc: l.available, chargedThisBlock: l.charged_this_block }; out.epoch = l.active_root?.epoch_id ?? null; } catch (e: any) { out.escrowHouse = { error: String(e.message).slice(0, 100) }; }
  if (hasDb()) { try { const r = await q("select (select count(*)::int from voyages) as voyages, (select count(*)::int from purchases) as purchases, (select max(asked_at) from purchases) as last_purchase"); out.database = { ok: true, ...r[0] }; out.lastTick = r[0].last_purchase; } catch (e: any) { out.database = { ok: false, error: String(e.message).slice(0, 100) }; } } else out.database = { ok: false, error: "DATABASE_URL not set" };
  try { const c = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com", { timeout: 6000, retryCount: 0 }) }); out.chain = { block: String(await c.getBlockNumber()) }; } catch { out.chain = null; }
  return out;
}
