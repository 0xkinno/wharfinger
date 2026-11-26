// Buys the same vessel question from every miner that serves VESSEL_TELEMETRY_VERIFY_GENERAL and labels each answer against Digitraffic AIS,
// an independent public truth source, then writes preference pairs (chosen close to truth and fresh, rejected not). House key, about $0.01 an answer.
// Usage: NODE_USE_ENV_PROXY=1 pnpm exec tsx scripts/buy-eval-cases.ts [mmsi ...]   Output: evidence/eval/vessel_telemetry_cases.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnv } from "./lib/env.ts";
import { escrowClient } from "../packages/telegraph/src/index.ts";
import { aisLocation } from "../packages/truth/src/index.ts";
import { checkVessel, type Answer } from "../packages/evidence/src/index.ts";
loadEnv();
const house = privateKeyToAccount(process.env.HOUSE_PRIVATE_KEY as `0x${string}`); const tg = escrowClient(house);
const km = (a: number, b: number, c: number, d: number) => { const R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const mmsis = process.argv.slice(2).map(Number).filter(Boolean);
const miners: any = (await tg.miners("VESSEL_TELEMETRY_VERIFY_GENERAL")).json; const ids: string[] = (miners.miners ?? []).map((m: any) => String(m.id));
const F = "evidence/eval/vessel_telemetry_cases.json"; const cases: any[] = existsSync(F) ? JSON.parse(readFileSync(F, "utf8")) : [];
mkdirSync("evidence/eval", { recursive: true });
for (const mmsi of mmsis) {
  const truth = (await aisLocation(mmsi, { user: "wharfinger", archiveDir: "/tmp/dt" } as any)).positions[0]; if (!truth) { console.log(mmsi, "no AIS truth, skipped"); continue; }
  const truthAt = truth.atMs;
  for (const id of ids) {
    if (cases.some((c) => c.mmsi === mmsi && c.miner === id)) continue;
    try {
      const p = await tg.ask({ intent: "VESSEL_TELEMETRY_VERIFY_GENERAL", params: { vessel: String(mmsi) } }, id);
      if (!p.ok || !p.receipt) { cases.push({ mmsi, miner: id, status: p.status, refusal: p.refusal, label: "NO_ANSWER" }); continue; }
      const sig = (await tg.signal(p.body.signal_hash)).json?.signal;
      const a: Answer = { minerId: id, intent: "VESSEL_TELEMETRY_VERIFY_GENERAL", requested: String(mmsi), result: p.body.result, resultShape: p.body.result_shape ?? "intent", signalCreatedAt: sig?.created_at ?? null, auth: p.auth ? { validAfter: p.auth.validAfter, validBefore: p.auth.validBefore } : null, receiptHash: p.receipt.receipt_hash };
      const v = checkVessel(a); const r: any = p.body.result;
      const dist = typeof r?.latitude === "number" && typeof r?.longitude === "number" ? km(truth.lat, truth.lon, r.latitude, r.longitude) : null;
      const label = v.ok && dist !== null && dist <= 2 ? "GOOD" : "BAD";
      cases.push({ mmsi, miner: id, label, checks: v.refusals, distanceKm: dist === null ? null : Math.round(dist * 100) / 100, truth: { lat: truth.lat, lon: truth.lon, at: new Date(truthAt).toISOString(), source: "Digitraffic AIS" }, askedAt: p.askedAt, receipt: p.receipt.receipt_hash, result: p.body.result });
      console.log(mmsi, id, label, v.refusals.join(","), dist?.toFixed(2));
    } catch (e: any) { console.log(mmsi, id, "error", String(e.message).slice(0, 80)); }
    writeFileSync(F, JSON.stringify(cases, null, 1) + "\n");
  }
}
// pairs: each BAD answer against the GOOD answer for the same vessel nearest in time
const prompt = (v: number) => `Where is the vessel with MMSI ${v} right now? Answer with its latitude, longitude, speed in knots, course and the time the position was observed (UTC).`;
const lines: string[] = [], meta: any[] = [];
for (const m of new Set(cases.map((c) => c.mmsi))) {
  const good = cases.filter((c) => c.mmsi === m && c.label === "GOOD"), bad = cases.filter((c) => c.mmsi === m && c.label === "BAD" && c.result);
  for (const b of bad) { if (!good.length) break; const g = good.reduce((x, y) => (Math.abs(+new Date(y.askedAt) - +new Date(b.askedAt)) < Math.abs(+new Date(x.askedAt) - +new Date(b.askedAt)) ? y : x));
    lines.push(JSON.stringify({ prompt: prompt(m), chosen: JSON.stringify(g.result), rejected: JSON.stringify(b.result) })); meta.push({ mmsi: m, chosenMiner: g.miner, rejectedMiner: b.miner, rejectedWhy: b.checks, rejectedDistanceKm: b.distanceKm, truth: g.truth, chosenReceipt: g.receipt, rejectedReceipt: b.receipt }); }
}
writeFileSync("evidence/eval/vessel_telemetry_cases_pairs.jsonl", lines.join("\n") + "\n"); writeFileSync("evidence/eval/vessel_telemetry_cases_pairs.provenance.json", JSON.stringify(meta, null, 1) + "\n");
console.log("cases", cases.length, "good", cases.filter((c) => c.label === "GOOD").length, "bad", cases.filter((c) => c.label === "BAD").length, "pairs", lines.length);
