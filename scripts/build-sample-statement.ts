// Builds examples/statement.sample.json from the REAL answers bought in the Phase 1 probe (evidence/probe/paid).
// Real: the receipts, signals, operators, positions and the berth zone. Illustrative: the charter terms, the SOF and the
// persona. Both signatures come from throwaway testnet keys. Labelled as such inside the file.
import { readFileSync, writeFileSync } from "node:fs";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import { loadEnv } from "./lib/env.ts";
import { buildStatement, analystSign, ownerCountersign, type ReceiptRow } from "../packages/statement/src/index.ts";
import { checkVessel, corroborateVessel, minerInfo, GEOMETRY_VERSION, GEOMETRY_SHA256, type Answer } from "../packages/evidence/src/index.ts";
import { computeLaytime, type Terms, type SofEvent, type Fact } from "../packages/laytime/src/index.ts";

loadEnv();
const NODE = "https://devnode.telegraphprotocol.com";
const rows: any[] = JSON.parse(readFileSync("evidence/probe/paid/asks_matrix.json", "utf8")).filter((r: any) => r.status === 200 && r.intent === "VESSEL_TELEMETRY_VERIFY_GENERAL");
const toAnswer = (r: any): Answer => ({ minerId: String(r.miner_id), intent: r.intent, requested: String(r.params.vessel), result: r.result, resultShape: r.result_shape, signalCreatedAt: r.signal?.created_at ?? null, auth: r.auth, receiptHash: r.receipt?.receipt_hash ?? null, epochId: r.receipt?.epoch_id });
const verdicts = rows.map((r) => ({ r, v: checkVessel(toAnswer(r)) }));
const good = verdicts.filter((x) => x.v.ok);
const cor = corroborateVessel(good.map((x) => x.v));
if (cor.status !== "CORROBORATED") throw new Error(`probe answers did not corroborate: ${cor.status}`);

// receipts: every purchase in the probe (refused ones are listed too, never used by a fact)
const receipts: ReceiptRow[] = [];
for (const { r, v } of verdicts) {
  if (!r.receipt) continue;
  const sig = await (await fetch(`${NODE}/engine/v1/signal/${r.signal_hash}`)).json();
  const m = minerInfo(String(r.miner_id));
  receipts.push({ receiptHash: r.receipt.receipt_hash, signalHash: r.signal_hash, epochId: r.receipt.epoch_id, minerId: String(r.miner_id), operator: m.operator, family: m.family, intent: r.intent, costUusdc: r.receipt.amount_uusdc, askedAt: r.askedAt, ours: false, signal: sig });
}
const atMin = (iso: string) => Math.floor(Date.parse(iso) / 60000);
const usedReceipts = new Set(cor.receipts);
const factAt = Math.min(...good.map((x) => Math.floor(x.v.value!.observedAtMs / 60000)));
const facts: Fact[] = [{ kind: "ZONE", at: factAt, value: cor.value!.zone, receipts: cor.receipts, status: "CORROBORATED" }];
const terms: Terms = { laytimeMinutes: 36 * 60, turnTimeMinutes: 6 * 60, norRule: "PORT_LIMITS", weatherWorkingDays: true, shex: false, holidays: [], reversible: false, demurrageUusdcPerDay: 18_000_000_000n, despatchUusdcPerDay: 9_000_000_000n, onceOnDemurrage: true, tz: "Europe/Helsinki" };
const sof: SofEvent[] = [
  { kind: "NOR_TENDERED", at: atMin("2026-11-25T06:45:00Z"), line: 1, remark: "illustrative" },
  { kind: "LOADING_START", at: atMin("2026-11-25T12:45:00Z"), line: 2 },
  { kind: "LOADING_STOP", at: atMin("2026-11-25T14:00:00Z"), line: 3, remark: "loading stopped, snow" },
  { kind: "LOADING_RESUME", at: atMin("2026-11-25T18:00:00Z"), line: 4 },
  { kind: "COMPLETED", at: atMin("2026-11-27T06:45:00Z"), line: 5 },
];
const first = computeLaytime(terms, sof, facts, {});
const review = first.intervals.filter((i) => i.cls === "REVIEW");
const resolutions = Object.fromEntries(review.map((i) => [`${i.from}-${i.to}`, "COUNTS" as const])); // the analyst resolves conservatively: no weather receipt, so the hours count
let s = buildStatement({ voyage: { vessel: "Iceland", imo: 9341782, mmsi: 246546000, port: "FIKTK" }, terms, sof, facts, resolutions, receipts,
  geometry: { version: GEOMETRY_VERSION, sha256: GEOMETRY_SHA256 },
  labels: { persona: "Mira Kallio is a fictional analyst", sof: "The charter terms and the Statement of Facts are illustrative. The receipts, signals, operators, positions and the berth zone are real answers bought on Telegraph testnet on 2026-11-25.", network: "Telegraph testnet, Ethereum Sepolia", note: `Position corroborated by ${cor.operators.length} operators, independence: ${cor.independence} (families: ${cor.families.join(", ")}). Zone geometry ${GEOMETRY_VERSION}.` } });
s = await analystSign(s, privateKeyToAccount(process.env.PROBE_HOUSE_PRIVATE_KEY as `0x${string}`));
s = await ownerCountersign(s, mnemonicToAccount(process.env.PROBE_MNEMONIC!), "ACCEPT"); // owner persona: the probe voyage key
writeFileSync("examples/statement.sample.json", JSON.stringify(s, (_, v) => (typeof v === "bigint" ? v.toString() : v), 1));
console.log(`sample written: ${receipts.length} receipts, ${usedReceipts.size} used by the zone fact, review intervals resolved: ${review.length}, demurrage ${s.body.result.demurrageMinutes} min = ${s.body.result.amountUusdc} uUSDC`);
