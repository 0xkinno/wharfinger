import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { getArchived, parsePortCalls, inPort, parseAis, parseOpenMeteoDaily, readArchived } from "../src/index.ts";

const fixture = (f: string) => readFileSync(`evidence/probe/${f}`, "utf8");
const respond = (text: string) => async () => new Response(text, { status: 200 });

describe("truth readers on saved real data (2026-11-25)", () => {
  it("lists the vessels in port at Kotka at the capture time and flags missing MMSI", () => {
    const rows = parsePortCalls(JSON.parse(fixture("dt_portcalls_FIKTK.json")));
    const now = Date.parse("2026-11-25T06:15:00Z"); const port = inPort(rows, now);
    expect(port.length).toBe(9); expect(port.filter((v) => !v.hasMmsi).map((v) => v.vessel).sort()).toEqual(["Amalia", "Aristo", "Bore Wave"]);
    expect(port.find((v) => v.vessel === "Iceland")!.mmsi).toBe(246546000);
  });
  it("deduplicates a vessel listed twice (Helsinki)", () => {
    const port = inPort(parsePortCalls(JSON.parse(fixture("dt_portcalls_FIHEL.json"))), Date.parse("2026-11-25T06:15:00Z"));
    expect(port.filter((v) => v.vessel === "Bjorg")).toHaveLength(1);
  });
  it("reads an AIS position; an absent feature list is an empty answer, not a guess", () => {
    const p = parseAis(JSON.parse(fixture("dt_ais_246546000.json")));
    expect(p).toHaveLength(1); expect(p[0].lat).toBeCloseTo(60.534235, 5); expect(p[0].sogKn).toBe(0);
    expect(parseAis(JSON.parse(fixture("dt_ais_236451000.json")))).toEqual([]);
  });
  it("archives the exact bytes under their sha256 and can read them back", async () => {
    const dir = mkdtempSync(join(tmpdir(), "arch-")); const text = fixture("dt_ais_246546000.json");
    const r = await getArchived("https://example.invalid/x", { fetch: respond(text), archiveDir: dir });
    expect(r.sha256).toBe(createHash("sha256").update(text).digest("hex"));
    expect(readdirSync(dir)).toContain(`${r.sha256}.json`); expect(readArchived(dir, r.sha256)).toEqual(JSON.parse(text));
  });
  it("sends the Digitraffic-User header and fails loudly on an error status", async () => {
    let seen: any; await getArchived("https://x", { fetch: async (_u, i) => { seen = i!.headers; return new Response("{}", { status: 200 }); } });
    expect(seen["Digitraffic-User"]).toContain("wharfinger"); expect(seen["Accept-Encoding"]).toBe("gzip");
    await expect(getArchived("https://x", { fetch: async () => new Response("no", { status: 406 }) })).rejects.toThrow("406");
  });
  it("parses Open-Meteo daily precipitation", () => {
    const d = parseOpenMeteoDaily({ daily: { time: ["2026-11-24"], precipitation_sum: [0.1], temperature_2m_max: [1.9], temperature_2m_min: [1.1] } });
    expect(d).toEqual([{ date: "2026-11-24", precipMm: 0.1, tMaxC: 1.9, tMinC: 1.1 }]);
  });
});
