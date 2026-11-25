// Seeds the preloaded real voyage: MV Iceland at Kotka. The purchases are the real answers bought in the Phase 1 probe
// (evidence/probe/paid/asks_matrix.json), re-checked by the evidence rules. The charter terms and SOF are illustrative.
// Both signatures come from throwaway testnet keys. Idempotent: does nothing if the voyage exists.
import { readFileSync } from "node:fs";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const { q } = await import("../apps/web/lib/db.ts");
const { statementFor, toAnswer } = await import("../apps/web/lib/voyages.ts");
const { analystSign, ownerCountersign, verifyStatement } = await import("../packages/statement/src/index.ts");
const { checkVessel, checkPort } = await import("../packages/evidence/src/index.ts");

const ID = "iceland-fiktk-preloaded";
const exists = (await q("select 1 from voyages where id=$1", [ID])).length > 0;
if (exists && (await q("select 1 from signatures where voyage_id=$1", [ID])).length) { console.log("already seeded"); process.exit(0); }
const havePurchases = exists && Number((await q("select count(*)::int as n from purchases where voyage_id=$1", [ID]))[0].n) > 0; // a failed earlier run: purchases are append-only, so resume instead of redoing
const house = privateKeyToAccount(process.env.PROBE_HOUSE_PRIVATE_KEY as `0x${string}`); const owner = mnemonicToAccount(process.env.PROBE_MNEMONIC!);
const atMin = (iso: string) => Math.floor(Date.parse(iso) / 60000);
const terms = { laytimeMinutes: 36 * 60, turnTimeMinutes: 360, norRule: "PORT_LIMITS", weatherWorkingDays: true, shex: false, holidays: [], reversible: false, demurrageUusdcPerDay: "18000000000", despatchUusdcPerDay: "9000000000", onceOnDemurrage: true, tz: "Europe/Helsinki" };
const sof = [
  { kind: "NOR_TENDERED", at: atMin("2026-11-25T06:45:00Z"), line: 1, remark: "illustrative" }, { kind: "LOADING_START", at: atMin("2026-11-25T12:45:00Z"), line: 2 },
  { kind: "LOADING_STOP", at: atMin("2026-11-25T14:00:00Z"), line: 3, remark: "loading stopped, snow" }, { kind: "LOADING_RESUME", at: atMin("2026-11-25T18:00:00Z"), line: 4 }, { kind: "COMPLETED", at: atMin("2026-11-27T06:45:00Z"), line: 5 }];
if (!exists) await q("insert into voyages (id, vessel, mmsi, imo, port_locode, port_query, voyage_index, voyage_address, funder_address, cap_uusdc, terms, terms_hash, status, sof, resolutions, label, house) values ($1,'Iceland','246546000',9341782,'FIKTK',null,1000000,$2,$3,'200000',$4,'preloaded','SIGNED',$5,'{}','Preloaded real voyage: MV Iceland at Kotka. Real receipts and signals; illustrative terms and SOF',false)",
  [ID, owner.address.toLowerCase(), house.address.toLowerCase(), JSON.stringify(terms), JSON.stringify(sof)]);
const rows: any[] = JSON.parse(readFileSync("evidence/probe/paid/asks_matrix.json", "utf8"));
let n = 0;
for (const r of havePurchases ? [] : rows) {
  const kind = r.intent === "VESSEL_TELEMETRY_VERIFY_GENERAL" ? "vessel" : r.intent === "LIVE_PORT_CONGESTION_GENERAL" ? "port" : r.intent.startsWith("WEATHER") ? "weather" : null;
  if (!kind || r.skipped || r.error) continue;
  const slot = Math.floor(Date.parse(r.askedAt) / 60000 / 30);
  const a = { minerId: String(r.miner_id ?? r.pinnedMiner ?? ""), intent: r.intent, requested: String(r.params.vessel ?? r.params.port ?? r.params.location), result: r.result, resultShape: r.result_shape, signalCreatedAt: r.signal?.created_at ?? null, auth: r.auth, receiptHash: r.receipt?.receipt_hash ?? null, epochId: r.receipt?.epoch_id ?? null };
  const verdict = r.status === 200 ? (kind === "vessel" ? checkVessel(a) : kind === "port" ? checkPort(a, r.label.includes("Helsinki") ? "FIHEL" : r.label.includes("Turku") ? "FITKU" : "FIKTK") : null) : null;
  await q(`insert into purchases (voyage_id, slot, kind, attempt, pinned, miner_id, status, refusal, receipt_hash, epoch_id, signal_hash, cost_uusdc, ms, asked_at, verdict_ok, refusals, result, requested, signal_created_at, auth_valid_after, auth_valid_before) values ($1,$2,$3,0,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [ID, slot, kind, !!r.pinnedMiner, a.minerId || null, r.status, r.refusal ? JSON.stringify(r.refusal).slice(0, 300) : null, a.receiptHash, a.epochId, r.signal_hash ?? null, r.receipt?.amount_uusdc ?? 0, r.ms, r.askedAt, verdict ? verdict.ok : null, verdict ? verdict.refusals : [], JSON.stringify(r.result ?? null), a.requested, a.signalCreatedAt, r.auth?.validAfter ?? null, r.auth?.validBefore ?? null]); n++;
}
// resolve the one REVIEW interval conservatively, then sign
let v = (await q("select * from voyages where id=$1", [ID]))[0]; let st = await statementFor(v);
const rv = st.body.result.intervals.filter((i: any) => i.cls === "REVIEW");
if (rv.length) { await q("update voyages set resolutions=$2 where id=$1", [ID, JSON.stringify(Object.fromEntries(rv.map((i: any) => [`${i.from}-${i.to}`, "COUNTS"])))]); v = (await q("select * from voyages where id=$1", [ID]))[0]; st = await statementFor(v); }
st = await analystSign(st, house); st = await ownerCountersign(st, owner, "ACCEPT");
const ver = await verifyStatement(st); if (!ver.pass) throw new Error("seeded statement does not verify: " + ver.firstMismatch);
await q("insert into signatures (voyage_id, role, statement_hash, address, signature, statement) values ($1,'ANALYST',$2,$3,$4,$5)", [ID, st.statementHash, house.address.toLowerCase(), st.analyst!.signature, JSON.stringify({ ...st, analyst: undefined, countersign: undefined })]);
await q("insert into signatures (voyage_id, role, statement_hash, address, signature, decision, reason) values ($1,'OWNER',$2,$3,$4,'ACCEPT','')", [ID, st.statementHash, owner.address.toLowerCase(), st.countersign!.signature]);
await q("insert into notes (voyage_id, author, body) values ($1,$2,'No weather receipt for the snow stop, so the analyst resolved the hours as counting (conservative).')", [ID, house.address.toLowerCase()]);
console.log(`seeded ${ID}: ${n} purchases, statement ${st.statementHash.slice(0, 12)}..., ${st.body.result.demurrageMinutes} min demurrage, verifies: ${ver.pass}`);
