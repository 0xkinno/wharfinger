"use client";
import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { verifyStatement, DOMAIN, TYPES, disputedHash, lineId, type SignedStatement } from "@pk/statement/src/index.ts";
import { recomputeSignalHash } from "@pk/telegraph/src/index.ts";
import { Chip } from "./ui";
import { short, usd } from "@/lib/fmt";

type Out = { pass: boolean; checks: { name: string; pass: boolean; detail: string }[]; firstMismatch: string | null; live?: { checked: number; matched: number; failed: string[] } };

export async function runVerify(s: SignedStatement, live: boolean): Promise<Out> {
  const out: Out = await verifyStatement(s);
  if (live) {
    const failed: string[] = []; let matched = 0; const rs = s.body.receipts.filter((r) => r.signal);
    await Promise.all(rs.map(async (r) => { try { const j = await (await fetch(`https://devnode.telegraphprotocol.com/engine/v1/signal/${r.signalHash}`)).json(); if (recomputeSignalHash(j) === r.signalHash && recomputeSignalHash({ payload: r.signal.payload }) === r.signalHash) matched++; else failed.push(r.signalHash); } catch { failed.push(r.signalHash); } }));
    out.live = { checked: rs.length, matched, failed };
    out.checks.push({ name: "signals match the live node", pass: failed.length === 0, detail: `${matched} of ${rs.length} fetched from the node's public signal endpoint, re-derived, and equal to the embedded copy` });
    out.pass = out.pass && failed.length === 0;
  }
  return out;
}

export function Result({ out }: { out: Out }) {
  return (<div className="card p-5 mt-4" aria-live="polite"><div className="flex items-center gap-3 mb-3"><span className={`font-display text-3xl ${out.pass ? "text-ok" : "text-flag"}`}>{out.pass ? "PASS" : "FAIL"}</span><span className="text-sm text-muted">{out.pass ? "Every line recomputed from the embedded inputs and signals." : out.firstMismatch}</span></div>
    <ul className="text-sm space-y-1">{out.checks.map((c) => <li key={c.name} className="flex gap-3"><span className={`chip ${c.pass ? "ok" : "flag"}`}><i />{c.pass ? "pass" : "fail"}</span><span><b>{c.name}</b> <span className="text-muted">{c.detail}</span></span></li>)}</ul></div>);
}

export function VerifyBox({ initial = "" }: { initial?: string }) {
  const [text, setText] = useState(initial); const [out, setOut] = useState<Out | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (t = text) => { setErr(""); setOut(null); setBusy(true); try { setOut(await runVerify(JSON.parse(t), true)); } catch (e: any) { setErr(`Could not read that as a statement: ${String(e.message).slice(0, 120)}`); } setBusy(false); };
  return (<div className="card p-5"><label><span className="eyebrow">Statement JSON, or a link to one</span><textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder='Paste the contents of a statement .json, or a link such as /api/statement/<voyage>' className="mono text-[12px]" /></label>
    <div className="flex gap-3 mt-3 flex-wrap"><button className="btn" disabled={busy || !text.trim()} onClick={async () => { let t = text.trim(); if (/^(https?:\/\/|\/)/.test(t)) { try { t = await (await fetch(t)).text(); setText(t); } catch { setErr("Could not fetch that link."); return; } } go(t); }}>{busy ? "Recomputing" : "Recompute in this browser"}</button>
      <label className="btn ghost cursor-pointer">Upload file<input type="file" accept=".json,application/json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const t = await f.text(); setText(t); go(t); } }} /></label></div>
    {err && <p className="text-flag text-sm mt-3" role="alert">{err}</p>}{out && <Result out={out} />}</div>);
}

