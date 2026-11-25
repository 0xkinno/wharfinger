import { q } from "@/lib/db";
import { checkVessel } from "@pk/evidence/src/index.ts";
import { toAnswer, type PurchaseDb } from "@/lib/voyages";
export const dynamic = "force-dynamic";
// Recomputed from the database on every call. No number is typed anywhere.
export async function GET() {
  const rows = await q<PurchaseDb>("select * from purchases");
  const paid = rows.filter((r) => r.receipt_hash); const refused = rows.filter((r) => r.verdict_ok === false);
  const byReason: Record<string, number> = {}; for (const r of refused) for (const c of r.refusals) byReason[c] = (byReason[c] ?? 0) + 1;
  const vessel = rows.filter((r) => r.kind === "vessel" && r.status === 200);
  void checkVessel; void toAnswer;
  const voy = (await q("select count(*)::int as n from voyages"))[0].n;
  const spent = paid.reduce((a, r) => a + BigInt(r.cost_uusdc), 0n);
  return Response.json({ voyages: voy, purchases: rows.length, paidAnswers: paid.length, refusedAnswers: refused.length, refusalsByReason: byReason, providerErrors: rows.filter((r) => r.status >= 400).length, vesselAnswers: vessel.length, spentUusdc: spent.toString(), costPerPaidAnswerUusdc: paid.length ? (spent / BigInt(paid.length)).toString() : null, at: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
}
