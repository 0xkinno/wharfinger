import Link from "next/link";
import { HarbourScene } from "@/components/HarbourScene";
import { GlowCard, Chip } from "@/components/ui";
import { cents } from "@/lib/fmt";
import { summary, voyages } from "@/lib/store";
import { statementDemo } from "@/lib/demo";
import { Tour } from "@/components/Tour";
import { VerifyBox } from "@/components/VerifyPanel";
export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await summary().catch(() => null);
  const board = (await voyages().catch(() => [])).slice(0, 4);
  const demo = await statementDemo();
  return (
    <div className="space-y-24">
      <section className="grid md:grid-cols-[1.05fr_.95fr] gap-8 items-center pt-4" data-tour="hero">
        <div data-text>
          <p className="eyebrow mb-3">Demurrage analysts, laytime, Telegraph testnet</p>
          <h1 className="text-[44px] sm:text-[64px]">Every disputed hour, with a receipt.</h1>
          <p className="mt-5 text-lg text-muted max-w-[34em]">Wharfinger watches a ship in port and buys the facts on Telegraph while they are still true, so your laytime statement settles instead of arguing.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link className="btn" href="/judge">Open a live voyage</Link><a className="btn ghost" href="#settles">How a receipt settles an hour</a><Tour /></div>
          <p className="mt-5 text-xs text-muted">Telegraph testnet. Mira is a fictional analyst; the ships and the weather are real.</p>
        </div>
        <div><HarbourScene /></div>
      </section>

      <section id="settles" className="grid md:grid-cols-[1fr_1.1fr] gap-10" data-text>
        <div><p className="eyebrow mb-2">The $750 hour</p><h2 className="text-4xl">02:40 on a Saturday at Kotka.</h2></div>
        <div className="space-y-4 text-[17px]">
          <p>The Master tenders Notice of Readiness. Snow stops the loaders twice before dawn. Three weeks later the owner bills 41 hours of demurrage at $18,000 a day, which is $750 an hour, and the analyst has one handwritten page to argue with.</p>
          <p className="text-muted text-sm">The rate and hours are an invented example. Industry sources put demurrage rates at $15,000 to $30,000 a day, and dry bulk demurrage at $8 to 10 billion a year, with 99% of statements of facts still processed by hand. Sources, quoted exactly, are in the repository (<code className="mono">MOMENT.md</code>); they come from vendors that sell demurrage software.</p>
        </div>
      </section>

      <section data-tour="how"><p className="eyebrow mb-2">How it watches</p><h2 className="text-4xl mb-8">Three steps. No model sets a number.</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[["Watch and buy now", "Telegraph sells an answer only while it is current: a paid authorization lives two minutes and its nonce works once. So every 30 minutes the watcher buys vessel position, port wait and conditions, from a key your wallet funded.", "01"],
            ["Two operators must agree", "A fact moves an hour only when two operators agree. Where they relay the same feed the receipt says so. Wrong place, stale, empty and disagreeing answers are refused, kept, and re-bought elsewhere.", "02"],
            ["Sign, and let the owner check", "Code classifies each interval. You resolve REVIEW and sign with your wallet. The owner recomputes every line from the signals, in the browser or offline, then countersigns or disputes named lines.", "03"]].map(([t, b, n]) => (
            <GlowCard key={n} className="p-6"><span className="mono text-muted">{n}</span><h3 className="text-2xl mt-2 mb-2">{t}</h3><p className="text-[15px] text-muted">{b}</p></GlowCard>))}
        </div></section>

      <section data-tour="board"><div className="flex items-end justify-between mb-5"><div><p className="eyebrow mb-2">Harbour board</p><h2 className="text-4xl">Watched now.</h2></div><Link className="underline text-sm" href="/harbour">All voyages</Link></div>
        <div className="grid md:grid-cols-2 gap-4">{board.length ? board.map((v) => (
          <Link key={v.id} href={`/voyage/${v.id}`}><GlowCard className="p-5 flex items-center justify-between"><div><div className="font-display text-2xl">{v.vessel}</div><div className="mono text-muted">{v.port_locode} {v.label ? `, ${v.label}` : ""}</div></div><Chip s={v.status} /></GlowCard></Link>)) : <GlowCard className="p-6 text-muted">No voyage is being watched yet. <Link className="underline" href="/voyage/new">Start one</Link>.</GlowCard>}</div></section>

      <section className="grid md:grid-cols-[.9fr_1.1fr] gap-10 items-start" data-tour="sheet">
        <div data-text><p className="eyebrow mb-2">A time sheet, stapled</p><h2 className="text-4xl mb-4">One real statement.</h2><p className="text-muted mb-5">Built from answers bought on Telegraph testnet: the receipts and signals are real; the charter terms and Statement of Facts are illustrative. Download it in the formats desks already exchange.</p>
          <div className="flex flex-wrap gap-2 text-sm">{demo && <><Link className="btn ghost" href={`/statement/${demo.id}`}>Open statement</Link><a className="btn ghost" href={`/api/statement/${demo.id}/pdf`}>PDF</a><a className="btn ghost" href={`/api/statement/${demo.id}/xlsx`}>XLSX</a><a className="btn ghost" href={`/api/statement/${demo.id}?download=1`}>JSON</a></>}</div></div>
        {demo ? (<GlowCard className="p-6"><table className="sheet"><thead><tr><th>From (UTC)</th><th>Min</th><th>Class</th><th>Receipts</th></tr></thead><tbody>{demo.rows.map((r, i) => (<tr key={i}><td className="num">{r.from}</td><td className="num">{r.minutes}</td><td><Chip s={r.cls === "COUNTS" ? "WATCHING" : r.cls === "EXCEPTED" ? "CORROBORATED" : r.cls === "REVIEW" ? "REVIEW" : "INSUFFICIENT"} label={r.cls} /></td><td className="mono">{r.receipts ? <span className="chip brass"><i />{r.receipts} stapled</span> : ""}</td></tr>))}</tbody></table>
          <p className="mt-4 text-sm"><b>{demo.demurrage}</b> on demurrage, statement hash <span className="mono">{demo.hash}</span></p></GlowCard>) : <GlowCard className="p-6 text-muted">The sample statement is unavailable right now.</GlowCard>}
      </section>

      <section data-tour="verify"><p className="eyebrow mb-2">Check it yourself</p><h2 className="text-4xl mb-5">Paste a statement. Recompute in your browser.</h2><VerifyBox /></section>

      <section><p className="eyebrow mb-2">Measured</p><h2 className="text-4xl mb-5">From the database, not from this page.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[["Voyages", stats ? String(stats.voyages) : "n/a"], ["Paid Telegraph answers", stats ? String(stats.paid) : "n/a"], ["Answers refused by our rules", stats ? String(stats.refused) : "n/a"], ["Spent on answers", stats ? cents(stats.spent) : "n/a"]].map(([k, v]) => <GlowCard key={k} className="p-5"><div className="eyebrow">{k}</div><div className="font-display text-4xl mt-1 num">{v}</div></GlowCard>)}</div>
        <p className="text-sm text-muted mt-4">Live from <Link className="underline" href="/api/stats">/api/stats</Link>. What the data does not show yet is named in <Link className="underline" href="/judge">the judge page</Link>: corroborating operators often relay one feed, hourly rain cannot be bought, and the Kotka port queue is not purchasable.</p></section>

      <section className="card p-8" data-tour="judges"><p className="eyebrow mb-2">For judges</p><h2 className="text-4xl mb-3">The 60 second path.</h2><p className="text-muted mb-5 max-w-[46em]">Type a ship that is in a Finnish port right now, watch the house key buy two answers, see the receipts and which operators agreed, then break it with the failure buttons.</p><div className="flex gap-3 flex-wrap"><Link className="btn" href="/judge">Go to the judge page</Link><a className="btn ghost" href="https://github.com/0xkinno/wharfinger">Repository</a></div></section>
    </div>
  );
}
