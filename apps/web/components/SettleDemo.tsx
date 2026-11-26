"use client";
import { useEffect, useState } from "react";
import { gate, type Gate, type Mandate, type Screening } from "@pk/settle/src/index.ts";
import type { SignedStatement } from "@pk/statement/src/index.ts";
import { Chip } from "./ui";
import { usd, short } from "@/lib/fmt";

type Run = { at: string | null; network: string; results: { label: string; decision: string; settlement: null | { txid: string; explorer: string; mint: string; payee: string; slot: number; verified: boolean; readBack: { amount: string; memo: string } } }[] };
const chip = (d: string) => (d === "RELEASE" || d === "RELEASE_PARTIAL" ? "AGREED" : d === "BLOCK" ? "REFUSED" : d === "ESCALATE" ? "DISPUTED" : "REVIEW");
const NAME = "Nordic Bulk Owners Oy", BAD = "Rosoboronexport";

export function SettleDemo({ demoId, screening, run }: { demoId: string; screening: Record<string, Screening>; run: Run }) {
  const [rows, setRows] = useState<{ label: string; g: Gate; sc: Screening }[] | null>(null); const [err, setErr] = useState("");
  useEffect(() => { (async () => {
    try {
      const base: SignedStatement = await (await fetch(`/api/statement/${demoId}`)).json();
      const m: Mandate = { payer: "charterer", payeeName: NAME, payeeAddress: "payee", analystAddress: base.analyst!.address, ownerAddress: base.countersign!.address, maxUusdc: 10_000_000_000n };
      const t = structuredClone(base); const i = t.body.result.intervals.length - 1; t.body.result.intervals[i].to += 1; t.body.result.intervals[i].minutes += 1;
      const { countersign: _c, ...unsigned } = base;
      const cases: [string, SignedStatement, Mandate, Screening][] = [
        ["Tampered statement: one minute added", t, m, screening[NAME]],
        ["Owner has not countersigned", unsigned as SignedStatement, m, screening[NAME]],
        ["Payee matches a sanctions list", base, { ...m, payeeName: BAD }, screening[BAD]],
        ["Everything checks", base, m, screening[NAME]]];
      setRows(await Promise.all(cases.map(async ([label, s, mm, sc]) => ({ label, sc, g: await gate(s, mm, sc) }))));
    } catch (e: any) { setErr(String(e.message).slice(0, 140)); }
  })(); }, [demoId, screening]);
  return (<div className="card p-5 scroll-x" tabIndex={0}>
    {err && <p className="text-flag text-sm" role="alert">{err}</p>}
    <table className="sheet"><thead><tr><th>Scenario</th><th>Decision</th><th className="r">Pay now</th><th>Why</th><th>Screening receipt</th><th>On Solana devnet</th></tr></thead>
      <tbody>{(rows ?? []).map(({ label, g, sc }, idx) => { const r = run.results[idx]; return (<tr key={label}><td className="wrapok">{label}</td><td><Chip s={chip(g.decision)} label={g.decision.replace("_", " ")} /></td><td className="num">{g.payUusdc > 0n ? usd(g.payUusdc) : "none"}</td><td className="wrapok text-muted" style={{ minWidth: 240 }}>{g.reasons[0]?.text}</td><td className="mono">{sc ? short(sc.receiptHash, 8) : ""}</td>
        <td className="mono">{g.decision.startsWith("RELEASE") ? (r?.settlement ? <a className="underline" href={r.settlement.explorer}>{short(r.settlement.txid, 6)}</a> : <span className="text-muted">run pending</span>) : <span className="text-muted">no payment</span>}</td></tr>); })}
        {!rows && !err && <tr><td colSpan={6} className="text-muted">Recomputing in this browser.</td></tr>}</tbody></table></div>);
}
