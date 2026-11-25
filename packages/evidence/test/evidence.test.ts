import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { checkVessel, checkPort, corroborateVessel, corroboratePort, parseObservedAt, classifyZone, nextRebuy, GEOMETRY_VERSION, type Answer } from "../src/index.ts";

// Replay of the real answers bought on 2026-11-25 (evidence/probe/paid/asks_matrix.json).
const rows: any[] = JSON.parse(readFileSync("evidence/probe/paid/asks_matrix.json", "utf8")).filter((r) => r.status === 200);
const toAnswer = (r: any): Answer => ({ minerId: String(r.miner_id), intent: r.intent, requested: String(r.params.vessel ?? r.params.port), result: r.result, resultShape: r.result_shape,
  signalCreatedAt: r.signal?.created_at ?? null, auth: r.auth, receiptHash: r.receipt?.receipt_hash ?? null, epochId: r.receipt?.epoch_id });
const vessel = (slug: string) => { const r = rows.find((x) => x.label.startsWith(`pinned vessel ${slug}`)); return checkVessel(toAnswer(r)); };

describe("replay of real vessel answers (B2, B3 and friends on saved real data)", () => {
  it.each(["vesselwire-vessel-telemetry-verify", "zk-vessel-v2", "txlens", "a1-preflight", "chainsight-oracle"])("%s: correct, fresh and in the Kotka berth box", (slug) => {
    const v = vessel(slug); expect(v.refusals).toEqual([]); expect(v.ok).toBe(true);
    expect(v.value!.zone).toBe("BERTH"); expect(v.ageSec!).toBeLessThan(300);
  });
  it("B3 stale: a 25 hour old position is refused STALE even though every field said ok", () => { const v = vessel("quay-ais"); expect(v.ok).toBe(false); expect(v.refusals).toContain("STALE"); expect(v.ageSec!).toBeGreaterThan(90_000); });
  it("latitude equal to longitude is refused WRONG_PLACE", () => { for (const s of ["ves-digit-loc", "ves-digit-radius"]) { const v = vessel(s); expect(v.refusals).toContain("WRONG_PLACE"); } });
  it("a list of other vessels is refused WRONG_VESSEL", () => { expect(vessel("ves-digit-ves").refusals).toEqual(["WRONG_VESSEL"]); });
  it("null coordinates are refused NO_READING", () => { expect(vessel("ves-digitraffic").refusals).toContain("NO_READING"); });
  it("B2 wrong place: Hanko returned for Kotka is refused and Helsinki is accepted", () => {
    const port = (label: string, code: string) => checkPort(toAnswer(rows.find((x) => x.label === label)), code);
    expect(port("routed port Kotka", "FIKTK").refusals).toContain("WRONG_PLACE");
    expect(port("routed port Helsinki", "FIHEL").ok).toBe(true);
    expect(port("routed port Turku", "FITKU").ok).toBe(true);
  });
  it("every answer's signal time is inside its authorization window (clock bracket)", () => {
    for (const r of rows) { const a = toAnswer(r); const t = Date.parse(a.signalCreatedAt!) / 1000; expect(t).toBeGreaterThanOrEqual(a.auth!.validAfter); expect(t).toBeLessThanOrEqual(a.auth!.validBefore); }
  });
});

