import Link from "next/link";
import { GlowCard } from "@/components/ui";
import { SettleDemo } from "@/components/SettleDemo";
import { statementDemo } from "@/lib/demo";
import screening from "../../fixtures/settlement-screening.json";
import run from "../../fixtures/settlement-run.json";
export const dynamic = "force-dynamic";
export const metadata = { title: "Settlement gate" };
export default async function Settle() {
  const demo = await statementDemo(); const done = run.results.length > 0;
  return (<div className="space-y-10">
    <div><p className="eyebrow mb-2">Verified trade, before the money moves</p><h1 className="text-5xl mb-3">Settlement gate</h1>
      <p className="text-muted max-w-[48em]">A demurrage invoice is only as good as the statement behind it. The gate decides whether a payment may go out: the statement must recompute, both keys must match the mandate, the payee must have a paid screening receipt that is clear, and the amount must sit inside the payer's authority. Anything else holds, escalates or blocks. The gate never moves money; a rail does, and the gate then checks what the rail did.</p></div>
    {demo ? <SettleDemo demoId={demo.id} screening={screening as any} run={run as any} /> : <GlowCard className="p-6 text-muted">The sample statement is unavailable right now.</GlowCard>}
    <div className="grid md:grid-cols-3 gap-4">
      <GlowCard className="p-5"><div className="eyebrow mb-1">Real</div><p className="text-sm">Two sanctions screenings bought on Telegraph testnet from miner 731002, with receipts. The statement recompute runs in your browser right now.</p></GlowCard>
      <GlowCard className="p-5"><div className="eyebrow mb-1">Illustrative</div><p className="text-sm">The payee name and the charter terms. The payment token is a worthless devnet test mint, not USDC. Nothing here is mainnet.</p></GlowCard>
      <GlowCard className="p-5"><div className="eyebrow mb-1">{done ? "Recorded on Solana devnet" : "Solana devnet run"}</div><p className="text-sm">{done ? "The release was sent on devnet with the statement hash in the memo, then read back from the chain and checked against the decision." : "The devnet transfer is pending: the settlement wallet needs devnet SOL. The decisions above do not depend on it."}</p></GlowCard></div>
    <p className="text-xs text-muted">Name screening can false-positive, so a match is escalated to a person and never decided by code. A missing receipt holds. Source: <Link className="underline" href="https://github.com/0xkinno/wharfinger/blob/main/packages/settle/src/index.ts">packages/settle</Link>, run: <code className="mono">scripts/solana-settle.ts</code>.</p></div>);
}
