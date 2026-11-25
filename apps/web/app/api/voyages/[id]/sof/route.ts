import { q } from "@/lib/db";
import { getVoyage } from "@/lib/voyages";
import { verifyWrite } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const v = await getVoyage(id); if (!v) return Response.json({ error: "no such voyage" }, { status: 404 });
  const b = await req.json();
  if (!v.funder_address || !(await verifyWrite({ action: "update-sof", id, payload: b.payload, ts: b.ts, address: v.funder_address, signature: b.signature }))) return Response.json({ error: "signature from the funding wallet required" }, { status: 401 });
  const sof = b.payload.sof, res = b.payload.resolutions ?? {};
  const kinds = ["NOR_TENDERED", "NOR_ACCEPTED", "ALL_FAST", "LOADING_START", "LOADING_STOP", "LOADING_RESUME", "COMPLETED", "DOCS_ON_BOARD"];
  if (!Array.isArray(sof) || sof.some((e: any) => !kinds.includes(e.kind) || !Number.isInteger(e.at))) return Response.json({ error: "invalid SOF events" }, { status: 400 });
  await q("update voyages set sof=$2, resolutions=$3 where id=$1", [id, JSON.stringify(sof), JSON.stringify(res)]);
  if (b.payload.note) await q("insert into notes (voyage_id, author, body) values ($1,$2,$3)", [id, v.funder_address, String(b.payload.note).slice(0, 2000)]);
  return Response.json({ ok: true });
}
