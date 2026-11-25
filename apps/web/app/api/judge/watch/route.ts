import { q } from "@/lib/db";
import { houseClient } from "@/lib/clients";
import { PgStore } from "@/lib/pgstore";
import { tick, type VoyageState } from "@pk/watch/src/index.ts";
import { missingEnv, notConfigured } from "@/lib/guard";
export const dynamic = "force-dynamic"; export const maxDuration = 120;
const DAILY_CEILING_UUSDC = 600_000n; // 0.60 USDC a day on the house key, visible on /judge
// Judge door: the house key (labelled, capped) buys the first answers for any MMSI the judge types.
export async function POST(req: Request) {
  { const m = missingEnv(["DATABASE_URL","HOUSE_PRIVATE_KEY"]); if (m.length) return notConfigured(m); }
  const b = await req.json().catch(() => ({})); const mmsi = String(b.mmsi ?? "").trim();
  if (!/^\d{9}$/.test(mmsi)) return Response.json({ error: "enter a nine digit MMSI" }, { status: 400 });
  const today = (await q("select coalesce(sum(cost_uusdc),0)::text as s from purchases where voyage_id like 'judge-%' and asked_at > now() - interval '1 day'"))[0].s;
  if (BigInt(today) >= DAILY_CEILING_UUSDC) return Response.json({ error: "the house key has reached its daily ceiling", spentTodayUusdc: today, ceilingUusdc: DAILY_CEILING_UUSDC.toString() }, { status: 429 });
  const id = `judge-${mmsi}-${Math.floor(Date.now() / 60000)}`;
  await q("insert into voyages (id, vessel, mmsi, port_locode, port_query, voyage_index, voyage_address, cap_uusdc, terms, terms_hash, status, label, house) select $1,$2,$2,'FIKTK',null,coalesce(max(voyage_index),-1)+1,'house',0,'{}','n/a','JUDGE','House key, labelled',true from voyages on conflict do nothing", [id, mmsi]);
  const client = houseClient(); const v: VoyageState = { id, status: "WATCHING", mmsi, portLocode: "FIKTK", portQuery: null, moored: false, lastBought: {}, ownOperators: [] };
  const out = await tick(v, { buy: (bd, m) => client.ask(bd, m), now: () => Date.now(), store: new PgStore(), signalCreatedAt: async (h) => (await client.signal(h)).json?.signal?.created_at ?? null, available: async () => BigInt((await client.ledger()).json?.available ?? 0) });
  const rows = await q("select miner_id, status, verdict_ok, refusals, receipt_hash, signal_hash, result, ms from purchases where voyage_id=$1 order by id", [id]);
  const f = out.facts.find((x) => x.kind === "vessel");
  return Response.json({ voyage: id, labelled: "bought with the house key, not the visitor's wallet", held: out.held ?? null, purchases: out.purchases, spentUusdc: out.spentUusdc.toString(), corroboration: f?.corroboration ?? null, rows });
}
