"use client";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { writeMessage } from "@/lib/auth";

const KINDS = ["NOR_TENDERED", "NOR_ACCEPTED", "ALL_FAST", "LOADING_START", "LOADING_STOP", "LOADING_RESUME", "COMPLETED", "DOCS_ON_BOARD"] as const;
type Ev = { kind: (typeof KINDS)[number]; at: number; line: number; remark?: string };
const toLocal = (m: number) => new Date(m * 60000).toISOString().slice(0, 16);
export function SofEditor({ voyageId, funder, sof, resolutions, review }: { voyageId: string; funder: string | null; sof: Ev[]; resolutions: Record<string, string>; review: { key: string; from: number; to: number; reason: string }[] }) {
  const { address } = useAccount(); const { signMessageAsync } = useSignMessage();
  const [ev, setEv] = useState<Ev[]>(sof.length ? sof : [{ kind: "NOR_TENDERED", at: Math.floor(Date.now() / 60000), line: 1 }]); const [res, setRes] = useState<Record<string, string>>(resolutions); const [note, setNote] = useState(""); const [msg, setMsg] = useState("");
  const mine = !!address && !!funder && address.toLowerCase() === funder.toLowerCase();
  const save = async () => { setMsg(""); try {
    const payload = { sof: ev.map((e, i) => ({ ...e, line: i + 1 })), resolutions: res, note: note || undefined }; const ts = Date.now();
    const signature = await signMessageAsync({ message: writeMessage("update-sof", voyageId, payload, ts) });
    const r = await fetch(`/api/voyages/${voyageId}/sof`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ payload, ts, signature }) }); const j = await r.json();
    setMsg(r.ok ? "Saved. The clock above recomputes." : j.error); if (r.ok) setTimeout(() => location.reload(), 800); } catch (e: any) { setMsg(String(e.shortMessage ?? e.message).slice(0, 140)); } };
  return (<section className="card p-6" aria-labelledby="sof-h"><h2 id="sof-h" className="text-3xl mb-1">Statement of Facts and REVIEW</h2>
    <p className="text-sm text-muted mb-4">Enter the Master's events (times in UTC). Only the funding wallet can change them, by signing the change. Your resolutions with a reason become the only durable notes on the voyage.</p>
    {ev.map((e, i) => (<div key={i} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1.2fr_1.6fr_auto] gap-2 mb-4 sm:mb-2 items-end"><label><span className="eyebrow">Event</span><select value={e.kind} onChange={(x) => setEv(ev.map((y, j) => j === i ? { ...y, kind: x.target.value as Ev["kind"] } : y))}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
      <label><span className="eyebrow">UTC time</span><input type="datetime-local" value={toLocal(e.at)} onChange={(x) => setEv(ev.map((y, j) => j === i ? { ...y, at: Math.floor(Date.parse(x.target.value + ":00Z") / 60000) } : y))} /></label>
      <label><span className="eyebrow">Remark</span><input value={e.remark ?? ""} placeholder="for example: loading stopped, snow" onChange={(x) => setEv(ev.map((y, j) => j === i ? { ...y, remark: x.target.value } : y))} /></label><button className="btn ghost" onClick={() => setEv(ev.filter((_, j) => j !== i))} aria-label="Remove event">Remove</button></div>))}
    <button className="btn ghost mb-5" onClick={() => setEv([...ev, { kind: "LOADING_STOP", at: Math.floor(Date.now() / 60000), line: ev.length + 1 }])}>Add event</button>
    {review.length > 0 && <div className="mb-5"><h3 className="text-xl mb-2">Resolve REVIEW intervals</h3>{review.map((r) => (<div key={r.key} className="flex flex-wrap gap-3 items-center mb-2 text-sm"><span className="mono">{toLocal(r.from)} to {toLocal(r.to)}</span><span className="text-muted">{r.reason.replaceAll("_", " ").toLowerCase()}</span><select style={{ width: 150 }} value={res[r.key] ?? ""} onChange={(x) => setRes({ ...res, [r.key]: x.target.value })}><option value="">Unresolved</option><option value="COUNTS">Counts</option><option value="EXCEPTED">Excepted</option></select></div>))}<label><span className="eyebrow">Reason (kept as a durable note)</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label></div>}
    {!mine ? <p className="text-sm text-muted">Connect the funding wallet{funder ? ` (${funder.slice(0, 8)}...)` : ""} to edit.</p> : <button className="btn" onClick={save}>Sign and save</button>}{msg && <p className="text-sm mt-2" role="status">{msg}</p>}</section>);
}
