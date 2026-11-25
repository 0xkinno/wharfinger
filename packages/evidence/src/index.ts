// Evidence rules: may a bought answer move an hour? Pure functions, no network.
// Every refusal is kept with a code. Built from the failures seen in the Phase 1 probe (PLATFORM_PROBE.md F15 to F19).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ops from "./operators.json" with { type: "json" };

export type Refusal = "STALE" | "WRONG_PLACE" | "WRONG_VESSEL" | "NO_READING" | "OUT_OF_RANGE" | "DISAGREE" | "NODE_REFUSED" | "BUDGET_SPENT" | "CLOCK_OUTSIDE_WINDOW" | "UNPARSEABLE_TIME";
export const FRESHNESS_SEC = { vessel: 20 * 60, port: 2 * 3600, conditions: 90 * 60 } as const; // build instruction 6.2; tuned from probe: fresh answers were 86 to 161 s old
export const SPEED_TOL_KN = 0.5;
export const WAIT_TOL = { relative: 0.25, absoluteHours: 2 };
// Plausible region for ships Wharfinger watches (Gulf of Finland, Archipelago Sea). A position outside it for a vessel
// asked about in a Finnish port is a wrong place, not a far-away ship.
export const REGION = { lat: [58.5, 61.5], lon: [19.0, 31.0] } as const;

export type MinerInfo = { slug: string; operator: string; family: string; familyBasis: string; intents: string[] };
export const MINERS = (ops as { miners: Record<string, MinerInfo> }).miners;
export const minerInfo = (id: string): MinerInfo => MINERS[id] ?? { slug: `unlisted-${id}`, operator: `unknown-operator-${id}`, family: `unknown:${id}`, familyBasis: "not in the operator map", intents: [] };

// ---- time ----
/** Parses the three observed_at shapes seen live: ISO, "YYYY-MM-DD HH:MM UTC", epoch milliseconds (number or string). */
export function parseObservedAt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" || (typeof v === "string" && /^\d{10,13}$/.test(v.trim()))) {
    const n = Number(v); if (!Number.isFinite(n)) return null;
    const ms = n > 1e12 ? n : n * 1000; return Number.isNaN(new Date(ms).getTime()) ? null : ms;
  }
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) UTC$/, "$1T$2:00Z");
  const t = Date.parse(s); return Number.isNaN(t) ? null : t;
}

