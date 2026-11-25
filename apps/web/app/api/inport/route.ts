import { portCalls, inPort } from "@pk/truth/src/index.ts";
export const dynamic = "force-dynamic";
// Public record, not bought on Telegraph: vessels in port now, from Digitraffic port calls.
export async function GET() {
  const now = Date.now(); const out: any[] = [];
  for (const [locode, name] of [["FIKTK", "Kotka"], ["FIHEL", "Helsinki"], ["FITKU", "Turku"]] as const) {
    try { const { rows } = await portCalls(locode); for (const v of inPort(rows, now)) out.push({ port: name, locode, vessel: v.vessel, mmsi: v.mmsi, imo: v.imo, hasMmsi: v.hasMmsi, berth: v.berth }); } catch { /* one port failing does not hide the others */ }
  }
  return Response.json({ source: "Digitraffic port calls, public record, not bought on Telegraph", at: new Date().toISOString(), vessels: out }, { headers: { "cache-control": "s-maxage=300" } });
}
