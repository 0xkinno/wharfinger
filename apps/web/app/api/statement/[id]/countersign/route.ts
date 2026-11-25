import { q } from "@/lib/db";
import { loadStatement } from "@/lib/statements";
import { verifyStatement } from "@pk/statement/src/index.ts";
export const dynamic = "force-dynamic"; export const maxDuration = 60;
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const r = await loadStatement(id); if (!r || r.draft) return Response.json({ error: "the analyst has not signed this statement" }, { status: 409 });
  const b = await req.json(); const s = { ...r.statement, countersign: { address: b.address, decision: b.decision, disputedLines: b.disputedLines ?? [], reason: b.reason ?? "", signature: b.signature } } as any;
  if (b.decision === "DISPUTE" && (!s.countersign.disputedLines.length || !s.countersign.reason)) return Response.json({ error: "a dispute names the lines and gives a reason" }, { status: 400 });
  const ver = await verifyStatement(s); const bad = ver.checks.filter((c) => !c.pass && c.name !== "analyst signature");
  if (bad.length) return Response.json({ error: "countersignature does not verify", checks: bad }, { status: 422 });
  await q("insert into signatures (voyage_id, role, statement_hash, address, signature, decision, disputed_lines, reason) values ($1,'OWNER',$2,$3,$4,$5,$6,$7)", [id, r.statement.statementHash, String(b.address).toLowerCase(), b.signature, b.decision, s.countersign.disputedLines, s.countersign.reason]);
  await q("update voyages set status=$2 where id=$1", [id, b.decision === "ACCEPT" ? "AGREED" : "DISPUTED"]);
  return Response.json({ ok: true });
}
