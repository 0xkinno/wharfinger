import { q, hasDb } from "@/lib/db";
import { FIXTURE } from "@/lib/fixture";
import { checkVessel, corroborateVessel, type Verdict, type VesselFact } from "@pk/evidence/src/index.ts";
import { computeLaytime } from "@pk/laytime/src/index.ts";
import { toAnswer, revive, type PurchaseDb } from "@/lib/voyages";
export const dynamic = "force-dynamic";
// Failure buttons. Each runs the real evidence and engine code on real answers saved in the database, with one named change.
export async function GET(req: Request) {
  const mode = new URL(req.url).searchParams.get("mode") ?? "";
  const rows: PurchaseDb[] = (hasDb() ? await q<PurchaseDb>("select p.* from purchases p join voyages v on v.id=p.voyage_id where v.label like 'Preloaded%' and p.kind='vessel' and p.status=200 and p.verdict_ok order by p.asked_at limit 12") : (FIXTURE.purchases as PurchaseDb[]).filter((p) => p.kind === "vessel" && p.status === 200 && p.verdict_ok)).slice(0, 12);
  if (rows.length < 2) return Response.json({ error: "no saved real answers to mutate" }, { status: 409 });
  const a = rows[0], b = rows.find((r) => r.miner_id !== a.miner_id && minerOp(r) !== minerOp(a)) ?? rows[1];
  const base = (r: PurchaseDb) => ({ ...toAnswer(r), result: { ...r.result } });
  if (mode === "wrong_place") { const x = base(a); x.result.latitude = x.result.longitude; const v = checkVessel(x); return Response.json({ mode, change: "latitude set equal to longitude, as a real miner returned on 2026-11-25", refusals: v.refusals, ok: v.ok, outcome: "refused WRONG_PLACE and the watcher re-buys from another operator" }); }
  if (mode === "stale") { const x = base(a); x.result.observed_at = new Date(Date.parse(x.signalCreatedAt!) - 25 * 3600_000).toISOString(); const v = checkVessel(x); return Response.json({ mode, change: "observed_at moved back 25 hours, as a real miner returned", refusals: v.refusals, ageSec: v.ageSec, outcome: "refused STALE: it cannot move an hour" }); }
  if (mode === "disagree") { const x = base(a), y = base(b); const vx = checkVessel(x), vy = checkVessel(y); const moved: Verdict<VesselFact> = { ...vy, value: { ...vy.value!, zone: "OUTSIDE" } }; const c = corroborateVessel([vx as Verdict<VesselFact>, moved]);
    return Response.json({ mode, change: "the second operator reports the ship outside port", status: c.status, refusal: c.refusal, note: c.note, outcome: "REVIEW: money does not move until the analyst resolves" }); }
  if (mode === "obedient") { const v: any = hasDb() ? (await q("select * from voyages where label like 'Preloaded%' limit 1"))[0] : FIXTURE.voyage; const terms = revive(v.terms); const sof = (v.sof as any[]).filter((e) => e.kind !== "LOADING_STOP" && e.kind !== "LOADING_RESUME");
    const t0 = sof.find((e) => e.kind === "NOR_TENDERED").at; const withStop = [...sof, { kind: "LOADING_STOP", at: t0 + 2000, line: 90, remark: "loading stopped, snow (inserted by a model that was told the user is always right)" }, { kind: "LOADING_RESUME", at: t0 + 2240, line: 91 }];
    const r = computeLaytime(terms, withStop, [], {}); return Response.json({ mode, change: "a weather stop is inserted with no receipt", exceptedMinutes: r.exceptedMinutes, reviewMinutes: r.reviewMinutes, outcome: "no receipt, no deduction: the hours are REVIEW, never EXCEPTED" }); }
  if (mode === "drain") { const d: any = hasDb() ? (await q("select count(*)::int as n, count(*) filter (where status=200)::int as paid, max(refusal) filter (where status=402) as refusal from purchases where voyage_id like 'drain-test-%'"))[0] : (FIXTURE.drain ? { n: FIXTURE.drain.purchases, paid: FIXTURE.drain.paid, refusal: FIXTURE.drain.nodeRefusal } : { n: 0 });
    return Response.json({ mode, change: "a voyage key funded with only 0.05 USDC (50000 uUSDC) keeps buying", recorded: d.n ? { purchases: d.n, paid: d.paid, nodeRefusal: d.refusal } : null, outcome: d.n ? `${d.paid} paid answers, then the node's own refusal at the next purchase; the watcher held and used no other key` : "the recorded drain run is not in the database yet (database not configured on this deployment)" }); }
  return Response.json({ error: "mode must be wrong_place, stale, disagree, obedient or drain" }, { status: 400 });
}
import { minerInfo } from "@pk/evidence/src/index.ts";
const minerOp = (r: PurchaseDb) => minerInfo(String(r.miner_id)).operator;
