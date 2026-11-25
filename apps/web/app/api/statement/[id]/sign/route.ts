import { q } from "@/lib/db";
import { getVoyage, statementFor } from "@/lib/voyages";
import { verifyStatement, type SignedStatement } from "@pk/statement/src/index.ts";
import { missingEnv, notConfigured } from "@/lib/guard";
export const dynamic = "force-dynamic"; export const maxDuration = 60;
// The analyst signed the EIP-712 message in the browser. The server rebuilds the draft, checks the signature against it,
// then stores the frozen snapshot. Only the funding wallet may sign as the analyst.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const m = missingEnv(["DATABASE_URL"]); if (m.length) return notConfigured(m); }
  const { id } = await params; const v = await getVoyage(id); if (!v) return Response.json({ error: "no such voyage" }, { status: 404 });
  const b = await req.json(); if (!v.funder_address || String(b.address).toLowerCase() !== v.funder_address.toLowerCase()) return Response.json({ error: "only the funding wallet signs as the analyst" }, { status: 403 });
  const draft = await statementFor(v); if (draft.statementHash !== b.statementHash) return Response.json({ error: "the statement changed since it was shown; reload and sign again", current: draft.statementHash }, { status: 409 });
  if (draft.body.result.reviewMinutes > 0) return Response.json({ error: `${draft.body.result.reviewMinutes} minutes are still in REVIEW; resolve them before signing` }, { status: 422 });
  const signed: SignedStatement = { ...draft, analyst: { address: b.address, signature: b.signature } };
  const ver = await verifyStatement(signed); if (!ver.pass) return Response.json({ error: "signature does not verify", checks: ver.checks.filter((c) => !c.pass) }, { status: 422 });
  await q("insert into signatures (voyage_id, role, statement_hash, address, signature, statement) values ($1,'ANALYST',$2,$3,$4,$5)", [id, draft.statementHash, b.address.toLowerCase(), b.signature, JSON.stringify(draft)]);
  await q("update voyages set status='SIGNED' where id=$1 and status in ('WATCHING','ENDED')", [id]);
  return Response.json({ ok: true, statementHash: draft.statementHash });
}
