import Link from "next/link";
import { JudgeConsole } from "@/components/JudgeConsole";
import { FaultButtons } from "@/components/FaultButtons";
import { statementDemo } from "@/lib/demo";
import { GlowCard } from "@/components/ui";
import { cents } from "@/lib/fmt";
import { measure } from "@/lib/telemetry";
import { judgeSpentToday } from "@/lib/store";
export const dynamic = "force-dynamic"; export const maxDuration = 60;
export default async function Judge() {
  const demo = await statementDemo(); const st = await measure();
  const spent = await judgeSpentToday().catch(() => "0");
  const walk = [["Run it", "Type a ship that is in port now (below). The house key buys two answers; you see the miners, receipts and which operators agreed.", "#run"], ["Check it", "Open the statement built from real answers: the demurrage figure, intervals and receipts stapled to lines.", demo ? `/statement/${demo.id}` : "/harbour"], ["Inspect it", "Every purchase with miner, operator, source family, cost, latency, signal link, receipt hash, epoch.", "/evidence"], ["Break it", "The failure buttons run the real code on real saved answers.", "#break"], ["Reproduce it", "Clean clone, no keys: pnpm install, then pnpm verify examples/statement.sample.json.", "https://github.com/0xkinno/wharfinger#run-it"]];
  return (<div className="space-y-10"><div><p className="eyebrow mb-2">For judges</p><h1 className="text-5xl mb-2">Sixty seconds, no login.</h1><p className="text-muted max-w-[46em]">The five verbs from the rules: run it, check it, inspect it, break it, reproduce it. Testnet only. Mira is a fictional analyst; ships, positions and receipts are real.</p></div>
    <div className="grid md:grid-cols-5 gap-3">{walk.map(([t, b, h], i) => <Link key={t} href={h}><GlowCard className="p-4 h-full"><div className="mono text-muted">{i + 1}</div><div className="font-display text-2xl">{t}</div><p className="text-sm text-muted mt-1">{b}</p></GlowCard></Link>)}</div>
    <div id="run"><JudgeConsole /></div><div id="break"><FaultButtons demoId={demo?.id ?? null} /></div>
    <div className="grid md:grid-cols-3 gap-4"><GlowCard className="p-5"><div className="eyebrow">House key spent today</div><div className="font-display text-3xl num">{cents(spent)}</div><div className="text-sm text-muted">daily ceiling $0.60</div></GlowCard><GlowCard className="p-5"><div className="eyebrow">House escrow available</div><div className="font-display text-3xl num">{st.escrowHouse?.availableUusdc ? cents(st.escrowHouse.availableUusdc) : "n/a"}</div></GlowCard><GlowCard className="p-5"><div className="eyebrow">Node, database</div><div className="font-display text-3xl">{st.node?.ok ? "up" : "down"}, {st.database?.ok ? "up" : "down"}</div></GlowCard></div>
    <GlowCard className="p-6"><h2 className="text-3xl mb-3">Limits, stated plainly</h2><ul className="list-disc ml-5 space-y-2 text-[15px]"><li>Operators that agree on a ship's position often relay one public feed (Digitraffic AIS). Each receipt shows its source family; "one upstream" is not independent corroboration.</li><li>Hourly rain cannot be bought on Telegraph. A weather exception needs a daily precipitation fact from two operators and a Statement of Facts line; otherwise the interval is REVIEW.</li><li>The Kotka port queue is not purchasable: the miners answer for Hanko or return empty figures. Helsinki and Turku work.</li><li>Zone geometry is a draft derived from ships at berth, not chart-derived port limits.</li><li>A receipt becomes provable against its epoch block only after that epoch closes, which takes hours here.</li></ul></GlowCard></div>);
}
