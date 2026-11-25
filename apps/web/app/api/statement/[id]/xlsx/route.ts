import { loadStatement } from "@/lib/statements";
import { statementXlsx } from "@/lib/render";
export const dynamic = "force-dynamic"; export const maxDuration = 60; export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const r = await loadStatement(id); if (!r) return new Response("no such voyage", { status: 404 });
  const buf = await statementXlsx(r.statement);
  return new Response(new Uint8Array(buf), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="${id}.laytime.xlsx"` } });
}
