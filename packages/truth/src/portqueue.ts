// Port queue provider logic for the Wharfinger miner (LIVE_PORT_CONGESTION_GENERAL). Pure functions plus one fetch-injected reader.
// Source: Fintraffic Digitraffic (CC BY 4.0): AIS locations and port calls. A vessel counts as waiting when its AIS status is "at anchor"
// (navStat 1) and it is within the port's anchorage radius. Its wait is the time since its planned arrival (ETA) on a port call that has
// no recorded arrival yet. The radius and centre are a labelled draft, not chart anchorage limits.
export type PortDef = { locode: string; name: string; lat: number; lon: number; radiusKm: number; aliases: string[] };
export const PORTS: PortDef[] = [
  { locode: "FIKTK", name: "Kotka-Hamina", lat: 60.4663, lon: 26.9458, radiusKm: 40, aliases: ["fiktk", "kotka", "haminakotka", "hamina kotka", "hamina-kotka", "port of kotka", "kotka finland", "kotka, finland", "fihmn", "hamina"] },
  { locode: "FIHEL", name: "Helsinki", lat: 60.1699, lon: 24.9384, radiusKm: 30, aliases: ["fihel", "helsinki", "port of helsinki", "helsinki finland", "helsinki, finland", "helsingfors"] },
  { locode: "FITKU", name: "Turku", lat: 60.4352, lon: 22.2266, radiusKm: 30, aliases: ["fitku", "turku", "port of turku", "turku finland", "turku, finland", "abo"] },
];
export const resolvePort = (q: string): PortDef | null => { const k = q.trim().toLowerCase().replace(/\s+/g, " "); return PORTS.find((p) => p.aliases.includes(k) || p.locode.toLowerCase() === k) ?? null; };

export type Level = "low" | "moderate" | "high" | "severe";
/** Stated thresholds: nothing waiting is low; otherwise the longer the mean wait and the more ships, the higher the level. */
export function congestionLevel(waiting: number, meanWaitHours: number): Level {
  if (waiting === 0) return "low";
  if (meanWaitHours >= 96 || waiting >= 10) return "severe";
  if (meanWaitHours >= 48 || waiting >= 6) return "high";
  if (meanWaitHours >= 12 || waiting >= 3) return "moderate";
  return "low";
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
export type QueueAnswer = { port: string; port_name: string; vessels_waiting: number; wait_hours: number; congestion_level: Level; as_of: string; vessels_at_berth: number; wait_known_for: number; method: string; sources: string[] };

export async function portQueue(p: PortDef, now: number, f: FetchLike = (u, i) => fetch(u, i)): Promise<QueueAnswer> {
  const H = { "Digitraffic-User": "wharfinger-miner", "accept-encoding": "gzip" };
  const base = "https://meri.digitraffic.fi/api";
  const [ais, calls] = await Promise.all([
    f(`${base}/ais/v1/locations?latitude=${p.lat}&longitude=${p.lon}&radius=${p.radiusKm}&from=${now - 30 * 60000}`, { headers: H, signal: AbortSignal.timeout(20000) }).then((r) => { if (!r.ok) throw new Error(`ais ${r.status}`); return r.json(); }),
    f(`${base}/port-call/v1/port-calls?locode=${p.locode}`, { headers: H, signal: AbortSignal.timeout(20000) }).then((r) => { if (!r.ok) throw new Error(`port calls ${r.status}`); return r.json(); }),
  ]) as [any, any];
  const anchored = (ais.features ?? []).filter((x: any) => x.properties?.navStat === 1 && (x.properties?.sog ?? 0) < 0.5 && now - (x.properties?.timestampExternal ?? 0) < 30 * 60000);
  const mmsis = new Set<number>(anchored.map((x: any) => x.mmsi ?? x.properties.mmsi));
  const pcs: any[] = calls.portCalls ?? []; const waits: number[] = [];
  for (const m of mmsis) {
    const pc = pcs.filter((c) => c.mmsi === m && !c.portAreaDetails?.some((a: any) => a.ata)).map((c) => Date.parse(c.portCallTimestamp ?? "") || Math.min(...(c.portAreaDetails ?? []).map((a: any) => Date.parse(a.eta ?? "")).filter(Number.isFinite)))
      .filter((t) => Number.isFinite(t) && t <= now);
    if (pc.length) waits.push((now - Math.min(...pc)) / 3_600_000);
  }
  const mean = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0;
  const berth = new Set<string>(); for (const c of pcs) if (c.portAreaDetails?.some((a: any) => a.ata && !a.atd)) berth.add(`${c.imoLloyds}:${c.vesselName}`);
  const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
  return { port: p.locode, port_name: p.name, vessels_waiting: mmsis.size, wait_hours: r6(mean), congestion_level: congestionLevel(mmsis.size, mean), as_of: new Date(now).toISOString(), vessels_at_berth: berth.size, wait_known_for: waits.length,
    method: `AIS status at anchor within ${p.radiusKm} km of the port centre (draft radius, not chart limits); wait is hours since planned arrival on a port call with no recorded arrival; wait is 0 when no waiting vessel has a matching port call`,
    sources: ["Fintraffic Digitraffic AIS locations (CC BY 4.0)", "Fintraffic Digitraffic port calls (CC BY 4.0)"] };
}
