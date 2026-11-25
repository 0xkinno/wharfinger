import { q } from "@/lib/db";
import { PgStore } from "@/lib/pgstore";
import { voyageClient } from "@/lib/clients";
import { tick, type VoyageState } from "@pk/watch/src/index.ts";
import type { VoyageRow } from "@/lib/voyages";
export const dynamic = "force-dynamic"; export const maxDuration = 300;

export async function POST(req: Request) {
  if (!process.env.WATCH_TICK_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.WATCH_TICK_SECRET}`) return new Response("unauthorized", { status: 401 });
  const voyages = await q<VoyageRow>("select * from voyages where status = 'WATCHING' and house = false order by created_at");
  const store = new PgStore(); const results: any[] = [];
  for (const v of voyages) {
    const client = voyageClient(v.voyage_index);
    const last = await q("select kind, max(extract(epoch from asked_at)/60)::bigint as m from purchases where voyage_id=$1 and status=200 group by kind", [v.id]);
    const lastBought: any = Object.fromEntries(last.map((r: any) => [r.kind, Number(r.m)]));
    const lv = (await q("select result from purchases where voyage_id=$1 and kind='vessel' and verdict_ok order by asked_at desc limit 1", [v.id]))[0]?.result;
    const state: VoyageState = { id: v.id, status: "WATCHING", mmsi: v.mmsi ?? v.vessel, portLocode: v.port_locode, portQuery: v.port_query, moored: !!lv && lv.speed_knots === 0, lastBought, ownOperators: [] };
    const out = await tick(state, { buy: (b, m) => client.ask(b, m), now: () => Date.now(), store,
      signalCreatedAt: async (h) => (await client.signal(h)).json?.signal?.created_at ?? null, available: async () => BigInt((await client.ledger()).json?.available ?? 0) });
    results.push({ voyage: v.id, skipped: out.skipped ?? null, held: out.held ?? null, purchases: out.purchases, spentUusdc: out.spentUusdc.toString(), facts: out.facts.map((f) => ({ kind: f.kind, status: f.corroboration?.status })) });
  }
  return Response.json({ at: new Date().toISOString(), voyages: results });
}
