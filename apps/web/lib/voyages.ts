import { q } from "./db";
import { NODE, voyageAccount } from "./clients";
import { checkVessel, corroborateVessel, minerInfo, GEOMETRY_VERSION, GEOMETRY_SHA256, type Answer, type Verdict, type VesselFact } from "../../../packages/evidence/src/index.ts";
import { buildStatement, hashCanonical, type SignedStatement, type ReceiptRow } from "../../../packages/statement/src/index.ts";
import type { Terms, SofEvent, Fact, Resolution } from "../../../packages/laytime/src/index.ts";

export type VoyageRow = { id: string; vessel: string; mmsi: string | null; imo: number | null; port_locode: string; port_query: string | null; voyage_index: number; voyage_address: string; funder_address: string | null; cap_uusdc: string; terms: any; terms_hash: string; status: string; created_at: string; sof: SofEvent[]; resolutions: Record<string, Resolution>; label: string | null; house: boolean };
export type PurchaseDb = { id: number; voyage_id: string; slot: string; kind: string; attempt: number; pinned: boolean; miner_id: string | null; status: number; refusal: string | null; receipt_hash: string | null; epoch_id: number | null; signal_hash: string | null; cost_uusdc: string; ms: number | null; asked_at: string; verdict_ok: boolean | null; refusals: string[]; result: any; requested: string | null; signal_created_at: string | null; auth_valid_after: string | null; auth_valid_before: string | null };

export const revive = (t: any): Terms => ({ ...t, demurrageUusdcPerDay: BigInt(t.demurrageUusdcPerDay), despatchUusdcPerDay: BigInt(t.despatchUusdcPerDay) });
export const listVoyages = () => q<VoyageRow>("select * from voyages order by created_at desc");
export async function getVoyage(id: string) { return (await q<VoyageRow>("select * from voyages where id=$1", [id]))[0] ?? null; }
export const purchasesOf = (id: string) => q<PurchaseDb>("select * from purchases where voyage_id=$1 order by asked_at, id", [id]);
export const allPurchases = (limit = 500) => q<PurchaseDb>("select * from purchases order by asked_at desc, id desc limit $1", [limit]);

export const toAnswer = (p: PurchaseDb): Answer => ({ minerId: String(p.miner_id ?? ""), intent: p.kind === "vessel" ? "VESSEL_TELEMETRY_VERIFY_GENERAL" : "LIVE_PORT_CONGESTION_GENERAL", requested: p.requested ?? "", result: p.result, resultShape: "intent",
  signalCreatedAt: p.signal_created_at ? new Date(p.signal_created_at).toISOString() : null, auth: p.auth_valid_after ? { validAfter: Number(p.auth_valid_after), validBefore: Number(p.auth_valid_before) } : null, receiptHash: p.receipt_hash, epochId: p.epoch_id });

/** Facts for the engine: one ZONE fact per slot when two operators corroborate; disagreement is kept as REVIEW. */
export function factsFrom(rows: PurchaseDb[]): { facts: Fact[]; cors: { slot: string; status: string; independence: string | null; operators: number; families: string[]; note: string }[] } {
  const facts: Fact[] = []; const cors: any[] = [];
  const slots = [...new Set(rows.filter((r) => r.kind === "vessel" && r.status === 200).map((r) => r.slot))];
  for (const slot of slots) {
    const vs = rows.filter((r) => r.slot === slot && r.kind === "vessel" && r.status === 200).map((r) => checkVessel(toAnswer(r)));
    const c = corroborateVessel(vs as Verdict<VesselFact>[]);
    cors.push({ slot, status: c.status, independence: c.independence, operators: c.operators.length, families: c.families, note: c.note });
    if (c.status === "INSUFFICIENT") continue;
    const at = Math.floor(Math.min(...vs.filter((v) => v.ok).map((v) => v.value!.observedAtMs)) / 60000);
    if (Number.isFinite(at) && c.value) facts.push({ kind: "ZONE", at, value: c.value.zone, receipts: c.receipts, status: c.status === "CORROBORATED" ? "CORROBORATED" : "REVIEW" });
  }
  return { facts, cors };
}

