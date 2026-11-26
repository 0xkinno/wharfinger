// Evaluation material for LIVE_PORT_CONGESTION_GENERAL. Asks every other miner serving the intent about three Finnish ports and labels each
// answer on identity and completeness: GOOD names the port asked about and fills every field; BAD names another port (Kotka answered as Hanko),
// leaves fields empty, or is not an answer at all. Values are not judged here (no independent truth for a queue length is claimed).
// Our own miner is excluded so it never grades itself. House key, $0.01 an answer. Output: evidence/eval/port_congestion_*.
import { mkdirSync, writeFileSync } from "node:fs";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnv } from "./lib/env.ts";
import { escrowClient } from "../packages/telegraph/src/index.ts";
loadEnv();
const tg = escrowClient(privateKeyToAccount(process.env.HOUSE_PRIVATE_KEY as `0x${string}`));
const PORTS: Record<string, { ask: string[]; ok: string[] }> = { Kotka: { ask: ["Kotka", "HaminaKotka"], ok: ["FIKTK", "FIHMN", "KOTKA", "HAMINAKOTKA", "HAMINA-KOTKA", "KOTKA-HAMINA"] }, Helsinki: { ask: ["Helsinki"], ok: ["FIHEL", "HELSINKI"] }, Turku: { ask: ["Turku"], ok: ["FITKU", "TURKU"] } };
const FIELDS = ["port", "vessels_waiting", "wait_hours", "congestion_level", "as_of"];
const miners: any = (await tg.miners("LIVE_PORT_CONGESTION_GENERAL")).json; const ids: string[] = (miners.miners ?? []).map((m: any) => String(m.id)).filter((i: string) => i !== "7310101");
const prompt = (p: string) => `What is the current queue of ships waiting at anchor at the port of ${p}, Finland? Answer with the port, the number of vessels waiting, their average wait in hours, a congestion level and the time of the reading.`;
const cases: any[] = [];
for (const [name, def] of Object.entries(PORTS)) for (const id of ids) {
  try {
    const p = await tg.ask({ intent: "LIVE_PORT_CONGESTION_GENERAL", params: { port: def.ask[0] } }, id);
    if (!p.ok || !p.receipt) { cases.push({ port: name, miner: id, label: "NO_ANSWER", status: p.status }); continue; }
    const r: any = p.body.result; const got = r && typeof r === "object" && !Array.isArray(r) ? String(r.port ?? "").toUpperCase() : "";
    const complete = r && typeof r === "object" && !Array.isArray(r) && FIELDS.every((f) => r[f] !== undefined && r[f] !== null);
    const label = complete && def.ok.includes(got) ? "GOOD" : "BAD"; const why = !complete ? "INCOMPLETE" : !def.ok.includes(got) ? "WRONG_PLACE" : "";
    cases.push({ port: name, miner: id, label, why, askedAt: p.askedAt, receipt: p.receipt.receipt_hash, result: r }); console.log(name, id, label, why, got);
  } catch (e: any) { console.log(name, id, "error", String(e.message).slice(0, 70)); }
}
mkdirSync("evidence/eval", { recursive: true }); writeFileSync("evidence/eval/port_congestion_cases.json", JSON.stringify(cases, null, 1) + "\n");
const lines: string[] = []; const used = new Set<string>();
for (const name of Object.keys(PORTS)) {
  const good = cases.filter((c) => c.port === name && c.label === "GOOD"); const seen = new Set<string>();
  for (const b of cases.filter((c) => c.port === name && c.label === "BAD" && c.result)) {
    const rej = JSON.stringify(b.result); const key = `${b.why}|${name}`; if (!good.length || rej.length > 4000 || used.has(rej) || seen.has(key)) continue; seen.add(key); used.add(rej);
    lines.push(JSON.stringify({ prompt: prompt(name), chosen: JSON.stringify(good[lines.length % good.length].result), rejected: rej }));
  }
}
writeFileSync("evidence/eval/port_congestion_upload.jsonl", lines.join("\n") + (lines.length ? "\n" : ""));
console.log("cases", cases.length, "good", cases.filter((c) => c.label === "GOOD").length, "bad", cases.filter((c) => c.label === "BAD").length, "pairs", lines.length);