export function VerifyAndCountersign({ statement, voyageId, draft }: { statement: SignedStatement; voyageId: string; draft: boolean }) {
  const [out, setOut] = useState<Out | null>(null); const [busy, setBusy] = useState(false); const { address, isConnected } = useAccount(); const { signTypedDataAsync } = useSignTypedData();
  const [mode, setMode] = useState<"ACCEPT" | "DISPUTE">("ACCEPT"); const [lines, setLines] = useState<string[]>([]); const [reason, setReason] = useState(""); const [msg, setMsg] = useState("");
  const recompute = async () => { setBusy(true); setOut(await runVerify(statement, true)); setBusy(false); };
  const submit = async () => {
    setMsg(""); try {
      const signature = await signTypedDataAsync({ domain: DOMAIN, types: { Countersign: TYPES.Countersign }, primaryType: "Countersign", message: { statementHash: statement.statementHash, decision: mode, disputedLines: disputedHash(lines), reason: mode === "DISPUTE" ? reason : "" } });
      const r = await fetch(`/api/statement/${voyageId}/countersign`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, decision: mode, disputedLines: lines, reason: mode === "DISPUTE" ? reason : "", signature }) });
      const j = await r.json(); setMsg(r.ok ? (mode === "ACCEPT" ? "Accepted. Both signatures are now recorded." : "Dispute recorded against the named lines.") : j.error ?? "Rejected");
      if (r.ok) setTimeout(() => location.reload(), 1200);
    } catch (e: any) { setMsg(String(e.shortMessage ?? e.message).slice(0, 140)); }
  };
  return (<div className="space-y-6">
    <div className="card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="eyebrow">Statement hash</div><div className="mono break-all">{statement.statementHash}</div></div><button className="btn" onClick={recompute} disabled={busy}>{busy ? "Recomputing" : "Recompute in this browser"}</button></div>
      <p className="text-sm text-muted mt-3">This runs the laytime engine here, in your browser, from the inputs and signals in the statement, and fetches each signal from the node to compare. Offline: <code className="mono">pnpm verify statement.json</code>.</p>{out && <Result out={out} />}</div>
    <div className="card p-5"><h2 className="text-2xl mb-3">Intervals</h2><div className="scroll-x" tabIndex={0}><table className="sheet"><thead><tr><th>Line</th><th className="r">Min</th><th>Class</th><th>Reason</th><th>Receipts</th><th>Dispute</th></tr></thead><tbody>{statement.body.result.intervals.map((i) => { const id = lineId(i); return <tr key={id}><td className="mono">{new Date(i.from * 60000).toISOString().slice(5, 16).replace("T", " ")}</td><td className="num">{i.minutes}</td><td><Chip s={i.cls === "COUNTS" ? "WATCHING" : i.cls === "EXCEPTED" ? "CORROBORATED" : "INSUFFICIENT"} label={i.cls + (i.onDemurrage ? " (demurrage)" : "")} /></td><td className="text-muted">{i.reason.replaceAll("_", " ").toLowerCase()}</td><td className="mono">{i.receipts.map((r) => short(r, 8)).join(" ")}</td><td>{!draft && !statement.countersign && <input type="checkbox" aria-label={`Dispute line ${id}`} checked={lines.includes(id)} onChange={(e) => setLines(e.target.checked ? [...lines, id] : lines.filter((x) => x !== id))} style={{ width: 18 }} />}</td></tr>; })}</tbody></table></div>
      <p className="mt-3"><b>{usd(statement.body.result.amountUusdc)}</b> on {statement.body.result.demurrageMinutes} minutes of demurrage.</p></div>
    <div className="card p-5"><h2 className="text-2xl mb-2">Owner's decision</h2>
      {draft ? <p className="text-muted">The analyst has not signed this statement yet, so there is nothing to countersign.</p> : statement.countersign ? <p><Chip s={statement.countersign.decision === "ACCEPT" ? "AGREED" : "DISPUTED"} /> by <span className="mono">{short(statement.countersign.address, 8)}</span>{statement.countersign.disputedLines.length ? `, lines ${statement.countersign.disputedLines.join(", ")}: ${statement.countersign.reason}` : ""}</p> :
        <div className="space-y-3"><div className="flex gap-2">{(["ACCEPT", "DISPUTE"] as const).map((m) => <button key={m} className={`btn ${mode === m ? "" : "ghost"}`} onClick={() => setMode(m)}>{m === "ACCEPT" ? "Accept" : "Dispute named lines"}</button>)}</div>
          {mode === "DISPUTE" && <><p className="text-sm text-muted">Tick the lines above, then give the reason. Selected: {lines.length}.</p><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, for example: weather hours claimed without a receipt" /></>}
          {!isConnected ? <p className="text-sm text-muted">Connect the owner's wallet (top right) to countersign.</p> : <button className="btn" onClick={submit} disabled={mode === "DISPUTE" && (!lines.length || !reason)}>Sign {mode === "ACCEPT" ? "acceptance" : "dispute"} with my wallet</button>}{msg && <p className="text-sm" role="status">{msg}</p>}</div>}</div></div>);
}
