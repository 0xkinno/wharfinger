"use client";
import { useState } from "react";
import { verifyStatement } from "@pk/statement/src/index.ts";
import { Result } from "./VerifyPanel";
const B = [["wrong_place", "Wrong place"], ["stale", "Stale position"], ["disagree", "Operators disagree"], ["obedient", "Obedient model"], ["drain", "Budget drain"]] as const;
export function FaultButtons({ demoId }: { demoId: string | null }) {
  const [out, setOut] = useState<any>(null); const [tam, setTam] = useState<any>(null);
  const run = async (m: string) => { setTam(null); setOut({ mode: m, loading: true }); setOut(await (await fetch(`/api/judge/fault?mode=${m}`)).json()); };
  const tamper = async () => { setOut(null); if (!demoId) return; const s = await (await fetch(`/api/statement/${demoId}`)).json(); const i = s.body.result.intervals.length - 1; s.body.result.intervals[i].to += 1; s.body.result.intervals[i].minutes += 1; setTam(await verifyStatement(s)); };
  return (<div className="card p-6"><h2 className="text-3xl mb-1">Break it</h2><p className="text-sm text-muted mb-4">Each button runs the real code on real saved answers with one named change.</p>
    <div className="flex flex-wrap gap-2">{B.map(([m, t]) => <button key={m} className="btn ghost" onClick={() => run(m)}>{t}</button>)}<button className="btn ghost" onClick={tamper} disabled={!demoId}>Tamper one minute</button></div>
    {out && <pre className="mono bg-paper rounded-xl p-4 mt-4 overflow-x-auto text-[12px] whitespace-pre-wrap" aria-live="polite">{out.loading ? "Running..." : JSON.stringify(out, null, 1)}</pre>}
    {tam && <div><p className="text-sm mt-4">One minute added to the last interval of a real statement, then recomputed here:</p><Result out={tam} /></div>}</div>);
}
