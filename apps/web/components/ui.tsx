"use client";
import { useRef } from "react";
export function GlowCard({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  return (<div ref={ref} {...rest} onPointerMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`); ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`); }} className={`card glow ${className}`}>{children}</div>);
}
const MAP: Record<string, [string, string]> = {
  WATCHING: ["live", "Watching"], AWAITING_FUNDS: ["", "Awaiting funds"], BUDGET_SPENT: ["flag", "Budget spent"], ENDED: ["", "Ended"], SIGNED: ["brass", "Signed"], AGREED: ["ok", "Agreed"], DISPUTED: ["flag", "Disputed"], JUDGE: ["", "House key"],
  CORROBORATED: ["ok", "Corroborated"], REVIEW: ["brass", "Review"], INSUFFICIENT: ["", "One answer"], REFUSED: ["flag", "Refused"], STALE: ["flag", "Stale"], PENDING: ["brass", "Block pending"], ONE_UPSTREAM: ["brass", "One upstream"], TWO_SOURCES: ["ok", "Two sources"],
};
export function Chip({ s, label }: { s: string; label?: string }) { const [c, t] = MAP[s] ?? ["", s]; return <span className={`chip ${c}`}><i />{label ?? t}</span>; }
