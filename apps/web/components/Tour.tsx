"use client";
import { useEffect, useState } from "react";
const STEPS = [["hero", "The promise: every disputed hour of a port call carries a receipt."], ["board", "The harbour board: real vessels being watched, with their status."], ["how", "How it watches: buy now, two operators must agree, sign and let the owner check."], ["sheet", "A time sheet with receipt tags stapled to the contested lines."], ["verify", "The owner pastes the statement and recomputes it in the browser."], ["judges", "The judge door: any ship in a Finnish port, bought live, with failure buttons."]];
export function Tour() {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    if (i === null) return;
    document.querySelector(`[data-tour="${STEPS[i][0]}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setI(null); if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setI((x) => (x === null ? x : Math.min(x + 1, STEPS.length - 1))); } if (e.key === "ArrowLeft") setI((x) => (x === null ? x : Math.max(x - 1, 0))); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [i]);
  return (<>
    <button className="btn ghost" onClick={() => setI(0)}>Guided tour</button>
    {i !== null && <div role="dialog" aria-label="Guided tour" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 card p-5 w-[min(560px,92vw)]">
      <div className="eyebrow mb-1">Step {i + 1} of {STEPS.length}</div><p className="text-[15px] mb-4">{STEPS[i][1]}</p>
      <div className="flex gap-2 justify-between"><button className="btn ghost" onClick={() => setI(null)}>Close (Esc)</button><div className="flex gap-2"><button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button><button className="btn" disabled={i === STEPS.length - 1} onClick={() => setI(i + 1)}>Next</button></div></div></div>}
  </>);
}