// ---- geometry ----
type Feature = { properties: { port: string; zone: string; name: string; basis: string }; geometry: { coordinates: number[][][] } };
const GEO = JSON.parse(readFileSync(new URL("../ports/finland.geojson", import.meta.url), "utf8")) as { wharfingerGeometryVersion: string; features: Feature[] };
export const GEOMETRY_VERSION = GEO.wharfingerGeometryVersion;
export const GEOMETRY_SHA256 = createHash("sha256").update(readFileSync(new URL("../ports/finland.geojson", import.meta.url))).digest("hex");
function inPoly(lon: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export type ZoneName = "OUTSIDE" | "ANCHORAGE" | "BERTH" | "INSIDE";
export function classifyZone(lat: number, lon: number): { zone: ZoneName; port: string | null; name: string | null } {
  for (const f of GEO.features) if (inPoly(lon, lat, f.geometry.coordinates[0])) return { zone: f.properties.zone as ZoneName, port: f.properties.port, name: f.properties.name };
  return { zone: "OUTSIDE", port: null, name: null };
}
export function haversineM(a: [number, number], b: [number, number]) {
  const r = (d: number) => (d * Math.PI) / 180; const dLat = r(b[0] - a[0]), dLon = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLon / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// ---- answers ----
export type Answer = {
  minerId: string; intent: string; requested: string; // the vessel (MMSI) or port asked about
  result: any; resultShape?: string | null; signalCreatedAt: string | null; signalWallet?: string | null;
  auth: { validAfter: number; validBefore: number } | null; receiptHash: string | null; epochId?: number | null;
  ours?: boolean; // purchased from our own miner
};
export type Verdict<T> = { ok: boolean; refusals: Refusal[]; value?: T; ageSec?: number | null; miner: MinerInfo; answer: Answer };

function clockOk(a: Answer, refusals: Refusal[]) {
  if (!a.auth || !a.signalCreatedAt) return;
  const t = Date.parse(a.signalCreatedAt) / 1000;
  if (Number.isNaN(t) || t < a.auth.validAfter || t > a.auth.validBefore) refusals.push("CLOCK_OUTSIDE_WINDOW");
}
export type VesselFact = { lat: number; lon: number; speedKn: number; observedAtMs: number; zone: ZoneName; zoneName: string | null };
export function checkVessel(a: Answer): Verdict<VesselFact> {
  const miner = minerInfo(a.minerId); const refusals: Refusal[] = [];
  const r = a.result;
  if (a.resultShape === "raw" || Array.isArray(r) || r === null || typeof r !== "object") { return { ok: false, refusals: ["WRONG_VESSEL"], miner, answer: a }; }
  if (r.vessel !== undefined && r.vessel !== null && String(r.vessel) !== a.requested) refusals.push("WRONG_VESSEL");
  const lat = typeof r.latitude === "number" ? r.latitude : NaN, lon = typeof r.longitude === "number" ? r.longitude : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) refusals.push("NO_READING");
  const speed = typeof r.speed_knots === "number" ? r.speed_knots : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) refusals.push("OUT_OF_RANGE");
    else if (lat < REGION.lat[0] || lat > REGION.lat[1] || lon < REGION.lon[0] || lon > REGION.lon[1]) refusals.push("WRONG_PLACE");
  }
  if (Number.isFinite(speed) && (speed < 0 || speed > 100)) refusals.push("OUT_OF_RANGE");
  const obs = parseObservedAt(r.observed_at); const created = a.signalCreatedAt ? Date.parse(a.signalCreatedAt) : NaN;
  let ageSec: number | null = null;
  if (obs === null) refusals.push("UNPARSEABLE_TIME");
  else if (!Number.isNaN(created)) { ageSec = Math.round((created - obs) / 1000); if (ageSec > FRESHNESS_SEC.vessel || ageSec < -120) refusals.push("STALE"); }
  clockOk(a, refusals);
  if (refusals.length) return { ok: false, refusals: [...new Set(refusals)], miner, answer: a, ageSec };
  const z = classifyZone(lat, lon);
  return { ok: true, refusals: [], miner, answer: a, ageSec, value: { lat, lon, speedKn: Number.isFinite(speed) ? speed : 0, observedAtMs: obs!, zone: z.zone, zoneName: z.name } };
}
export type PortFact = { port: string; vesselsWaiting: number | null; waitHours: number; asOfMs: number };
export function checkPort(a: Answer, expectedLocode: string): Verdict<PortFact> {
  const miner = minerInfo(a.minerId); const refusals: Refusal[] = []; const r = a.result;
  if (a.resultShape === "raw" || !r || typeof r !== "object" || Array.isArray(r)) return { ok: false, refusals: ["NO_READING"], miner, answer: a };
  if (String(r.port ?? "").toUpperCase() !== expectedLocode.toUpperCase()) refusals.push("WRONG_PLACE");
  const wait = typeof r.wait_hours === "number" ? r.wait_hours : NaN;
  if (!Number.isFinite(wait)) refusals.push("NO_READING"); else if (wait < 0 || wait > 24 * 60) refusals.push("OUT_OF_RANGE");
  const asOf = parseObservedAt(r.as_of); const created = a.signalCreatedAt ? Date.parse(a.signalCreatedAt) : NaN; let ageSec: number | null = null;
  if (asOf === null) refusals.push("UNPARSEABLE_TIME"); else if (!Number.isNaN(created)) { ageSec = Math.round((created - asOf) / 1000); if (ageSec > FRESHNESS_SEC.port || ageSec < -120) refusals.push("STALE"); }
  clockOk(a, refusals);
  if (refusals.length) return { ok: false, refusals: [...new Set(refusals)], miner, answer: a, ageSec };
  return { ok: true, refusals: [], miner, answer: a, ageSec, value: { port: String(r.port), vesselsWaiting: typeof r.vessels_waiting === "number" ? r.vessels_waiting : null, waitHours: wait, asOfMs: asOf! } };
}

