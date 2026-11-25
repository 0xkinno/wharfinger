import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeLaytime, type Terms, type SofEvent, type Fact, type Interval } from "../src/index.ts";

const m = (iso: string) => Math.floor(Date.parse(iso) / 60000);
const RATE = 18_000_000_000n; // $18,000 a day in uUSDC
const base: Terms = { laytimeMinutes: 24 * 60, turnTimeMinutes: 6 * 60, norRule: "WIBON", weatherWorkingDays: true, shex: false, holidays: [],
  reversible: false, demurrageUusdcPerDay: RATE, despatchUusdcPerDay: RATE / 2n, onceOnDemurrage: true, tz: "Europe/Helsinki" };
const T0 = m("2026-11-28T00:40:00Z"); // Saturday 02:40 Helsinki
const sum = (iv: Interval[], c: string) => iv.filter((i) => i.cls === c).reduce((a, i) => a + i.minutes, 0);

describe("laytime rules", () => {
  it("WIBON NOR is valid at tender; turn time delays laytime; demurrage priced in integer uUSDC", () => {
    const r = computeLaytime(base, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 6 * 60 + 24 * 60 + 41 * 60, line: 2 }], []);
    expect(r.nor.valid).toBe(true);
    expect(r.laytimeStart).toBe(T0 + 360);
    expect(r.demurrageMinutes).toBe(41 * 60);
    expect(r.amountUusdc).toBe((BigInt(41 * 60) * RATE) / 1440n);
    expect(r.amountUusdc).toBe(30_750_000_000n); // 41 h at $750 an hour
  });
  it("B1: NOR tendered from outside port limits restarts the clock at the first valid zone fact", () => {
    const facts: Fact[] = [{ kind: "ZONE", at: T0 - 5, value: "OUTSIDE", receipts: ["r1"], status: "CORROBORATED" }, { kind: "ZONE", at: T0 + 600, value: "ANCHORAGE", receipts: ["r2"], status: "CORROBORATED" }];
    const r = computeLaytime({ ...base, norRule: "PORT_LIMITS", turnTimeMinutes: 0 }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 2000, line: 2 }], facts);
    expect(r.nor.valid).toBe(false); expect(r.nor.validAt).toBe(T0 + 600);
    expect(r.laytimeStart).toBe(T0 + 600);
    expect(r.intervals[0]).toMatchObject({ cls: "NOT_YET", reason: "NOR_INVALID_OUTSIDE_LIMITS" });
    expect(r.notYetMinutes).toBe(600);
  });
  it("no zone fact at all: validity unknown, nothing counts, flag raised", () => {
    const r = computeLaytime({ ...base, norRule: "PORT_LIMITS" }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 3000, line: 2 }], []);
    expect(r.nor.valid).toBeNull(); expect(r.usedMinutes).toBe(0); expect(r.reviewFlags).toContain("NOR_VALIDITY_UNKNOWN"); expect(r.amountUusdc).toBe(0n);
  });
  it("BERTH rule rejects an anchorage fact", () => {
    const facts: Fact[] = [{ kind: "ZONE", at: T0 - 1, value: "ANCHORAGE", receipts: [], status: "CORROBORATED" }, { kind: "ZONE", at: T0 + 100, value: "BERTH", receipts: [], status: "CORROBORATED" }];
    const r = computeLaytime({ ...base, norRule: "BERTH", turnTimeMinutes: 0 }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 500, line: 2 }], facts);
    expect(r.nor.validAt).toBe(T0 + 100);
  });
  it("facts that are not CORROBORATED never decide anything", () => {
    const facts: Fact[] = [{ kind: "ZONE", at: T0 - 1, value: "BERTH", receipts: ["x"], status: "REVIEW" }, { kind: "ZONE", at: T0 - 2, value: "BERTH", receipts: ["y"], status: "STALE" }];
    const r = computeLaytime({ ...base, norRule: "PORT_LIMITS" }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 500, line: 2 }], facts);
    expect(r.nor.valid).toBeNull();
  });
  const stopSof = (a: number, b: number, remark = "loading stopped, snow"): SofEvent[] => [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "LOADING_STOP", at: a, line: 2, remark }, { kind: "LOADING_RESUME", at: b, line: 3 }, { kind: "COMPLETED", at: T0 + 3000, line: 4 }];
  const rain = (at: number, mm = 0.1): Fact => ({ kind: "PRECIP", at, value: mm, receipts: ["rcpt-rain"], status: "CORROBORATED" });
  it("weather exception needs the SOF stop line AND a corroborated precipitation fact; the receipt is attached", () => {
    const a = T0 + 900, b = T0 + 1080; // inside the same local day
    const r = computeLaytime({ ...base, turnTimeMinutes: 0 }, stopSof(a, b), [rain(a)]);
    const ex = r.intervals.filter((i) => i.cls === "EXCEPTED");
    expect(ex.reduce((s, i) => s + i.minutes, 0)).toBe(b - a);
    expect(ex[0].receipts).toEqual(["rcpt-rain"]);
  });
  it("B6 no receipt, no deduction: an SOF stop line alone becomes REVIEW, never EXCEPTED", () => {
    const a = T0 + 900, b = T0 + 1080;
    const r = computeLaytime({ ...base, turnTimeMinutes: 0 }, stopSof(a, b), []);
    expect(sum(r.intervals, "EXCEPTED")).toBe(0); expect(r.reviewMinutes).toBe(b - a);
    expect(r.amountIfReviewExcepted <= r.amountIfReviewCounts).toBe(true);
  });
  it("an analyst resolution moves a REVIEW interval and is recorded in the reason", () => {
    const a = T0 + 900, b = T0 + 1080;
    const first = computeLaytime({ ...base, turnTimeMinutes: 0 }, stopSof(a, b), []);
    const rv = first.intervals.find((i) => i.cls === "REVIEW")!;
    const r = computeLaytime({ ...base, turnTimeMinutes: 0 }, stopSof(a, b), [], { [`${rv.from}-${rv.to}`]: "EXCEPTED" });
    expect(r.reviewMinutes).toBe(0); expect(r.intervals.find((i) => i.from === rv.from)!.reason).toBe("ANALYST_RESOLVED_EXCEPTED");
  });
  it("precipitation with no stop line does not except anything", () => {
    const r = computeLaytime({ ...base, turnTimeMinutes: 0 }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 1000, line: 2 }], [rain(T0 + 10)]);
    expect(r.exceptedMinutes).toBe(0);
  });
  it("a stop for a non-weather reason is not an exception", () => {
    const a = T0 + 900, b = T0 + 1080;
    const r = computeLaytime({ ...base, turnTimeMinutes: 0 }, stopSof(a, b, "shore loader breakdown"), [rain(a)]);
    expect(r.exceptedMinutes).toBe(0); expect(r.reviewMinutes).toBe(0);
  });
  it("SHEX excepts Sundays and listed holidays; SHINC does not", () => {
    const sunStart = m("2026-11-28T22:00:00Z"); // Sunday 00:00 Helsinki
    const sof: SofEvent[] = [{ kind: "NOR_TENDERED", at: sunStart - 60, line: 1 }, { kind: "COMPLETED", at: sunStart + 1500, line: 2 }];
    const shex = computeLaytime({ ...base, turnTimeMinutes: 0, shex: true }, sof, []);
    expect(shex.exceptedMinutes).toBe(1440);
    expect(computeLaytime({ ...base, turnTimeMinutes: 0, shex: false }, sof, []).exceptedMinutes).toBe(0);
    const hol = computeLaytime({ ...base, turnTimeMinutes: 0, shex: true, holidays: ["2026-12-01"] }, [{ kind: "NOR_TENDERED", at: m("2026-11-30T21:00:00Z"), line: 1 }, { kind: "COMPLETED", at: m("2026-12-01T23:00:00Z"), line: 2 }], []);
    expect(hol.intervals.some((i) => i.reason === "HOLIDAY_SHEX")).toBe(true);
  });
  it("once on demurrage, always on demurrage: exceptions stop applying after laytime is used up", () => {
    const sun = m("2026-11-28T22:00:00Z");
    const sof: SofEvent[] = [{ kind: "NOR_TENDERED", at: sun - 2000, line: 1 }, { kind: "COMPLETED", at: sun + 1440, line: 2 }];
    const t = { ...base, turnTimeMinutes: 0, shex: true, laytimeMinutes: 300 };
    expect(computeLaytime(t, sof, []).exceptedMinutes).toBe(0);
    expect(computeLaytime({ ...t, onceOnDemurrage: false }, sof, []).exceptedMinutes).toBe(1440);
  });
  it("despatch when completed inside allowed laytime, at the despatch rate", () => {
    const r = computeLaytime({ ...base, turnTimeMinutes: 0 }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 1200, line: 2 }], []);
    expect(r.despatchMinutes).toBe(240);
    expect(r.amountUusdc).toBe(-((240n * (RATE / 2n)) / 1440n));
  });
  it("rounding is a floor on total minutes", () => {
    const r = computeLaytime({ ...base, turnTimeMinutes: 0, laytimeMinutes: 0, demurrageUusdcPerDay: 1000n }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 7, line: 2 }], []);
    expect(r.amountUusdc).toBe(4n); // floor(7 * 1000 / 1440) = 4
  });
  it("contradictory corroborated zone facts at one minute leave validity unknown", () => {
    const facts: Fact[] = [{ kind: "ZONE", at: T0 - 1, value: "BERTH", receipts: [], status: "CORROBORATED" }, { kind: "ZONE", at: T0 - 1, value: "OUTSIDE", receipts: [], status: "CORROBORATED" }];
    const r = computeLaytime({ ...base, norRule: "PORT_LIMITS" }, [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 500, line: 2 }], facts);
    expect(r.nor.valid).toBeNull(); expect(r.reviewFlags).toContain("CONFLICTING_ZONE_FACTS");
  });
  it("hash is stable for the same inputs and changes when an input changes", () => {
    const sof: SofEvent[] = [{ kind: "NOR_TENDERED", at: T0, line: 1 }, { kind: "COMPLETED", at: T0 + 2000, line: 2 }];
    expect(computeLaytime(base, sof, []).resultHash).toBe(computeLaytime(base, sof, []).resultHash);
    expect(computeLaytime(base, sof, []).resultHash).not.toBe(computeLaytime({ ...base, laytimeMinutes: 1 }, sof, []).resultHash);
  });
});

