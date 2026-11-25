// Page-level reads. Database when configured, committed fixtures otherwise, so a public deployment is useful before any secret is set.
import { q, hasDb } from "./db";
import { FIXTURE } from "./fixture";
import type { VoyageRow, PurchaseDb } from "./voyages";

export const staticMode = () => !hasDb();
export async function voyages(includeHouse = false): Promise<VoyageRow[]> {
  if (staticMode()) return [FIXTURE.voyage];
  return q<VoyageRow>(`select * from voyages ${includeHouse ? "" : "where house=false"} order by created_at desc`);
}
export async function purchases(limit = 500): Promise<PurchaseDb[]> {
  if (staticMode()) return [...FIXTURE.purchases].reverse().slice(0, limit);
  return q<PurchaseDb>("select * from purchases order by asked_at desc, id desc limit $1", [limit]);
}
export async function summary() {
  const rows = await purchases(5000); const paid = rows.filter((r) => r.receipt_hash);
  return { voyages: (await voyages()).length, paid: paid.length, refused: rows.filter((r) => r.verdict_ok === false).length, spent: paid.reduce((a, r) => a + BigInt(r.cost_uusdc), 0n).toString(), rows, paidRows: paid };
}
export async function counters(): Promise<{ name: string; value: string; updated_at: string }[]> {
  if (staticMode()) return [];
  return q("select * from counters where name not like 'schema_%' order by name");
}
export async function recentSlots() {
  if (staticMode()) { const m = new Map<string, any>(); for (const p of FIXTURE.purchases as PurchaseDb[]) { const k = `${p.voyage_id}:${p.slot}`; const e = m.get(k) ?? { voyage_id: p.voyage_id, slot: p.slot, n: 0, at: p.asked_at, spent: 0n, refused: 0 }; e.n++; e.spent += BigInt(p.cost_uusdc); if (p.verdict_ok === false) e.refused++; m.set(k, e); } return [...m.values()].map((e) => ({ ...e, spent: e.spent.toString() })); }
  return q("select voyage_id, slot, count(*)::int as n, min(asked_at) as at, sum(cost_uusdc)::text as spent, count(*) filter (where verdict_ok=false)::int as refused from purchases group by voyage_id, slot order by min(asked_at) desc limit 50");
}
export async function judgeSpentToday(): Promise<string> {
  if (staticMode()) return "0";
  return (await q("select coalesce(sum(cost_uusdc),0)::text as s from purchases where voyage_id like 'judge-%' and asked_at > now() - interval '1 day'"))[0].s;
}
