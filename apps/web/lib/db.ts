import { neon } from "@neondatabase/serverless";
import { SCHEMA_SQL } from "./schema";
import { FIXTURE, PRELOADED_ID } from "./fixture";

export const hasDb = () => !!process.env.DATABASE_URL;
let _sql: ReturnType<typeof neon> | null = null;
export function sql() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set"); return (_sql ??= neon(process.env.DATABASE_URL)); }

/** Splits on semicolons that are not inside a $$ ... $$ body. */
export function splitSql(text: string): string[] {
  const out: string[] = []; let cur = ""; let inDollar = false;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("--")) continue;
    cur += line + "\n"; if ((line.match(/\$\$/g) ?? []).length % 2 === 1) inDollar = !inDollar;
    if (!inDollar && line.trimEnd().endsWith(";")) { out.push(cur.trim()); cur = ""; }
  }
  if (cur.trim()) out.push(cur.trim()); return out;
}
const version = () => { let h = 5381; for (let i = 0; i < SCHEMA_SQL.length; i++) h = ((h << 5) + h + SCHEMA_SQL.charCodeAt(i)) | 0; return `schema_${(h >>> 0).toString(16)}`; };

let ready: Promise<void> | null = null;
/** Applies the schema (idempotent) and imports the preloaded voyage into an empty database. Runs once per process. */
export function ensureReady() {
  return (ready ??= (async () => {
    const s = sql(); const v = version();
    let have = false; try { have = ((await s.query("select 1 from counters where name=$1", [v])) as any[]).length > 0; } catch { have = false; }
    if (!have) { for (const st of splitSql(SCHEMA_SQL)) await s.query(st); await s.query("insert into counters (name, value) values ($1, 1) on conflict do nothing", [v]); }
    const n = ((await s.query("select count(*)::int as n from voyages where id=$1", [PRELOADED_ID])) as any[])[0].n;
    if (!n) await importFixture();
  })().catch((e) => { ready = null; throw e; }));
}
async function importFixture() {
  const s = sql(); const v = FIXTURE.voyage;
  await s.query("insert into voyages (id, vessel, mmsi, imo, port_locode, port_query, voyage_index, voyage_address, funder_address, cap_uusdc, terms, terms_hash, status, sof, resolutions, label, house, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) on conflict do nothing",
    [v.id, v.vessel, v.mmsi, v.imo, v.port_locode, v.port_query, 1000000 + Math.floor(Math.random() * 1000), v.voyage_address, v.funder_address, v.cap_uusdc, JSON.stringify(v.terms), v.terms_hash, v.status, JSON.stringify(v.sof), JSON.stringify(v.resolutions), v.label, v.house, v.created_at]);
  for (const p of FIXTURE.purchases) await s.query(`insert into purchases (voyage_id, slot, kind, attempt, pinned, miner_id, status, refusal, receipt_hash, epoch_id, signal_hash, cost_uusdc, ms, asked_at, verdict_ok, refusals, result, requested, signal_created_at, auth_valid_after, auth_valid_before) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [p.voyage_id, p.slot, p.kind, p.attempt, p.pinned, p.miner_id, p.status, p.refusal, p.receipt_hash, p.epoch_id, p.signal_hash, p.cost_uusdc, p.ms, p.asked_at, p.verdict_ok, p.refusals, JSON.stringify(p.result), p.requested, p.signal_created_at, p.auth_valid_after, p.auth_valid_before]);
  for (const g of FIXTURE.signatures) await s.query("insert into signatures (voyage_id, role, statement_hash, address, signature, decision, disputed_lines, reason, statement) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [g.voyage_id, g.role, g.statement_hash, g.address, g.signature, g.decision, g.disputed_lines ?? [], g.reason, g.statement ? JSON.stringify(g.statement) : null]);
  for (const n of FIXTURE.notes) await s.query("insert into notes (voyage_id, author, body, receipts) values ($1,$2,$3,$4)", [n.voyage_id, n.author, n.body, n.receipts ?? []]);
  for (const g of FIXTURE.signals) await s.query("insert into signals (hash, body) values ($1,$2) on conflict do nothing", [g.hash, JSON.stringify(g.body)]);
}
export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> { await ensureReady(); return (await sql().query(text, params)) as T[]; }
