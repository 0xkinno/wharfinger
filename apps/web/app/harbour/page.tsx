import Link from "next/link";
import { GlowCard, Chip } from "@/components/ui";
import { fmtTime } from "@/lib/view";
import { voyages, purchases } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Harbour({ searchParams }: { searchParams: Promise<{ port?: string }> }) {
  const { port } = await searchParams;
  const vs = await voyages(); const ps = await purchases(5000);
  const rows: any[] = vs.map((v) => { const mine = ps.filter((p) => p.voyage_id === v.id && p.receipt_hash); return { ...v, paid: mine.length, last: mine.map((p) => p.asked_at).sort().at(-1) ?? null }; });
  const list = port ? rows.filter((r: any) => r.port_locode === port) : rows;
  return (<div><p className="eyebrow mb-2">Harbour</p><h1 className="text-5xl mb-6">Every watched voyage.</h1>
    <div className="flex gap-2 mb-6 flex-wrap">{[["", "All"], ["FIKTK", "Kotka"], ["FIHEL", "Helsinki"], ["FITKU", "Turku"]].map(([p, t]) => <Link key={p} href={p ? `/harbour?port=${p}` : "/harbour"} className={`btn ${port === p || (!port && !p) ? "" : "ghost"} !py-1.5`}>{t}</Link>)}</div>
    {list.length === 0 ? <GlowCard className="p-8"><p className="mb-3">No voyage here yet.</p><Link className="btn" href="/voyage/new">Start a voyage</Link></GlowCard> :
      <div className="grid md:grid-cols-2 gap-4">{list.map((v: any) => (<Link key={v.id} href={`/voyage/${v.id}`}><GlowCard className="p-6"><div className="flex justify-between items-start"><div><div className="font-display text-3xl">{v.vessel}</div><div className="mono text-muted">{v.port_locode}{v.mmsi ? `, MMSI ${v.mmsi}` : ""}</div></div><Chip s={v.status} /></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><div className="eyebrow">Paid answers</div><div className="num text-xl">{v.paid}</div></div><div><div className="eyebrow">Last receipt</div><div className="mono">{v.last ? fmtTime(v.last).slice(5, 16) : "none"}</div></div><div><div className="eyebrow">Cap</div><div className="num text-xl">${(Number(v.cap_uusdc) / 1e6).toFixed(2)}</div></div></div>
        {v.label && <div className="mt-3 text-xs text-muted">{v.label}</div>}</GlowCard></Link>))}</div>}</div>);
}
