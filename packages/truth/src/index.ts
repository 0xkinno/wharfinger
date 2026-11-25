// Public-record readers used for truth, replay and evaluator pairs. Never a stand-in for a Telegraph purchase in the
// live flow: every screen that shows these says "public record, not bought on Telegraph".
// Responses are archived by sha256 so a replay can be re-run byte for byte.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
export type TruthOpts = { fetch?: FetchLike; archiveDir?: string; user?: string };
const UA = (o?: TruthOpts) => o?.user ?? process.env.DIGITRAFFIC_USER ?? "wharfinger/0.1 (github.com/0xkinno/wharfinger)";

/** GET a URL, archive the exact bytes under sha256, return parsed JSON and the hash. */
export async function getArchived(url: string, opts: TruthOpts = {}, headers: Record<string, string> = {}) {
  const f = opts.fetch ?? ((u, i) => fetch(u, i));
  const r = await f(url, { headers: { "Digitraffic-User": UA(opts), "Accept-Encoding": "gzip", ...headers }, signal: AbortSignal.timeout(45_000) });
  const text = await r.text();
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  const sha256 = createHash("sha256").update(text).digest("hex");
  if (opts.archiveDir) {
    mkdirSync(opts.archiveDir, { recursive: true });
    const file = join(opts.archiveDir, `${sha256}.json`);
    if (!existsSync(file)) writeFileSync(file, text);
    appendFileSync(join(opts.archiveDir, "index.ndjson"), JSON.stringify({ url, sha256, at: new Date().toISOString() }) + "\n");
  }
  return { json: JSON.parse(text), sha256, text };
}
export const readArchived = (dir: string, sha256: string) => JSON.parse(readFileSync(join(dir, `${sha256}.json`), "utf8"));

const DT = "https://meri.digitraffic.fi/api";
export type PortCallRow = { portCallId: number; locode: string; vessel: string; mmsi: number; imo: number; vesselTypeCode: number; area: string | null; berth: string | null; ataMs: number | null; atdMs: number | null; etaMs: number | null };
export function parsePortCalls(json: any): PortCallRow[] {
  const rows: PortCallRow[] = []; const ms = (s?: string) => (s ? Date.parse(s) : null);
  for (const pc of json.portCalls ?? []) for (const a of pc.portAreaDetails?.length ? pc.portAreaDetails : [{}]) rows.push({ portCallId: pc.portCallId, locode: pc.portToVisit, vessel: pc.vesselName, mmsi: pc.mmsi ?? 0, imo: pc.imoLloyds ?? 0, vesselTypeCode: pc.vesselTypeCode, area: a.portAreaName ?? null, berth: a.berthCode ?? null, ataMs: ms(a.ata), atdMs: ms(a.atd), etaMs: ms(a.eta) });
  return rows;
}
export const portCalls = async (locode: string, o?: TruthOpts) => { const r = await getArchived(`${DT}/port-call/v1/port-calls?locode=${locode}`, o); return { rows: parsePortCalls(r.json), sha256: r.sha256 }; };
/** Vessels in port at `nowMs`: arrival recorded, no departure, deduplicated, with the identifiers that are missing flagged. */
export function inPort(rows: PortCallRow[], nowMs: number) {
  const seen = new Map<string, PortCallRow & { hasMmsi: boolean }>();
  for (const r of rows) if (r.ataMs !== null && r.ataMs <= nowMs && r.atdMs === null) seen.set(`${r.imo}:${r.vessel}`, { ...r, hasMmsi: r.mmsi > 0 });
  return [...seen.values()];
}
export type AisPosition = { mmsi: number; lat: number; lon: number; sogKn: number; cog: number; navStat: number; atMs: number };
export function parseAis(json: any): AisPosition[] {
  return (json.features ?? []).map((f: any) => ({ mmsi: f.mmsi ?? f.properties?.mmsi, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], sogKn: f.properties.sog, cog: f.properties.cog, navStat: f.properties.navStat, atMs: f.properties.timestampExternal }));
}
export const aisLocation = async (mmsi: number, o?: TruthOpts) => { const r = await getArchived(`${DT}/ais/v1/locations?mmsi=${mmsi}`, o); return { positions: parseAis(r.json), sha256: r.sha256 }; };

// Open-Meteo archive: a second, keyless weather source for the replay (daily precipitation).
export type DailyWeather = { date: string; precipMm: number | null; tMaxC: number | null; tMinC: number | null };
export function parseOpenMeteoDaily(json: any): DailyWeather[] {
  const d = json.daily; if (!d?.time) return [];
  return d.time.map((t: string, i: number) => ({ date: t, precipMm: d.precipitation_sum?.[i] ?? null, tMaxC: d.temperature_2m_max?.[i] ?? null, tMinC: d.temperature_2m_min?.[i] ?? null }));
}
export const openMeteoDaily = async (lat: number, lon: number, from: string, to: string, o?: TruthOpts) => {
  const r = await getArchived(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${from}&end_date=${to}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Europe%2FHelsinki`, o);
  return { days: parseOpenMeteoDaily(r.json), sha256: r.sha256 };
};