// ---- property tests, 10,000 runs ----
const zone = fc.constantFrom("OUTSIDE", "ANCHORAGE", "BERTH", "INSIDE" as const);
const arb = fc.record({
  laytime: fc.integer({ min: 0, max: 4000 }), turn: fc.integer({ min: 0, max: 600 }), shex: fc.boolean(), once: fc.boolean(), ww: fc.boolean(),
  rule: fc.constantFrom("PORT_LIMITS", "BERTH", "WIBON", "WIPON" as const),
  len: fc.integer({ min: 1, max: 6000 }),
  stops: fc.array(fc.record({ a: fc.integer({ min: 1, max: 5800 }), d: fc.integer({ min: 1, max: 500 }), weather: fc.boolean() }), { maxLength: 4 }),
  facts: fc.array(fc.oneof(
    fc.record({ k: fc.constant("ZONE" as const), at: fc.integer({ min: -100, max: 5000 }), z: zone, st: fc.constantFrom("CORROBORATED", "REVIEW" as const) }),
    fc.record({ k: fc.constant("PRECIP" as const), at: fc.integer({ min: 0, max: 5000 }), mm: fc.double({ min: 0, max: 20, noNaN: true }), st: fc.constantFrom("CORROBORATED", "STALE" as const) })), { maxLength: 8 }),
});
function build(x: any) {
  const terms: Terms = { ...base, laytimeMinutes: x.laytime, turnTimeMinutes: x.turn, shex: x.shex, onceOnDemurrage: x.once, weatherWorkingDays: x.ww, norRule: x.rule };
  const sof: SofEvent[] = [{ kind: "NOR_TENDERED", at: T0, line: 1 }];
  let line = 2, last = T0;
  for (const s of [...x.stops].sort((p: any, q: any) => p.a - q.a)) {
    const a = Math.max(T0 + s.a, last + 1); sof.push({ kind: "LOADING_STOP", at: a, line: line++, remark: s.weather ? "snow" : "breakdown" }); sof.push({ kind: "LOADING_RESUME", at: a + s.d, line: line++ }); last = a + s.d;
  }
  sof.push({ kind: "COMPLETED", at: Math.max(T0 + x.len, last + 1), line: line++ });
  const facts: Fact[] = x.facts.map((f: any, i: number) => f.k === "ZONE" ? { kind: "ZONE", at: T0 + f.at, value: f.z, receipts: [`z${i}`], status: f.st } : { kind: "PRECIP", at: T0 + f.at, value: f.mm, receipts: [`p${i}`], status: f.st });
  return { terms, sof, facts };
}
describe("property tests (10,000 runs each)", () => {
  const opts = { numRuns: 10_000 };
  it("deterministic: same inputs give the same output and hash", () => fc.assert(fc.property(arb, (x) => { const { terms, sof, facts } = build(x); const a = computeLaytime(terms, sof, facts), b = computeLaytime(terms, sof, facts); expect(a.resultHash).toBe(b.resultHash); }), opts));
  it("intervals are contiguous, non-overlapping, positive, and cover tender to end", () => fc.assert(fc.property(arb, (x) => {
    const { terms, sof, facts } = build(x); const r = computeLaytime(terms, sof, facts);
    let cur = T0; for (const i of r.intervals) { expect(i.from).toBe(cur); expect(i.to).toBeGreaterThan(i.from); expect(i.minutes).toBe(i.to - i.from); cur = i.to; }
    expect(cur).toBe(r.end);
  }), opts));
  it("totals equal the sum of intervals", () => fc.assert(fc.property(arb, (x) => {
    const { terms, sof, facts } = build(x); const r = computeLaytime(terms, sof, facts);
    expect(r.usedMinutes).toBe(sum(r.intervals, "COUNTS")); expect(r.exceptedMinutes).toBe(sum(r.intervals, "EXCEPTED"));
    expect(r.reviewMinutes).toBe(sum(r.intervals, "REVIEW")); expect(r.notYetMinutes).toBe(sum(r.intervals, "NOT_YET"));
    expect(r.usedMinutes + r.exceptedMinutes + r.reviewMinutes + r.notYetMinutes).toBe(r.end! - T0);
    expect(r.demurrageMinutes).toBe(r.intervals.filter((i) => i.cls === "COUNTS" && i.onDemurrage).reduce((a, i) => a + i.minutes, 0));
    expect(r.demurrageMinutes).toBeLessThanOrEqual(r.usedMinutes);
  }), opts));
  it("removing a weather receipt never moves hours into EXCEPTED", () => fc.assert(fc.property(arb, fc.nat(), (x, k) => {
    const { terms, sof, facts } = build(x); const idx = facts.map((f, i) => (f.kind === "PRECIP" ? i : -1)).filter((i) => i >= 0); if (idx.length === 0) return;
    const drop = idx[k % idx.length]; const fewer = facts.filter((_, i) => i !== drop);
    expect(computeLaytime(terms, sof, fewer).exceptedMinutes).toBeLessThanOrEqual(computeLaytime(terms, sof, facts).exceptedMinutes);
  }), opts));
  it("review bounds bracket the amount and the amount is an integer within them", () => fc.assert(fc.property(arb, (x) => {
    const { terms, sof, facts } = build(x); const r = computeLaytime(terms, sof, facts);
    expect(r.amountIfReviewExcepted <= r.amountIfReviewCounts).toBe(true);
    expect(r.amountUusdc >= r.amountIfReviewExcepted && r.amountUusdc <= r.amountIfReviewCounts).toBe(true);
  }), opts));
});
