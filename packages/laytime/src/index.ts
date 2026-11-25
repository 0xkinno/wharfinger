// Deterministic laytime engine. No network, no clock, no randomness, no model.
// All instants are whole minutes since the Unix epoch (floored on capture). Money is bigint uUSDC.
//
// Definitions follow common charter-party usage (BIMCO Laytime Definitions for Charter Parties 2013 covers turn time,
// NOR, exceptions, once on demurrage). That document could not be read in the build environment, so each rule below
// is stated in plain words and is a rule of THIS engine, not a quotation of BIMCO. Cite BIMCO per rule once read.
import { sha256, toHex } from "viem";

export const ENGINE_VERSION = "laytime-1.1.0";
/** A weather stop is excepted only on a day with at least this much corroborated rain (mm). Decision record: THESIS.md. */
export const DEFAULT_WEATHER_MIN_PRECIP_MM = 1;
/** Engine versions a statement may have been signed with. 1.0.0 treated any rain above zero as enough; 1.1.0 uses the threshold. */
export const SUPPORTED_ENGINE_VERSIONS = ["laytime-1.0.0", "laytime-1.1.0"] as const;
export type NorRule = "PORT_LIMITS" | "BERTH" | "WIBON" | "WIPON";
export type Terms = {
  laytimeMinutes: number; turnTimeMinutes: number; norRule: NorRule;
  weatherWorkingDays: boolean; weatherMinPrecipMm?: number; shex: boolean; holidays: string[]; // local dates YYYY-MM-DD
  reversible: boolean; demurrageUusdcPerDay: bigint; despatchUusdcPerDay: bigint; onceOnDemurrage: boolean;
  tz: "Europe/Helsinki";
};
export type Zone = "OUTSIDE" | "ANCHORAGE" | "BERTH" | "INSIDE";
export type FactStatus = "CORROBORATED" | "REVIEW" | "STALE" | "REFUSED";
export type Fact =
  | { kind: "ZONE"; at: number; value: Zone; receipts: string[]; status: FactStatus }
  | { kind: "PRECIP"; at: number; value: number; receipts: string[]; status: FactStatus } // daily mm for the local date of `at`
  | { kind: "PORT_WAIT"; at: number; value: number; receipts: string[]; status: FactStatus };
export type SofKind = "NOR_TENDERED" | "NOR_ACCEPTED" | "ALL_FAST" | "LOADING_START" | "LOADING_STOP" | "LOADING_RESUME" | "COMPLETED" | "DOCS_ON_BOARD";
export type SofEvent = { kind: SofKind; at: number; line: number; remark?: string };
export type Cls = "COUNTS" | "EXCEPTED" | "NOT_YET" | "REVIEW";
export type Interval = { from: number; to: number; minutes: number; cls: Cls; reason: string; onDemurrage: boolean; receipts: string[]; sofLine?: number };
export type Resolution = "COUNTS" | "EXCEPTED";
export type Result = {
  intervals: Interval[];
  nor: { valid: boolean | null; tenderedAt: number | null; validAt: number | null; reason: string };
  laytimeStart: number | null; end: number | null;
  allowedMinutes: number; usedMinutes: number; exceptedMinutes: number; reviewMinutes: number; notYetMinutes: number;
  demurrageMinutes: number; despatchMinutes: number;
  amountUusdc: bigint; // positive: demurrage owed to the owner. negative: despatch owed by the owner
  amountIfReviewCounts: bigint; amountIfReviewExcepted: bigint;
  reviewFlags: string[]; engineVersion: string; resultHash: string;
};