// ---- corroboration: two operators, with the source family kept visible ----
export type Independence = "TWO_SOURCES" | "ONE_UPSTREAM";
export type Corroboration<T> = {
  status: "CORROBORATED" | "REVIEW" | "INSUFFICIENT"; refusal?: Refusal;
  operators: string[]; families: string[]; independence: Independence | null; receipts: string[]; value?: T; note: string;
};
const byOperator = <T>(vs: Verdict<T>[], own: Set<string>) => {
  const m = new Map<string, Verdict<T>>();
  for (const v of vs) { if (!v.ok || v.answer.ours || own.has(v.miner.operator)) continue; if (!m.has(v.miner.operator)) m.set(v.miner.operator, v); }
  return [...m.values()];
};
function summarise<T>(cluster: Verdict<T>[]) {
  const families = [...new Set(cluster.map((v) => v.miner.family))];
  return { operators: cluster.map((v) => v.miner.operator), families, independence: (families.length > 1 ? "TWO_SOURCES" : "ONE_UPSTREAM") as Independence, receipts: cluster.map((v) => v.answer.receiptHash).filter((x): x is string => !!x) };
}
export function corroborateVessel(vs: Verdict<VesselFact>[], own: Set<string> = new Set()): Corroboration<VesselFact> {
  const per = byOperator(vs, own);
  if (per.length < 2) return { status: "INSUFFICIENT", operators: per.map((v) => v.miner.operator), families: [...new Set(per.map((v) => v.miner.family))], independence: null, receipts: [], note: `${per.length} usable operator(s); two are needed` };
  const agree = (a: VesselFact, b: VesselFact) => a.zone === b.zone && Math.abs(a.speedKn - b.speedKn) <= SPEED_TOL_KN;
  let best: Verdict<VesselFact>[] = [];
  for (const seed of per) { const c = per.filter((v) => agree(seed.value!, v.value!)); if (c.length > best.length) best = c; }
  if (best.length >= 2 && best.length === per.length) return { status: "CORROBORATED", ...summarise(best), value: best[0].value, note: "all usable operators agree" };
  if (best.length >= 2) return { status: "REVIEW", refusal: "DISAGREE", ...summarise(per), note: `${per.length - best.length} operator(s) disagree with the majority` };
  return { status: "REVIEW", refusal: "DISAGREE", ...summarise(per), note: "no two operators agree" };
}
export function corroboratePort(vs: Verdict<PortFact>[], own: Set<string> = new Set()): Corroboration<PortFact> {
  const per = byOperator(vs, own);
  if (per.length < 2) return { status: "INSUFFICIENT", operators: per.map((v) => v.miner.operator), families: [...new Set(per.map((v) => v.miner.family))], independence: null, receipts: [], note: `${per.length} usable operator(s); two are needed` };
  const agree = (a: PortFact, b: PortFact) => Math.abs(a.waitHours - b.waitHours) <= Math.max(WAIT_TOL.absoluteHours, WAIT_TOL.relative * Math.max(a.waitHours, b.waitHours));
  let best: Verdict<PortFact>[] = [];
  for (const seed of per) { const c = per.filter((v) => agree(seed.value!, v.value!)); if (c.length > best.length) best = c; }
  if (best.length >= 2 && best.length === per.length) return { status: "CORROBORATED", ...summarise(best), value: best[0].value, note: "all usable operators agree" };
  return { status: "REVIEW", refusal: "DISAGREE", ...summarise(per), note: "operators disagree on wait time" };
}

// ---- re-buy: next operator, ranked by persisted pass rate ----
export type Stats = Record<string, { pass: number; total: number }>;
export function nextRebuy(intent: string, tried: Set<string>, stats: Stats, opts: { own?: Set<string>; avoidFamilies?: Set<string> } = {}): MinerInfo & { minerId: string } | null {
  const own = opts.own ?? new Set();
  const cands = Object.entries(MINERS).filter(([, m]) => m.intents.includes(intent) && !tried.has(m.operator) && !own.has(m.operator) && m.family !== "adsb-aircraft");
  const rate = (id: string) => ((stats[id]?.pass ?? 0) + 1) / ((stats[id]?.total ?? 0) + 2); // Laplace smoothing
  const pref = (m: MinerInfo) => (opts.avoidFamilies?.has(m.family) ? 1 : 0);
  cands.sort(([ia, a], [ib, b]) => pref(a) - pref(b) || rate(ib) - rate(ia) || Number(ia) - Number(ib));
  return cands.length ? { minerId: cands[0][0], ...cands[0][1] } : null;
}