describe("corroboration keeps source independence visible", () => {
  const all = () => ["vesselwire-vessel-telemetry-verify", "zk-vessel-v2", "txlens", "a1-preflight", "chainsight-oracle", "quay-ais", "ves-digit-loc"].map(vessel);
  it("four operators that relay one feed corroborate, labelled ONE_UPSTREAM", () => {
    const c = corroborateVessel(all()); expect(c.status).toBe("CORROBORATED"); expect(c.independence).toBe("ONE_UPSTREAM");
    expect(c.operators.length).toBe(4); expect(c.families).toEqual(["digitraffic-ais"]); expect(c.value!.zone).toBe("BERTH");
  });
  it("two answers from the same operator are one operator and cannot corroborate", () => {
    const c = corroborateVessel([vessel("vesselwire-vessel-telemetry-verify"), vessel("zk-vessel-v2")]); expect(c.status).toBe("INSUFFICIENT");
  });
  it("our own operator never counts", () => {
    const a = vessel("txlens"), b = vessel("a1-preflight");
    expect(corroborateVessel([a, b], new Set([a.miner.operator])).status).toBe("INSUFFICIENT");
    expect(corroborateVessel([{ ...a, answer: { ...a.answer, ours: true } }, b]).status).toBe("INSUFFICIENT");
  });
  it("B5: two operators that disagree on zone send the interval to REVIEW", () => {
    const a = vessel("txlens"), b = vessel("a1-preflight"); const moved = { ...b, value: { ...b.value!, zone: "OUTSIDE" as const } };
    const c = corroborateVessel([a, moved]); expect(c.status).toBe("REVIEW"); expect(c.refusal).toBe("DISAGREE");
  });
  it("two sources would be reported as TWO_SOURCES", () => {
    const a = vessel("txlens"); const q = { ...vessel("a1-preflight") }; q.miner = { ...q.miner, family: "shore-ais-quay", operator: "0xother" };
    expect(corroborateVessel([a, q]).independence).toBe("TWO_SOURCES");
  });
  it("port wait agrees within 25 percent or 2 hours", () => {
    const mk = (id: string, w: number) => ({ ok: true, refusals: [], miner: { slug: id, operator: id, family: id, familyBasis: "", intents: [] }, answer: {} as Answer, value: { port: "FIKTK", vesselsWaiting: 1, waitHours: w, asOfMs: 0 } });
    expect(corroboratePort([mk("a", 17), mk("b", 18.5)]).status).toBe("CORROBORATED");
    expect(corroboratePort([mk("a", 17), mk("b", 40)]).status).toBe("REVIEW");
  });
});

describe("time and zones", () => {
  it("parses the three observed_at shapes seen live", () => {
    expect(parseObservedAt("2026-11-25T06:38:00Z")).toBe(Date.parse("2026-11-25T06:38:00Z"));
    expect(parseObservedAt("2026-11-25 06:38 UTC")).toBe(Date.parse("2026-11-25T06:38:00Z"));
    expect(parseObservedAt("1795588733825")).toBe(1795588733825);
    expect(parseObservedAt("yesterday")).toBeNull(); expect(parseObservedAt(null)).toBeNull();
  });
  it("classifies the berth boxes and everything else as OUTSIDE; geometry is labelled draft", () => {
    expect(classifyZone(60.534235, 27.171965).zone).toBe("BERTH"); expect(classifyZone(60.0, 25.0).zone).toBe("OUTSIDE");
    expect(GEOMETRY_VERSION).toContain("draft");
  });
});

describe("re-buy ranking", () => {
  it("picks an untried operator, never aircraft trackers, best persisted pass rate first, deterministic", () => {
    const a = nextRebuy("VESSEL_TELEMETRY_VERIFY_GENERAL", new Set(), {}); const b = nextRebuy("VESSEL_TELEMETRY_VERIFY_GENERAL", new Set(), {});
    expect(a).toEqual(b); expect(a!.family).not.toBe("adsb-aircraft");
    const ranked = nextRebuy("VESSEL_TELEMETRY_VERIFY_GENERAL", new Set([a!.operator]), { "7603": { pass: 9, total: 10 } });
    expect(ranked!.operator).not.toBe(a!.operator);
  });
  it("can prefer a different source family", () => {
    const r = nextRebuy("VESSEL_TELEMETRY_VERIFY_GENERAL", new Set(), {}, { avoidFamilies: new Set(["digitraffic-ais"]) });
    expect(r!.family).not.toBe("digitraffic-ais");
  });
});
