import type { Store, PurchaseRow } from "../../../packages/watch/src/index.ts";
import type { Stats } from "../../../packages/evidence/src/index.ts";
import { q } from "./db";

export class PgStore implements Store {
  async tryLease(voyageId: string, slot: number) {
    const r = await q("insert into leases (voyage_id, slot) values ($1,$2) on conflict do nothing returning slot", [voyageId, slot]);
    return r.length === 1;
  }
  async append(r: PurchaseRow) {
    await q(`insert into purchases (voyage_id, slot, kind, attempt, pinned, miner_id, status, refusal, receipt_hash, epoch_id, signal_hash, cost_uusdc, ms, asked_at, verdict_ok, refusals, result, requested, signal_created_at, auth_valid_after, auth_valid_before)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [r.voyageId, r.slot, r.kind, r.attempt, r.pinned, r.minerId, r.status, r.refusal, r.receiptHash, r.epochId, r.signalHash, r.costUusdc, r.ms, r.askedAt, r.verdictOk, r.refusals, JSON.stringify(r.result ?? null), r.requested ?? null, r.signalCreatedAt ?? null, r.authValidAfter ?? null, r.authValidBefore ?? null]);
    await q("insert into counters (name, value) values ('purchases', 1) on conflict (name) do update set value = counters.value + 1, updated_at = now()");
    if (r.receiptHash) await q("insert into counters (name, value) values ('paid_answers', 1) on conflict (name) do update set value = counters.value + 1, updated_at = now()");
    if (r.verdictOk === false) await q("insert into counters (name, value) values ('refused_answers', 1) on conflict (name) do update set value = counters.value + 1, updated_at = now()");
  }
  async stats(): Promise<Stats> {
    const rows = await q("select miner_id, count(*)::int as total, count(*) filter (where verdict_ok)::int as pass from purchases where miner_id is not null and verdict_ok is not null group by miner_id");
    return Object.fromEntries(rows.map((r: any) => [r.miner_id, { pass: r.pass, total: r.total }]));
  }
  async setStatus(id: string, status: string, reason: string) { await q("update voyages set status=$2 where id=$1", [id, status]); await q("insert into counters (name, value) values ($1, 1) on conflict (name) do update set value = counters.value + 1, updated_at = now()", [`status_${status.toLowerCase()}`]); void reason; }
}