async function signalBody(hash: string) {
  const hit = await q("select body from signals where hash=$1", [hash]); if (hit[0]) return hit[0].body;
  const r = await fetch(`${NODE}/engine/v1/signal/${hash}`, { signal: AbortSignal.timeout(20_000) }); if (!r.ok) return null;
  const body = await r.json(); await q("insert into signals (hash, body) values ($1,$2) on conflict do nothing", [hash, JSON.stringify(body)]); return body;
}

export async function statementFor(v: VoyageRow): Promise<SignedStatement> {
  const rows = await purchasesOf(v.id); const { facts } = factsFrom(rows);
  const receipts: ReceiptRow[] = [];
  for (const r of rows.filter((x) => x.receipt_hash && x.signal_hash)) {
    const m = minerInfo(String(r.miner_id)); const sig = await signalBody(r.signal_hash!);
    receipts.push({ receiptHash: r.receipt_hash!, signalHash: r.signal_hash!, epochId: r.epoch_id, minerId: String(r.miner_id), operator: m.operator, family: m.family, intent: r.kind === "vessel" ? "VESSEL_TELEMETRY_VERIFY_GENERAL" : "LIVE_PORT_CONGESTION_GENERAL", costUusdc: String(r.cost_uusdc), askedAt: new Date(r.asked_at).toISOString(), ours: false, signal: sig ?? undefined });
  }
  const dm = v.terms; const terms = revive(dm);
  return buildStatement({ voyage: { vessel: v.vessel, imo: v.imo ?? undefined, mmsi: v.mmsi ? Number(v.mmsi) : undefined, port: v.port_locode }, terms, sof: v.sof, facts, resolutions: v.resolutions, receipts,
    geometry: { version: GEOMETRY_VERSION, sha256: GEOMETRY_SHA256 },
    labels: { persona: "Mira Kallio is a fictional analyst", sof: v.house ? "The charter terms and Statement of Facts are illustrative. Receipts, signals, operators, positions and zones are real answers bought on Telegraph testnet." : "Terms and Statement of Facts are entered by the analyst. Receipts and signals are real answers bought on Telegraph testnet.", network: "Telegraph testnet, Ethereum Sepolia", note: `Zone geometry ${GEOMETRY_VERSION} (draft, derived from AIS). Position corroboration may share one upstream feed: see source families on each receipt.` } });
}

export async function createVoyage(i: { vessel: string; mmsi?: string; imo?: number; port: string; portQuery: string | null; funder?: string; capUusdc: bigint; terms: any; label?: string; house?: boolean }) {
  const idx = Number((await q("select coalesce(max(voyage_index), -1) + 1 as n from voyages"))[0].n);
  const id = `${(i.vessel || "vessel").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${i.port.toLowerCase()}-${idx}`;
  const addr = voyageAccount(idx).address; const th = hashCanonical(i.terms);
  await q("insert into voyages (id, vessel, mmsi, imo, port_locode, port_query, voyage_index, voyage_address, funder_address, cap_uusdc, terms, terms_hash, label, house, status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'AWAITING_FUNDS')",
    [id, i.vessel, i.mmsi ?? null, i.imo ?? null, i.port, i.portQuery, idx, addr, i.funder?.toLowerCase() ?? null, i.capUusdc.toString(), JSON.stringify(i.terms), th, i.label ?? null, !!i.house]);
  return { id, voyageAddress: addr, voyageIndex: idx, termsHash: th };
}

export async function ledgerOf(address: string) { try { const r = await fetch(`${NODE}/v1/ledger/account/${address.toLowerCase()}`, { signal: AbortSignal.timeout(15_000) }); return r.ok ? await r.json() : null; } catch { return null; } }
