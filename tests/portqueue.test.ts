import { describe, it, expect } from "vitest";
import { resolvePort, congestionLevel, portQueue, PORTS } from "../packages/truth/src/portqueue.ts";

describe("port queue provider", () => {
  it("resolves the names that routed asks use, Kotka and HaminaKotka to FIKTK, and Hanko to its own port", () => {
    for (const q of ["Kotka", "HaminaKotka", "Kotka, Finland", "Port of Kotka", "FIKTK", " kotka "]) expect(resolvePort(q)?.locode).toBe("FIKTK");
    expect(resolvePort("Helsinki")?.locode).toBe("FIHEL"); expect(resolvePort("Turku")?.locode).toBe("FITKU");
    expect(resolvePort("Hanko")?.locode).toBe("FIHKO"); expect(resolvePort("Hanko")?.locode).not.toBe("FIKTK"); expect(resolvePort("Rauma")?.locode).toBe("FIRAU"); expect(resolvePort("Oulu")?.locode).toBe("FIOUL");
    expect(resolvePort("Rotterdam")).toBeNull(); expect(resolvePort("Tallinn")).toBeNull();
  });
  it("levels are monotone in both ships and wait", () => {
    expect(congestionLevel(0, 0)).toBe("low"); expect(congestionLevel(1, 2)).toBe("low"); expect(congestionLevel(2, 20)).toBe("moderate");
    expect(congestionLevel(2, 60)).toBe("high"); expect(congestionLevel(2, 120)).toBe("severe"); expect(congestionLevel(10, 0.1)).toBe("severe");
  });
  it("counts anchored vessels and computes the wait from the planned arrival, and says so when nothing is waiting", async () => {
    const now = Date.parse("2026-11-26T12:00:00Z"); const p = PORTS[0];
    const feat = (mmsi: number, nav: number, sog = 0) => ({ mmsi, properties: { mmsi, navStat: nav, sog, timestampExternal: now - 60000 } });
    const mk = (ais: any[], calls: any[]) => (async (u: string) => new Response(JSON.stringify(u.includes("/ais/") ? { features: ais } : { portCalls: calls }), { status: 200 })) as any;
    const a = await portQueue(p, now, mk([feat(1, 1), feat(2, 1), feat(3, 5), feat(4, 1, 6)], [
      { mmsi: 1, portCallTimestamp: "2026-11-26T00:00:00Z", portAreaDetails: [{ eta: "2026-11-26T00:00:00Z" }] },
      { mmsi: 2, portCallTimestamp: "2026-11-25T12:00:00Z", portAreaDetails: [{ eta: "2026-11-25T12:00:00Z" }] }, { mmsi: 9, vesselName: "Moored", imoLloyds: 5, portAreaDetails: [{ ata: "2026-11-25T01:00:00Z" }] }]));
    expect(a.vessels_waiting).toBe(2); expect(a.wait_hours).toBe(18); expect(a.congestion_level).toBe("moderate"); expect(a.vessels_at_berth).toBe(1);
    const b = await portQueue(p, now, mk([feat(3, 5)], [])); expect(b.vessels_waiting).toBe(0); expect(b.wait_hours).toBe(0); expect(b.congestion_level).toBe("low");
  });
});
