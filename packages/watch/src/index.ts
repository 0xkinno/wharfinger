// The watcher: one tick per voyage per 30 minute slot. IO is injected, so the whole loop is testable offline.
// Rules: routed ask first; a re-buy is pinned to an operator not yet heard; never a second key; hold when the escrow says no.
import { checkVessel, checkPort, corroborateVessel, corroboratePort, nextRebuy, minerInfo, type Answer, type Verdict, type VesselFact, type PortFact, type Stats, type Corroboration } from "../../evidence/src/index.ts";

export const SLOT_MIN = 30;
export const PRICE_UUSDC = 10_000n;
export const MAX_ATTEMPTS_PER_FACT = 4;
export type Kind = "vessel" | "port" | "weather";
export type VoyageState = { id: string; status: "WATCHING" | "BUDGET_SPENT" | "ENDED"; mmsi: string; portLocode: string; portQuery: string | null; // null: the port queue cannot be bought correctly for this port (PLATFORM_PROBE.md F24)
   moored: boolean; lastBought: Partial<Record<Kind, number>>; ownOperators: string[] };

/** Cadence from RISK.md: tighter while the ship is moving or at anchor, slower once moored and stable. */
export const CADENCE_MIN: Record<"UNDERWAY" | "MOORED", Record<Kind, number>> = { UNDERWAY: { vessel: 30, port: 120, weather: 180 }, MOORED: { vessel: 120, port: 240, weather: 360 } };
export function dueKinds(v: VoyageState, nowMin: number): Kind[] {
  const c = CADENCE_MIN[v.moored ? "MOORED" : "UNDERWAY"];
  return (["vessel", "port", "weather"] as Kind[]).filter((k) => v.lastBought[k] === undefined || nowMin - v.lastBought[k]! >= c[k]);
}
export const slotOf = (nowMs: number) => Math.floor(nowMs / 60000 / SLOT_MIN);

export type PurchaseRow = { voyageId: string; slot: number; kind: Kind; attempt: number; pinned: boolean; minerId: string | null; status: number; refusal: string | null; receiptHash: string | null; epochId: number | null; signalHash: string | null; costUusdc: string; ms: number; askedAt: string; verdictOk: boolean | null; refusals: string[]; result: unknown; requested?: string; signalCreatedAt?: string | null; authValidAfter?: number | null; authValidBefore?: number | null };
export interface Store {
  tryLease(voyageId: string, slot: number): Promise<boolean>;
  append(row: PurchaseRow): Promise<void>;
  stats(): Promise<Stats>;
  setStatus(voyageId: string, status: VoyageState["status"], reason: string): Promise<void>;
}
export type Buy = (body: { intent: string; params: Record<string, string | number> }, minerId?: string) => Promise<{ ok: boolean; status: number; ms: number; body: any; receipt: { receipt_hash: string; epoch_id: number; amount_uusdc: string } | null; auth: { validAfter: number; validBefore: number } | null; askedAt: string; refusal: string | null }>;
export type Deps = { buy: Buy; signalCreatedAt: (hash: string) => Promise<string | null>; available: () => Promise<bigint>; store: Store; now: () => number };

export type TickOutcome = { skipped?: "LEASE_HELD" | "ENDED"; held?: "BUDGET_SPENT" | "NODE_REFUSED"; message?: string; purchases: number; spentUusdc: bigint; facts: { kind: Kind; corroboration?: Corroboration<any>; verdicts: number }[] };

async function buyChecked(deps: Deps, v: VoyageState, slot: number, kind: Kind, attempt: number, body: Parameters<Buy>[0], minerId: string | undefined, requested: string, check: (a: Answer) => Verdict<any>) {
  const p = await deps.buy(body, minerId);
  const hash: string | null = p.body?.signal_hash ?? null;
  const created = p.ok && hash ? await deps.signalCreatedAt(hash) : null;
  const answer: Answer = { minerId: String(p.body?.miner_id ?? minerId ?? ""), intent: body.intent, requested, result: p.body?.result, resultShape: p.body?.result_shape, signalCreatedAt: created, auth: p.auth, receiptHash: p.receipt?.receipt_hash ?? null, epochId: p.receipt?.epoch_id ?? null };
  const verdict = p.ok ? check(answer) : null;
  await deps.store.append({ voyageId: v.id, slot, kind, attempt, pinned: !!minerId, minerId: answer.minerId || null, status: p.status, refusal: p.refusal, receiptHash: answer.receiptHash, epochId: answer.epochId ?? null, signalHash: hash,
    costUusdc: p.receipt?.amount_uusdc ?? "0", ms: p.ms, askedAt: p.askedAt, verdictOk: verdict ? verdict.ok : null, refusals: verdict ? verdict.refusals : [], result: p.body?.result ?? null,
    requested, signalCreatedAt: created, authValidAfter: p.auth?.validAfter ?? null, authValidBefore: p.auth?.validBefore ?? null });
  return { p, verdict };
}
const isEscrowRefusal = (r: string | null) => !!r && /insufficient escrow|charge limit reached/i.test(r);

