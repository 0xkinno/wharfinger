"use client";
import { useEffect, useState } from "react";
import { Chip } from "./ui";
import { short, cents } from "@/lib/fmt";
type V = { port: string; vessel: string; mmsi: number; hasMmsi: boolean };
export function JudgeConsole() {
  const [list, setList] = useState<V[]>([]); const [mmsi, setMmsi] = useState(""); const [busy, setBusy] = useState(false); const [res, setRes] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/inport").then((r) => r.json()).then((j) => setList(j.vessels)).catch(() => {}); }, []);
  const go = async () => { setBusy(true); setErr(""); setRes(null); try { const r = await fetch("/api/judge/watch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mmsi }) }); const j = await r.json(); if (!r.ok) setErr(j.error); else setRes(j); } catch (e: any) { setErr(String(e.message)); } setBusy(false); };
  return (<div className="card p-6 space-y-4"><h2 className="text-3xl">Watch any ship at a Finnish port</h2>
    <p className="text-sm text-muted">The house key (labelled, capped, 0.60 USDC a day) buys the first answers. Ships below are in port now, from Digitraffic port calls (public record, not bought on Telegraph). Ships with no MMSI in the port call cannot be asked about by MMSI.</p>
    <div className="flex flex-wrap gap-2 max-h-40 overflow-auto" tabIndex={0}>{list.filter((v) => v.hasMmsi).map((v) => <button key={`${v.port}${v.mmsi}`} className={`btn ghost !py-1 !text-xs ${mmsi === String(v.mmsi) ? "!bg-ink !text-white" : ""}`} onClick={() => setMmsi(String(v.mmsi))}>{v.vessel} ({v.port})</button>)}{list.length === 0 && <span className="text-sm text-muted">Loading ships in port...</span>}</div>
    <div className="flex gap-2"><input value={mmsi} onChange={(e) => setMmsi(e.target.value)} inputMode="numeric" placeholder="MMSI, nine digits" aria-label="MMSI" /><button className="btn" onClick={go} disabled={busy || !/^\d{9}$/.test(mmsi)}>{busy ? "Buying live (up to 40 s)" : "Buy two answers"}</button></div>
    {err && <p className="text-flag text-sm" role="alert">{err}</p>}
    {res && <div aria-live="polite" className="space-y-3"><div className="flex gap-2 items-center flex-wrap"><Chip s={res.corroboration?.status ?? "INSUFFICIENT"} />{res.corroboration?.independence && <Chip s={res.corroboration.independence} />}<span className="text-sm text-muted">{res.corroboration?.note} · {res.purchases} paid answers, {cents(res.spentUusdc)} · {res.labelled}</span></div>
      <div className="scroll-x" tabIndex={0}><table className="sheet"><thead><tr><th>Miner</th><th>Node</th><th>Checks</th><th>Receipt</th><th>Signal</th></tr></thead><tbody>{res.rows.map((r: any, i: number) => <tr key={i}><td className="mono">{r.miner_id}</td><td className="num">{r.status}</td><td>{r.status !== 200 ? <Chip s="REFUSED" label="node refusal" /> : r.verdict_ok ? <Chip s="CORROBORATED" label="passed" /> : r.refusals.map((c: string) => <Chip key={c} s="REFUSED" label={c} />)}</td><td className="mono">{short(r.receipt_hash)}</td><td className="mono">{r.signal_hash ? <a className="underline" href={`https://devnode.telegraphprotocol.com/engine/v1/signal/${r.signal_hash}`}>{short(r.signal_hash)}</a> : ""}</td></tr>)}</tbody></table></div></div>}</div>);
}
