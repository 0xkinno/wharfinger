import { summary } from "@/lib/store";
import { hasDb } from "@/lib/db";
export const dynamic = "force-dynamic";
// Recomputed from the purchases on every call. No number is typed anywhere. Without a database it recomputes from the committed real fixtures and says so.
export async function GET() {
  const s = await summary(); const rows = s.rows;
  const byReason: Record<string, number> = {}; for (const r of rows) if (r.verdict_ok === false) for (const c of r.refusals) byReason[c] = (byReason[c] ?? 0) + 1;
  return Response.json({ source: hasDb() ? "database" : "committed fixtures (no DATABASE_URL set)", voyages: s.voyages, purchases: rows.length, paidAnswers: s.paid, refusedAnswers: s.refused, refusalsByReason: byReason, providerErrors: rows.filter((r) => r.status >= 400).length, vesselAnswers: rows.filter((r) => r.kind === "vessel" && r.status === 200).length, spentUusdc: s.spent, costPerPaidAnswerUusdc: s.paid ? (BigInt(s.spent) / BigInt(s.paid)).toString() : null, at: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
}
