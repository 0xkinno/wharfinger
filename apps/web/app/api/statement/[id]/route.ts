import { loadStatement } from "@/lib/statements";
export const dynamic = "force-dynamic"; export const maxDuration = 60;
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const r = await loadStatement(id); if (!r) return Response.json({ error: "no such voyage" }, { status: 404 });
  const dl = new URL(req.url).searchParams.has("download");
  return new Response(JSON.stringify({ ...r.statement, _draft: undefined }, null, 1), { headers: { "content-type": "application/json", "x-statement-draft": String(r.draft), ...(dl ? { "content-disposition": `attachment; filename="${id}.statement.json"` } : {}), "cache-control": "no-store" } });
}
