import Link from "next/link";
import { notFound } from "next/navigation";
import { GlowCard, Chip } from "@/components/ui";
import { short, usd } from "@/lib/fmt";
import { loadStatement } from "@/lib/statements";
import { getVoyage } from "@/lib/voyages";
import { SignPanel } from "@/components/SignPanel";
import { LaytimeBar } from "@/components/LaytimeBar";
export const dynamic = "force-dynamic"; export const maxDuration = 60;
const t = (m: number) => new Date(m * 60000).toISOString().slice(0, 16).replace("T", " ");
export default async function StatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const v = await getVoyage(id); const r = await loadStatement(id); if (!v || !r) notFound();
  const s = r.statement, b = s.body;
  return (<div className="space-y-8"><div className="flex flex-wrap justify-between items-start gap-4"><div><p className="eyebrow mb-2">Laytime statement {r.draft ? ", draft" : ""}</p><h1 className="text-5xl">{b.voyage.vessel}, {b.voyage.port}</h1><p className="text-muted text-sm mt-2 max-w-[48em]">{b.labels.persona}. {b.labels.sof}</p></div>
    <div className="flex gap-2 flex-wrap"><a className="btn ghost" href={`/api/statement/${id}/pdf`}>PDF</a><a className="btn ghost" href={`/api/statement/${id}/xlsx`}>XLSX</a><a className="btn ghost" href={`/api/statement/${id}?download=1`}>JSON</a><Link className="btn" href={`/verify/${id}`}>Owner verify page</Link></div></div>
    <GlowCard className="p-6"><div className="grid sm:grid-cols-4 gap-5"><div><div className="eyebrow">On demurrage</div><div className="font-display text-4xl num">{(b.result.demurrageMinutes / 60).toFixed(1)} h</div></div><div><div className="eyebrow">Amount</div><div className="font-display text-4xl num">{usd(b.result.amountUusdc)}</div></div><div><div className="eyebrow">Counted, excepted, review</div><div className="num text-lg">{b.result.usedMinutes}, {b.result.exceptedMinutes}, {b.result.reviewMinutes} min</div></div><div><div className="eyebrow">Receipts</div><div className="num text-lg">{b.receipts.length}</div></div></div>
      <p className="text-xs text-muted mt-4">Rounding: floor on total minutes, integer uUSDC, which never overstates the owner's liability. Engine {b.engineVersion}. Zone geometry {b.geometry.version}. Statement hash <span className="mono break-all">{s.statementHash}</span></p></GlowCard>
    <GlowCard className="p-6"><h2 className="text-3xl mb-4">The stay, to scale</h2><LaytimeBar intervals={b.result.intervals} /></GlowCard>
    <GlowCard className="p-6 scroll-x" tabIndex={0}><h2 className="text-3xl mb-3">Time sheet</h2><table className="sheet"><thead><tr><th>From (UTC)</th><th>To (UTC)</th><th className="r">Min</th><th>Class</th><th>Reason</th><th>Receipts, stapled</th></tr></thead><tbody>{b.result.intervals.map((i) => <tr key={`${i.from}`}><td className="num">{t(i.from)}</td><td className="num">{t(i.to)}</td><td className="num">{i.minutes}</td><td><Chip s={i.cls === "COUNTS" ? "WATCHING" : i.cls === "EXCEPTED" ? "CORROBORATED" : i.cls === "REVIEW" ? "REVIEW" : "INSUFFICIENT"} label={i.cls + (i.onDemurrage ? " / demurrage" : "")} /></td><td className="text-muted">{i.reason.replaceAll("_", " ").toLowerCase()}</td><td className="mono">{i.receipts.map((x) => <span key={x} className="chip brass mr-1"><i />{short(x, 8)}</span>)}</td></tr>)}</tbody></table></GlowCard>
    <GlowCard className="p-6"><h2 className="text-3xl mb-3">Receipts on this statement</h2><div className="scroll-x" tabIndex={0}><table className="sheet"><thead><tr><th>Receipt</th><th className="r">Epoch</th><th>Miner</th><th>Operator</th><th>Source family</th><th>Signal</th></tr></thead><tbody>{b.receipts.map((x) => <tr key={x.receiptHash}><td className="mono">{short(x.receiptHash, 12)}</td><td className="num">{x.epochId ?? "pending"}</td><td className="mono">{x.minerId}</td><td className="mono">{short(x.operator, 8)}</td><td>{x.family}</td><td className="mono"><a className="underline" href={`https://devnode.telegraphprotocol.com/engine/v1/signal/${x.signalHash}`}>{short(x.signalHash, 10)}</a></td></tr>)}</tbody></table></div></GlowCard>
    <GlowCard className="p-6"><h2 className="text-3xl mb-3">Signatures</h2><div className="space-y-2 text-sm">
      <div>Analyst: {s.analyst ? <><Chip s="SIGNED" /> <span className="mono">{short(s.analyst.address, 8)}</span></> : <span className="text-muted">not signed</span>}</div>
      <div>Owner: {s.countersign ? <><Chip s={s.countersign.decision === "ACCEPT" ? "AGREED" : "DISPUTED"} /> <span className="mono">{short(s.countersign.address, 8)}</span></> : <span className="text-muted">not countersigned</span>}</div></div>
      {r.draft && <div className="mt-4"><SignPanel voyageId={id} statement={s} funder={v.funder_address} review={b.result.reviewMinutes} /></div>}</GlowCard></div>);
}