export async function tick(v: VoyageState, deps: Deps): Promise<TickOutcome> {
  const out: TickOutcome = { purchases: 0, spentUusdc: 0n, facts: [] };
  if (v.status === "ENDED") return { ...out, skipped: "ENDED" };
  const nowMs = deps.now(); const slot = slotOf(nowMs); const nowMin = Math.floor(nowMs / 60000);
  if (!(await deps.store.tryLease(v.id, slot))) return { ...out, skipped: "LEASE_HELD" };
  const own = new Set(v.ownOperators); const stats = await deps.store.stats();
  for (const kind of dueKinds(v, nowMin)) {
    if (kind === "port" && v.portQuery === null) { out.facts.push({ kind, corroboration: { status: "INSUFFICIENT", operators: [], families: [], independence: null, receipts: [], note: "port queue not purchasable for this port" }, verdicts: 0 }); v.lastBought[kind] = nowMin; continue; }
    if (kind === "weather") continue; // conditions read is bought by the daily weather job, not here; it never moves an hour
    const verdicts: Verdict<any>[] = []; const triedOperators = new Set<string>(); let attempt = 0; let corroboration: Corroboration<any> | undefined;
    while (attempt < MAX_ATTEMPTS_PER_FACT) {
      if ((await deps.available()) < PRICE_UUSDC) { await deps.store.setStatus(v.id, "BUDGET_SPENT", "escrow available is below one answer"); return { ...out, held: "BUDGET_SPENT", message: "escrow available is below one answer", facts: [...out.facts] }; }
      let pin: string | undefined;
      if (attempt > 0) { const nx = nextRebuy(kind === "vessel" ? "VESSEL_TELEMETRY_VERIFY_GENERAL" : "LIVE_PORT_CONGESTION_GENERAL", triedOperators, stats, { own }); if (!nx) break; pin = nx.minerId; }
      const body: Parameters<Buy>[0] = kind === "vessel" ? { intent: "VESSEL_TELEMETRY_VERIFY_GENERAL", params: { vessel: v.mmsi } } : { intent: "LIVE_PORT_CONGESTION_GENERAL", params: { port: v.portQuery! } };
      const { p, verdict } = await buyChecked(deps, v, slot, kind, attempt, body, pin, kind === "vessel" ? v.mmsi : v.portLocode, (a) => (kind === "vessel" ? checkVessel(a) : checkPort(a, v.portLocode)));
      attempt++;
      if (!p.ok) {
        if (isEscrowRefusal(p.refusal)) { const budget = /insufficient escrow/i.test(p.refusal!); if (budget) await deps.store.setStatus(v.id, "BUDGET_SPENT", p.refusal!); return { ...out, held: budget ? "BUDGET_SPENT" : "NODE_REFUSED", message: p.refusal!, facts: [...out.facts] }; }
        const op = minerInfo(String(p.body?.miner_id ?? pin ?? "")).operator; if (pin) triedOperators.add(op);
        continue; // a provider error: re-buy from another operator
      }
      out.purchases++; out.spentUusdc += BigInt(p.receipt?.amount_uusdc ?? "0");
      const verdict2 = verdict!; verdicts.push(verdict2); triedOperators.add(verdict2.miner.operator);
      corroboration = kind === "vessel" ? corroborateVessel(verdicts as Verdict<VesselFact>[], own) : corroboratePort(verdicts as Verdict<PortFact>[], own);
      if (corroboration.status === "CORROBORATED" || corroboration.status === "REVIEW") break;
    }
    v.lastBought[kind] = nowMin;
    out.facts.push({ kind, corroboration, verdicts: verdicts.length });
  }
  return out;
}

export class MemoryStore implements Store {
  leases = new Set<string>(); rows: PurchaseRow[] = []; statuses: { id: string; status: string; reason: string }[] = [];
  async tryLease(id: string, slot: number) { const k = `${id}:${slot}`; if (this.leases.has(k)) return false; this.leases.add(k); return true; }
  async append(r: PurchaseRow) { this.rows.push(Object.freeze({ ...r })); }
  async stats(): Promise<Stats> { const s: Stats = {}; for (const r of this.rows) if (r.minerId && r.verdictOk !== null) { s[r.minerId] ??= { pass: 0, total: 0 }; s[r.minerId].total++; if (r.verdictOk) s[r.minerId].pass++; } return s; }
  async setStatus(id: string, status: string, reason: string) { this.statuses.push({ id, status, reason }); }
}
