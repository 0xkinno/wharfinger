import { notFound } from "next/navigation";
import { loadStatement } from "@/lib/statements";
import { VerifyAndCountersign } from "@/components/VerifyPanel";
export const dynamic = "force-dynamic"; export const maxDuration = 60;
export default async function VerifyOne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const r = await loadStatement(id); if (!r) notFound();
  return (<div className="space-y-6"><div><p className="eyebrow mb-2">Owner verify {r.draft ? ", analyst has not signed" : ""}</p><h1 className="text-5xl">{r.statement.body.voyage.vessel}, {r.statement.body.voyage.port}</h1><p className="text-muted mt-2 max-w-[46em]">Recompute every line, then accept or dispute named lines with your own wallet.</p></div><VerifyAndCountersign statement={r.statement} voyageId={id} draft={r.draft} /></div>);
}
