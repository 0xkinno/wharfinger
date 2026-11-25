import { createVoyage, listVoyages } from "@/lib/voyages";
import { hashCanonical } from "@pk/statement/src/index.ts";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json((await listVoyages()).map(({ funder_address, ...v }) => ({ ...v, funder: funder_address }))); }
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.vessel || !b.port || !b.funder || !/^0x[0-9a-fA-F]{40}$/.test(b.funder)) return Response.json({ error: "vessel, port and a funding wallet are required" }, { status: 400 });
  const ports: Record<string, string | null> = { FIKTK: null, FIHEL: "Helsinki", FITKU: "Turku" };
  if (!(b.port in ports)) return Response.json({ error: "port must be FIKTK, FIHEL or FITKU" }, { status: 400 });
  const cap = BigInt(b.capUusdc ?? 2_000_000); if (cap < 100_000n || cap > 10_000_000n) return Response.json({ error: "cap must be between 0.10 and 10 USDC" }, { status: 400 });
  const t = b.terms ?? {};
  const terms = { laytimeMinutes: Number(t.laytimeMinutes ?? 36 * 60), turnTimeMinutes: Number(t.turnTimeMinutes ?? 360), norRule: t.norRule ?? "WIBON", weatherWorkingDays: t.weatherWorkingDays ?? true, shex: !!t.shex, holidays: t.holidays ?? [], reversible: !!t.reversible,
    demurrageUusdcPerDay: String(t.demurrageUusdcPerDay ?? 18_000_000_000), despatchUusdcPerDay: String(t.despatchUusdcPerDay ?? 9_000_000_000), onceOnDemurrage: t.onceOnDemurrage ?? true, tz: "Europe/Helsinki" };
  const r = await createVoyage({ vessel: b.vessel, mmsi: b.mmsi, imo: b.imo ? Number(b.imo) : undefined, port: b.port, portQuery: ports[b.port], funder: b.funder, capUusdc: cap, terms });
  return Response.json({ ...r, capUusdc: cap.toString(), termsHash: hashCanonical(terms) });
}