const MIN_DAY = 1440;
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" });
const partsCache = new Map<number, { date: string; mins: number; dow: number }>();
export function localParts(minute: number) {
  const hit = partsCache.get(minute); if (hit) return hit;
  const p = Object.fromEntries(fmt.formatToParts(new Date(minute * 60000)).map((x) => [x.type, x.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  const v = { date: `${p.year}-${p.month}-${p.day}`, mins: Number(p.hour) * 60 + Number(p.minute), dow };
  if (partsCache.size > 200_000) partsCache.clear();
  partsCache.set(minute, v); return v;
}
export function nextLocalMidnight(t: number): number {
  let c = t + (MIN_DAY - localParts(t).mins);
  for (let i = 0; i < 4; i++) { const m = localParts(c).mins; if (m === 0) return c; c += m < 720 ? -m : MIN_DAY - m; }
  return c;
}
const WEATHER = /snow|rain|sleet|drizzle|weather|hail|fog|storm/i;

type Seg = { from: number; to: number; cls: Cls; reason: string; receipts: string[]; sofLine?: number };

export function computeLaytime(termsIn: Terms, sofIn: SofEvent[], factsIn: Fact[], resolutions: Record<string, Resolution> = {}, opts: { engineVersion?: string } = {}): Result {
  const engineVersion = opts.engineVersion ?? ENGINE_VERSION;
  // a statement signed under 1.0.0 is recomputed under 1.0.0 rules: any rain above zero counted
  const terms: Terms = engineVersion === "laytime-1.0.0" ? { ...termsIn, weatherMinPrecipMm: termsIn.weatherMinPrecipMm ?? 0 } : termsIn;
  const sof = [...sofIn].sort((a, b) => a.at - b.at || a.line - b.line);
  const facts = factsIn.filter((f) => f.status === "CORROBORATED").sort((a, b) => a.at - b.at);
  const flags: string[] = [];
  const tender = sof.find((e) => e.kind === "NOR_TENDERED") ?? null;
  const completed = sof.find((e) => e.kind === "COMPLETED") ?? null;
  const end = completed ? completed.at : null;
  const allowed = terms.laytimeMinutes;

  // ---- NOR validity (rule: validity is decided by the vessel's zone at tender, per the NOR rule) ----
  let validAt: number | null = null; let norReason = "NO_NOR";
  let norValid: boolean | null = null;
  if (tender) {
    const okZone = (z: Zone) => (terms.norRule === "BERTH" ? z === "BERTH" : z === "ANCHORAGE" || z === "BERTH" || z === "INSIDE");
    if (terms.norRule === "WIBON" || terms.norRule === "WIPON") { validAt = tender.at; norValid = true; norReason = "VALID_WHETHER_OR_NOT_IN_PORT"; }
    else {
      // Two corroborated zone facts at the same minute that disagree cancel each other: the evidence layer should never
      // emit that, and if it does the engine treats the minute as unknown rather than choosing.
      const allZones = facts.filter((f): f is Extract<Fact, { kind: "ZONE" }> => f.kind === "ZONE");
      const conflicted = new Set(allZones.filter((f) => allZones.some((g) => g.at === f.at && g.value !== f.value)).map((f) => f.at));
      if (conflicted.size > 0) flags.push("CONFLICTING_ZONE_FACTS");
      const zones = allZones.filter((f) => !conflicted.has(f.at));
      const before = [...zones].reverse().find((f) => f.at <= tender.at);
      if (before && okZone(before.value)) { validAt = tender.at; norValid = true; norReason = "VALID_IN_ZONE_AT_TENDER"; }
      else {
        const after = zones.find((f) => f.at > tender.at && okZone(f.value));
        if (after) { validAt = after.at; norValid = false; norReason = before ? "NOR_INVALID_OUTSIDE_LIMITS_AT_TENDER" : "NOR_NO_ZONE_FACT_AT_TENDER_LATER_VALID"; if (!before) { norValid = null; flags.push("NOR_VALIDITY_UNKNOWN_AT_TENDER"); } }
        else { norValid = null; norReason = "NOR_VALIDITY_UNKNOWN"; flags.push("NOR_VALIDITY_UNKNOWN"); }
      }
    }
  }
  const firstLoading = sof.find((e) => e.kind === "LOADING_START");
  let laytimeStart: number | null = null;
  if (validAt !== null) {
    laytimeStart = validAt + terms.turnTimeMinutes;
    if (firstLoading && firstLoading.at >= validAt && firstLoading.at < laytimeStart) laytimeStart = firstLoading.at; // loading commenced inside turn time
  }
  const spanEnd = end ?? (sof.length ? sof[sof.length - 1].at : null);

  function run(mode: "KEEP" | "COUNTS" | "EXCEPTED") {
    const segs: Seg[] = [];
    if (!tender || spanEnd === null || spanEnd <= tender.at) return { segs, intervals: [] as Interval[], used: 0, excepted: 0, review: 0, notYet: 0, dem: 0 };
    // Cut points: tender, laytimeStart, stops and resumes, local midnights, end.
    const cuts = new Set<number>([tender.at, spanEnd]);
    if (laytimeStart !== null && laytimeStart > tender.at && laytimeStart < spanEnd) cuts.add(laytimeStart);
    for (const e of sof) if ((e.kind === "LOADING_STOP" || e.kind === "LOADING_RESUME") && e.at > tender.at && e.at < spanEnd) cuts.add(e.at);
    for (let m = nextLocalMidnight(tender.at); m < spanEnd; m = nextLocalMidnight(m)) cuts.add(m);
    const pts = [...cuts].sort((a, b) => a - b);
    // stop windows
    const stops: { from: number; to: number; weather: boolean; line: number }[] = [];
    let open: SofEvent | null = null;
    for (const e of sof) {
      if (e.kind === "LOADING_STOP" && !open) open = e;
      else if ((e.kind === "LOADING_RESUME" || e.kind === "COMPLETED") && open) { stops.push({ from: open.at, to: e.at, weather: WEATHER.test(open.remark ?? ""), line: open.line }); open = null; }
    }
    if (open) stops.push({ from: open.at, to: spanEnd, weather: WEATHER.test(open.remark ?? ""), line: open.line });
    const minMm = terms.weatherMinPrecipMm ?? DEFAULT_WEATHER_MIN_PRECIP_MM;
    const rainOn = (date: string) => facts.filter((f): f is Extract<Fact, { kind: "PRECIP" }> => f.kind === "PRECIP" && localParts(f.at).date === date && f.value > 0);

    for (let i = 0; i + 1 < pts.length; i++) {
      const from = pts[i], to = pts[i + 1];
      if (to <= from) continue;
      if (laytimeStart === null || from < laytimeStart) {
        segs.push({ from, to, cls: "NOT_YET", reason: laytimeStart === null ? norReason : (norValid === false ? "NOR_INVALID_OUTSIDE_LIMITS" : "BEFORE_LAYTIME_COMMENCES"), receipts: [] });
        continue;
      }
      const lp = localParts(from);
      const stop = stops.find((s) => from >= s.from && to <= s.to);
      let cls: Cls = "COUNTS", reason = "LAYTIME_RUNNING"; let receipts: string[] = []; let sofLine: number | undefined;
      if (terms.shex && (lp.dow === 0 || terms.holidays.includes(lp.date))) { cls = "EXCEPTED"; reason = lp.dow === 0 ? "SUNDAY_SHEX" : "HOLIDAY_SHEX"; }
      else if (stop) {
        sofLine = stop.line;
        if (stop.weather && terms.weatherWorkingDays) {
          const rain = rainOn(lp.date); const enough = rain.filter((f) => f.value >= minMm);
          if (enough.length > 0) { cls = "EXCEPTED"; reason = "WEATHER_STOP_SOF_AND_RECEIPT"; receipts = enough.flatMap((f) => f.receipts); }
          else if (rain.length > 0) { cls = "REVIEW"; reason = "WEATHER_STOP_RAIN_BELOW_THRESHOLD"; receipts = rain.flatMap((f) => f.receipts); }
          else { cls = "REVIEW"; reason = "WEATHER_STOP_SOF_NO_RECEIPT"; }
        } else { reason = stop.weather ? "WEATHER_STOP_NOT_EXCEPTED_BY_TERMS" : "STOP_NOT_AN_EXCEPTION"; }
      }
      if (cls === "REVIEW") {
        const r = resolutions[`${from}-${to}`];
        if (r) { cls = r; reason = `ANALYST_RESOLVED_${r}`; }
        else if (mode !== "KEEP") { cls = mode; reason = `ASSUMED_${mode}`; }
      }
      segs.push({ from, to, cls, reason, receipts, sofLine });
    }
    // stage 2: walk, split at allowed crossing, once on demurrage
    const out: Interval[] = []; let used = 0, excepted = 0, review = 0, notYet = 0, dem = 0;
    let onDem = false;
    const push = (s: Seg, from: number, to: number, cls: Cls, reason: string, d: boolean) => { if (to > from) out.push({ from, to, minutes: to - from, cls, reason, onDemurrage: d, receipts: s.receipts, sofLine: s.sofLine }); };
    for (const s of segs) {
      let cls = s.cls; let reason = s.reason;
      if (onDem && terms.onceOnDemurrage && cls === "EXCEPTED") { cls = "COUNTS"; reason = `ONCE_ON_DEMURRAGE_${s.reason}`; }
      if (cls === "NOT_YET") { push(s, s.from, s.to, cls, reason, false); notYet += s.to - s.from; continue; }
      if (cls === "EXCEPTED") { push(s, s.from, s.to, cls, reason, onDem); excepted += s.to - s.from; continue; }
      if (cls === "REVIEW" && onDem && terms.onceOnDemurrage) { cls = "COUNTS"; reason = `ONCE_ON_DEMURRAGE_${s.reason}`; }
      if (cls === "REVIEW") { push(s, s.from, s.to, cls, reason, onDem); review += s.to - s.from; continue; }
      // COUNTS
      let cur = s.from;
      if (!onDem) {
        const room = allowed - used;
        if (s.to - cur <= room) { push(s, cur, s.to, "COUNTS", reason, false); used += s.to - cur; if (used === allowed) onDem = true; continue; }
        if (room > 0) { push(s, cur, cur + room, "COUNTS", reason, false); used += room; cur += room; }
        onDem = true;
      }
      push(s, cur, s.to, "COUNTS", reason, true); used += s.to - cur; dem += s.to - cur;
    }
    return { segs, intervals: out, used, excepted, review, notYet, dem };
  }

  const money = (minutes: number, rate: bigint) => (BigInt(minutes) * rate) / BigInt(MIN_DAY); // floor, stated in RISK.md
  const base = run("KEEP");
  const despatchMin = completed && laytimeStart !== null && base.review === 0 && base.used < allowed ? allowed - base.used : 0;
  const amt = (r: ReturnType<typeof run>) => {
    const dm = completed && laytimeStart !== null && r.used < allowed ? allowed - r.used : 0;
    return r.dem > 0 ? money(r.dem, terms.demurrageUusdcPerDay) : -money(dm, terms.despatchUusdcPerDay);
  };
  const lo = base.review > 0 ? run("EXCEPTED") : base; const hi = base.review > 0 ? run("COUNTS") : base;
  const body = {
    intervals: base.intervals, nor: { valid: norValid, tenderedAt: tender?.at ?? null, validAt, reason: norReason },
    laytimeStart, end, allowedMinutes: allowed, usedMinutes: base.used, exceptedMinutes: base.excepted, reviewMinutes: base.review, notYetMinutes: base.notYet,
    demurrageMinutes: base.dem, despatchMinutes: despatchMin,
    amountUusdc: base.review > 0 ? amt(base) : amt(base), amountIfReviewCounts: amt(hi), amountIfReviewExcepted: amt(lo),
    reviewFlags: flags, engineVersion,
  };
  const resultHash = sha256(toHex(new TextEncoder().encode(canonical(body)))).slice(2);
  return { ...body, resultHash };
}

export function canonical(v: unknown): string {
  const norm = (x: any): any => typeof x === "bigint" ? x.toString() : Array.isArray(x) ? x.map(norm) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, norm(x[k])])) : x;
  return JSON.stringify(norm(v));
}
