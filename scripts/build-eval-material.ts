// Builds Anjoman Evaluate material (preference pairs: prompt, chosen, rejected) for VESSEL_TELEMETRY_VERIFY_GENERAL from real purchases.
// chosen: an answer that passed Wharfinger's place, time, vessel and range checks. rejected: an answer for the same vessel that failed them
// (stale, wrong place, wrong vessel, no reading). Read-only against the database. Output: evidence/eval/vessel_telemetry_pairs.jsonl
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const { q } = await import("../apps/web/lib/db.ts");
const rows: any[] = await q("select voyage_id, requested, miner_id, verdict_ok, refusals, result, asked_at, signal_hash, receipt_hash from purchases where kind='vessel' and status=200 and result is not null and requested is not null order by asked_at", []);
const prompt = (v: string) => `Where is the vessel with MMSI ${v} right now? Answer with its latitude, longitude, speed in knots, course and the time the position was observed (UTC).`;
const show = (r: any) => JSON.stringify(r.result);
const byVessel = new Map<string, { good: any[]; bad: any[] }>();
for (const r of rows) { const e = byVessel.get(r.requested) ?? { good: [], bad: [] }; (r.verdict_ok ? e.good : e.bad).push(r); byVessel.set(r.requested, e); }
const out: string[] = []; const seen = new Set<string>(); const meta: any[] = [];
for (const [v, { good, bad }] of byVessel) {
  if (!good.length) continue;
  for (const b of bad) {
    const key = `${v}|${show(b)}`; if (seen.has(key)) continue; seen.add(key);
    const g = good.reduce((best, x) => (Math.abs(+new Date(x.asked_at) - +new Date(b.asked_at)) < Math.abs(+new Date(best.asked_at) - +new Date(b.asked_at)) ? x : best));
    out.push(JSON.stringify({ prompt: prompt(v), chosen: show(g), rejected: show(b) }));
    meta.push({ mmsi: v, rejectedMiner: b.miner_id, rejectedWhy: b.refusals, rejectedReceipt: b.receipt_hash, chosenMiner: g.miner_id, chosenReceipt: g.receipt_hash });
  }
}
mkdirSync("evidence/eval", { recursive: true });
writeFileSync("evidence/eval/vessel_telemetry_pairs.jsonl", out.join("\n") + "\n");
writeFileSync("evidence/eval/vessel_telemetry_pairs.provenance.json", JSON.stringify(meta, null, 1) + "\n");
console.log("pairs", out.length, "vessels", byVessel.size, "reasons", JSON.stringify(meta.reduce((a, m) => { for (const w of m.rejectedWhy ?? []) a[w] = (a[w] ?? 0) + 1; return a; }, {} as any)));
