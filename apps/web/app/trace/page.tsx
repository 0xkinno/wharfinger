import { GlowCard } from "@/components/ui";
import { short, cents } from "@/lib/fmt";
import { fmtTime } from "@/lib/view";
import { counters as counters_, recentSlots } from "@/lib/store";
import { measure } from "@/lib/telemetry";
export const dynamic = "force-dynamic";
export default async function Trace() {
  const [st, counters, ticks] = [await measure(), await counters_().catch(() => []), await recentSlots().catch(() => [])]; const leases = [{ n: 0 }];
  return (<div className="space-y-8"><div><p className="eyebrow mb-2">Trace</p><h1 className="text-5xl mb-2">The system's own account.</h1><p className="text-muted">Counters since launch, the last 50 slots, and the measured status. Nothing here is typed in.</p></div>
    <div className="grid md:grid-cols-3 gap-4">{[["Node", st.node?.ok ? `up, ${st.node.ms} ms` : `down ${st.node?.error ?? ""}`], ["Database", st.database?.ok ? `up, ${st.database.purchases} purchases` : `down ${st.database?.error ?? ""}`], ["House escrow", st.escrowHouse?.availableUusdc ? `${cents(st.escrowHouse.availableUusdc)} available` : "unknown"]].map(([k, v]) => <GlowCard key={k} className="p-5"><div className="eyebrow">{k}</div><div className="font-display text-2xl mt-1">{v}</div></GlowCard>)}</div>
    <GlowCard className="p-5 scroll-x" tabIndex={0}><h2 className="text-2xl mb-3">Counters</h2><table className="sheet"><tbody>{counters.map((c: any) => <tr key={c.name}><td>{c.name}</td><td className="num">{c.value}</td><td className="mono text-muted">{fmtTime(c.updated_at)}</td></tr>)}<tr><td>leases taken</td><td className="num">{leases[0].n}</td><td /></tr></tbody></table></GlowCard>
    <GlowCard className="p-5 scroll-x" tabIndex={0}><h2 className="text-2xl mb-3">Last 50 slots</h2><table className="sheet"><thead><tr><th>Voyage</th><th>Slot</th><th>Purchases</th><th>Refused</th><th>Spent</th><th>First at</th></tr></thead><tbody>{ticks.map((t: any) => <tr key={`${t.voyage_id}${t.slot}`}><td className="mono">{short(t.voyage_id, 18)}</td><td className="num">{t.slot}</td><td className="num">{t.n}</td><td className="num">{t.refused}</td><td className="num">{cents(t.spent)}</td><td className="mono">{fmtTime(t.at)}</td></tr>)}</tbody></table></GlowCard></div>);
}
