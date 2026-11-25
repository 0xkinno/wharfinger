import { VerifyBox } from "@/components/VerifyPanel";
import { q, safe } from "@/lib/view";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function VerifyHome() {
  const vs = await safe(() => q("select id, vessel, status from voyages where house=false order by created_at desc"), [] as any[]);
  return (<div className="space-y-8"><div><p className="eyebrow mb-2">Verify</p><h1 className="text-5xl mb-2">Do not trust us. Recompute.</h1><p className="text-muted max-w-[46em]">Paste a statement, or open a voyage's owner page. The laytime engine runs in this browser, every signal is re-derived, and each signal is fetched from the Telegraph node and compared.</p></div>
    <VerifyBox /><div><h2 className="text-2xl mb-3">Statements on this site</h2><div className="flex flex-wrap gap-2">{vs.map((v: any) => <Link key={v.id} className="btn ghost" href={`/verify/${v.id}`}>{v.vessel} ({v.status})</Link>)}</div></div></div>);
}
