import Link from "next/link";
import { notFound } from "next/navigation";
import { GlowCard, Chip } from "@/components/ui";
import { short, cents } from "@/lib/fmt";
import { getVoyage, purchasesOf, factsFrom, ledgerOf, revive, toAnswer } from "@/lib/voyages";
import { computeLaytime } from "@pk/laytime/src/index.ts";
import { minerInfo, checkVessel } from "@pk/evidence/src/index.ts";
import { fmtTime, epochNow } from "@/lib/view";
import { SofEditor } from "@/components/SofEditor";
export const dynamic = "force-dynamic";

export default async function VoyagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const v = await getVoyage(id); if (!v) notFound();
  const rows = await purchasesOf(id); const { facts, cors } = factsFrom(rows); const led = await ledgerOf(v.voyage_address); const epoch = await epochNow();
  const r = v.sof.length ? computeLaytime(revive(v.terms), v.sof, facts, v.resolutions) : null;
  const paid = rows.filter((x) => x.receipt_hash).length; const refused = rows.filter((x) => x.verdict_ok === false).length;
  return (<div className="space-y-10">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow mb-2">Voyage {v.label ? `, ${v.label}` : ""}</p><h1 className="text-5xl">{v.vessel}</h1><p className="mono text-muted mt-1">{v.port_locode}{v.mmsi ? `, MMSI ${v.mmsi}` : ""}, voyage key {short(v.voyage_address, 8)}</p></div>
      <div className="flex gap-2 items-center flex-wrap"><Chip s={v.status} />{r && r.reviewMinutes > 0 && <Chip s="REVIEW" label={`Review ${r.reviewMinutes} min`} />}<Link className="btn" href={`/statement/${id}`}>Statement</Link></div></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[["Paid answers", String(paid)], ["Refused by our rules", String(refused)], ["Escrow available", led ? cents(led.available) : "n/a"], ["Cap deposited", cents(v.cap_uusdc)]].map(([k, x]) => <GlowCard key={k} className="p-5"><div className="eyebrow">{k}</div><div className="font-display text-3xl num mt-1">{x}</div></GlowCard>)}</div>
    {r ? <GlowCard className="p-6"><h2 className="text-3xl mb-3">Laytime clock</h2><div className="grid sm:grid-cols-4 gap-4 text-sm"><div><div className="eyebrow">NOR</div><div>{r.nor.reason.replaceAll("_", " ").toLowerCase()}</div></div><div><div className="eyebrow">Counted</div><div className="num text-xl">{r.usedMinutes} min</div></div><div><div className="eyebrow">Excepted</div><div className="num text-xl">{r.exceptedMinutes} min</div></div><div><div className="eyebrow">On demurrage</div><div className={`num text-xl ${r.demurrageMinutes ? "text-flag" : ""}`}>{r.demurrageMinutes} min</div></div></div></GlowCard>
      : <GlowCard className="p-6 text-muted">No Statement of Facts yet, so there is no clock. Add the Notice of Readiness and events below.</GlowCard>}
    <section><h2 className="text-3xl mb-1">Evidence timeline</h2><p className="text-muted text-sm mb-4">Every purchase, in order, with its three clocks: the authorization window, the signal time, and the epoch that bills it. Epoch {epoch ?? "?"} is the current one; a receipt is provable against its epoch block only after that epoch closes.</p>
      <div className="space-y-3">{rows.length === 0 && <GlowCard className="p-6 text-muted">No purchases yet. The watcher buys on its next 30 minute slot once the voyage is funded.</GlowCard>}
        {rows.map((p) => { const m = minerInfo(String(p.miner_id)); const ok = p.verdict_ok; const closed = epoch !== null && p.epoch_id !== null && p.epoch_id < epoch;
          return (<GlowCard key={p.id} className="p-5"><div className="flex flex-wrap gap-2 items-center justify-between"><div className="flex gap-2 items-center flex-wrap"><span className="eyebrow">{p.kind}</span><span className="font-semibold">{m.slug}</span><span className="mono text-muted">{p.pinned ? "pinned re-buy" : "routed"}</span></div>
            <div className="flex gap-2">{p.status !== 200 ? <Chip s="REFUSED" label={`Node ${p.status}`} /> : ok ? <Chip s="CORROBORATED" label="Passed checks" /> : <Chip s="REFUSED" label={p.refusals.join(", ") || "Refused"} />}{p.receipt_hash && !closed && <Chip s="PENDING" />}</div></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 mt-3 text-sm"><div><span className="eyebrow">Operator</span><div className="mono">{short(m.operator, 8)}</div></div><div><span className="eyebrow">Source family</span><div>{m.family}</div></div><div><span className="eyebrow">Cost, latency</span><div>{cents(p.cost_uusdc)}, {p.ms ?? "?"} ms</div></div><div><span className="eyebrow">Epoch</span><div className="num">{p.epoch_id ?? "none"}</div></div>
              <div><span className="eyebrow">Asked</span><div className="mono">{fmtTime(p.asked_at)}</div></div><div><span className="eyebrow">Signal recorded</span><div className="mono">{fmtTime(p.signal_created_at)}</div></div><div><span className="eyebrow">Receipt</span><div className="mono">{short(p.receipt_hash)}</div></div><div><span className="eyebrow">Signal</span><div className="mono">{p.signal_hash ? <a className="underline" href={`https://devnode.telegraphprotocol.com/engine/v1/signal/${p.signal_hash}`}>{short(p.signal_hash)}</a> : "none"}</div></div></div>
            {p.refusal && <p className="mt-2 text-sm text-flag">Node: {p.refusal}</p>}
            {p.status === 200 && p.result && <pre tabIndex={0} className="mono mt-3 bg-paper rounded-xl p-3 overflow-x-auto text-[12px]">{JSON.stringify(p.result).length > 900 ? JSON.stringify(p.result).slice(0, 900) + " ... (full answer in the signal)" : JSON.stringify(p.result)}</pre>}
          </GlowCard>); })}</div></section>
    <section><h2 className="text-3xl mb-3">Corroboration by 30 minute slot</h2><div className="card p-4 scroll-x" tabIndex={0}><table className="sheet"><thead><tr><th>Slot</th><th>Result</th><th>Operators</th><th>Independence</th><th>Note</th></tr></thead><tbody>{cors.map((c) => <tr key={c.slot}><td className="num">{c.slot}</td><td><Chip s={c.status} /></td><td className="num">{c.operators}</td><td>{c.independence ? <Chip s={c.independence} /> : ""}</td><td className="text-muted">{c.note}</td></tr>)}{cors.length === 0 && <tr><td colSpan={5} className="text-muted">None yet.</td></tr>}</tbody></table></div></section>
    <SofEditor voyageId={id} funder={v.funder_address} sof={v.sof} resolutions={v.resolutions} review={r?.intervals.filter((i) => i.cls === "REVIEW").map((i) => ({ key: `${i.from}-${i.to}`, from: i.from, to: i.to, reason: i.reason })) ?? []} />
    <p className="text-xs text-muted">Zone geometry is a labelled draft derived from AIS positions of vessels at berth. Hourly rain cannot be bought on Telegraph, so weather exceptions use a daily fact plus an SOF line. {void checkVessel}{void toAnswer}</p>
  </div>);
}
