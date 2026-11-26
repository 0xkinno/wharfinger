import { resolvePort, portQueue, PORTS, type QueueAnswer } from "@pk/truth/src/portqueue.ts";
export const dynamic = "force-dynamic"; export const maxDuration = 30;
// Telegraph miner endpoint for LIVE_PORT_CONGESTION_GENERAL. Keyless, read only, cached for 60 seconds per port.
const cache = new Map<string, { at: number; v: QueueAnswer }>();
export async function GET(req: Request) {
  const port = new URL(req.url).searchParams.get("port");
  if (!port) return Response.json({ error: "port is required: a Finnish port name or UN/LOCODE", covered: PORTS.map((p) => p.locode) }, { status: 400 });
  const def = resolvePort(port);
  if (!def) return Response.json({ error: "port_not_covered", requested: port, covered: PORTS.map((p) => ({ locode: p.locode, name: p.name })) }, { status: 404 });
  const now = Date.now(); const hit = cache.get(def.locode);
  if (hit && now - hit.at < 60_000) return Response.json(hit.v);
  try { const v = await portQueue(def, now); cache.set(def.locode, { at: now, v }); return Response.json(v); }
  catch (e: any) { return Response.json({ error: "upstream_unavailable", detail: String(e.message).slice(0, 120) }, { status: 502 }); }
}
