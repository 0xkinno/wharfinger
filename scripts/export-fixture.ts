// Exports the preloaded voyage (purchases, frozen statements, signatures, signals) from the database to
// apps/web/fixtures/preloaded.json. The app serves this when no database is configured and imports it into a fresh one.
import { writeFileSync } from "node:fs";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const { q } = await import("../apps/web/lib/db.ts");
const ID = "iceland-fiktk-preloaded";
const voyage = (await q("select * from voyages where id=$1", [ID]))[0];
const purchases = await q("select * from purchases where voyage_id=$1 order by id", [ID]);
const signatures = await q("select * from signatures where voyage_id=$1 order by id", [ID]);
const notes = await q("select * from notes where voyage_id=$1 order by id", [ID]);
const hashes = new Set(purchases.map((p: any) => p.signal_hash).filter(Boolean));
const signals = (await q("select hash, body from signals")).filter((s: any) => hashes.has(s.hash));
for (const r of [voyage, ...purchases, ...signatures, ...notes]) for (const k of ["created_at", "asked_at", "signal_created_at"]) if (r && r[k] instanceof Date) r[k] = r[k].toISOString();
const dr = await q("select count(*)::int as n, count(*) filter (where status=200)::int as paid, max(refusal) filter (where status=402) as refusal from purchases where voyage_id like 'drain-test-%'");
const drain = dr[0].n ? { purchases: dr[0].n, paid: dr[0].paid, nodeRefusal: dr[0].refusal } : null;
writeFileSync("apps/web/fixtures/preloaded.json", JSON.stringify({ drain, exportedAt: new Date().toISOString(), voyage, purchases, signatures, notes, signals }));
console.log(`exported voyage, ${purchases.length} purchases, ${signatures.length} signatures, ${signals.length} signals`);
