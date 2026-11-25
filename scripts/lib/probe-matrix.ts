// The Phase 1 paid matrix. About 30 answers at 0.01 USDC. Every answer is stored raw under evidence/probe/paid/.
//  1. Voyage key (funded by someone else's depositUSDCFor) buys routed vessel answers for real vessels at berth.
//  2. House key buys the same vessel from one pinned miner per operator (a re-buy, never a first buy).
//  3. Routed port, weather and other intents.
// Truth for position comes from Digitraffic AIS, fetched around each answer.
import { type LocalAccount } from "viem/accounts";
import { writeFileSync } from "node:fs";
import { escrowClient, NODE, type Purchase } from "./telegraph.ts";

const UA = process.env.DIGITRAFFIC_USER ?? "wharfinger-probe/0.1";
const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const haversineM = (a: [number, number], b: [number, number]) => {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
async function truth(mmsi: number) {
  try {
    const r = await fetch(`https://meri.digitraffic.fi/api/ais/v1/locations?mmsi=${mmsi}`, { headers: { "Digitraffic-User": UA, "Accept-Encoding": "gzip" } });
    const j: any = await r.json(); const f = j.features?.[0]; if (!f) return null;
    return { lat: f.geometry.coordinates[1] as number, lon: f.geometry.coordinates[0] as number, sog: f.properties.sog as number, ts: f.properties.timestampExternal as number };
  } catch { return null; }
}
const getJson = async (p: string) => (await fetch(NODE + p)).json() as Promise<any>;

// Vessels at berth in HaminaKotka (KTK), Helsinki (HEL) on 2026-11-25, from evidence/probe/dt_portcalls_*.json
const VESSELS = [
  { name: "Iceland", mmsi: 246546000, port: "Kotka" }, { name: "Ankie", mmsi: 244554000, port: "Kotka" },
  { name: "Venta Maersk", mmsi: 219115000, port: "Kotka" }, { name: "Elbwater", mmsi: 210359000, port: "Helsinki" },
];

export async function runMatrix(ctx: { house: LocalAccount; voyage: LocalAccount; OUT: string; log: (n: string, d: unknown) => void }) {
  const house = escrowClient(ctx.house), voyage = escrowClient(ctx.voyage);
  const rows: any[] = [];
  const record = async (label: string, who: "house" | "voyage", client: ReturnType<typeof escrowClient>, intent: string, params: any, minerId?: string, extra: any = {}) => {
    const tBefore = extra.mmsi ? await truth(extra.mmsi) : null;
    let p: Purchase;
    try { p = await client.ask({ intent, params }, minerId); } catch (e: any) { rows.push({ label, who, intent, params, minerId, error: String(e.message) }); console.log(label, "ERROR", e.message); return; }
    const tAfter = extra.mmsi ? await truth(extra.mmsi) : null;
    const b = p.body ?? {};
    const sig = b.signal_hash ? await client.signal(b.signal_hash) : null;
    const res = b.result ?? {};
    const row: any = { label, who, wallet: client.address, intent, params, pinnedMiner: minerId ?? null, status: p.status, ms: p.ms, askedAt: p.askedAt,
      miner_id: b.miner_id, miner_name: b.miner_name, served_rank: b.served_rank, delivery: b.delivery, cost_usd: b.cost_usd, duration_ms: b.duration_ms,
      result_shape: b.result_shape, field_status: b.field_status, result: res, signal_hash: b.signal_hash, receipt: p.receipt, auth: p.auth,
      refusal: p.ok ? null : (b.reason ?? b.error ?? b),
      signal: sig ? { status: sig.status, created_at: sig.json?.signal?.created_at, wallet: sig.json?.signal?.wallet_address, miner_slug: sig.json?.signal?.miner_slug,
        verified: sig.json?.verification?.verified, walletIsOurs: String(sig.json?.signal?.wallet_address).toLowerCase() === client.address.toLowerCase() } : null };
    if (extra.mmsi && res.latitude != null && res.longitude != null) {
      const ref = tAfter ?? tBefore;
      row.truth = { before: tBefore, after: tAfter };
      if (ref) row.distance_to_truth_m = Math.round(haversineM([Number(res.latitude), Number(res.longitude)], [ref.lat, ref.lon]));
      const obs = Date.parse(String(res.observed_at ?? ""));
      const created = Date.parse(String(row.signal?.created_at ?? ""));
      if (!Number.isNaN(obs) && !Number.isNaN(created)) row.observed_age_s = Math.round((created - obs) / 1000);
    }
    rows.push(row);
    console.log(`${label.padEnd(44)} ${p.status} miner=${b.miner_id ?? "-"} ${JSON.stringify(res).slice(0, 110)}${row.distance_to_truth_m != null ? ` d=${row.distance_to_truth_m}m age=${row.observed_age_s}s` : ""}`);
    ctx.log("asks_matrix", rows); // checkpoint after every answer
  };

  // 1. voyage key, routed, real vessels
  for (const v of VESSELS) await record(`routed vessel ${v.name} (voyage key)`, "voyage", voyage, "VESSEL_TELEMETRY_VERIFY_GENERAL", { vessel: String(v.mmsi) }, undefined, { mmsi: v.mmsi });
  // 2. house key, pinned per operator, same vessel (Iceland at Kotka)
  const miners = (await getJson("/engine/v1/intents/VESSEL_TELEMETRY_VERIFY_GENERAL/miners")).miners as any[];
  const bySlug = new Map(miners.map((m) => [m.slug, m.id]));
  const pins = ["ves-digit-ves", "ves-digit-loc", "ves-digit-radius", "vesselwire-vessel-telemetry-verify", "zk-vessel-v2", "txlens", "quay-ais", "ves-adsb-hel", "ves-digitraffic", "a1-preflight", "chainsight-oracle"];
  for (const slug of pins) { const id = bySlug.get(slug); if (!id) { rows.push({ label: `pinned ${slug}`, skipped: "not listed for this intent" }); continue; }
    await record(`pinned vessel ${slug} -> Iceland`, "house", house, "VESSEL_TELEMETRY_VERIFY_GENERAL", { vessel: "246546000" }, id, { mmsi: 246546000 }); }
  // 3. port, weather, others (routed)
  for (const port of ["Kotka", "HaminaKotka", "Helsinki", "Turku"]) await record(`routed port ${port}`, "house", house, "LIVE_PORT_CONGESTION_GENERAL", { port });
  const portMiners = (await getJson("/engine/v1/intents/LIVE_PORT_CONGESTION_GENERAL/miners")).miners as any[];
  for (const slug of ["quay-ais", "txlens", "port-digit-loc"]) { const m = portMiners.find((x) => x.slug === slug); if (m) await record(`pinned port ${slug} -> Kotka`, "house", house, "LIVE_PORT_CONGESTION_GENERAL", { port: "Kotka" }, m.id); }
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  for (const loc of ["Kotka", "Kotka, Finland"]) await record(`routed weather verify ${loc} ${yesterday}`, "house", house, "WEATHER_FORECAST_VERIFY_GENERAL", { location: loc, date: yesterday });
  await record("routed weather forecast Kotka 1h", "house", house, "WEATHER_FORECAST_GENERAL", { location: "Kotka, Finland", window_hours: 1 });
  await record("routed FX_NOW_EUR", "house", house, "FX_NOW_EUR", { currency: "EUR" });
  await record("routed sanctions screening (vessel name)", "house", house, "SANCTIONS_SCREENING_MATCH_GENERAL", { name: "Iceland" });
  await record("routed document authenticity (text)", "house", house, "DOCUMENT_AUTHENTICITY_GENERAL", { document: "Statement of Facts, MV Example, NOR tendered 0240 local" });
  ctx.log("asks_matrix", rows);
  writeFileSync(`${ctx.OUT}/asks_summary.txt`, rows.map((r) => `${r.label}\t${r.status ?? r.error ?? r.skipped}\t${r.miner_id ?? ""}\t${r.distance_to_truth_m ?? ""}\t${r.observed_age_s ?? ""}`).join("\n"));
  console.log(`done: ${rows.length} rows in ${ctx.OUT}/asks_matrix.json`);
}
