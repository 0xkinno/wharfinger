// A proportional strip of the whole stay: every interval at its true width, coloured by class, with a legend and totals.
import type { Interval } from "@pk/laytime/src/index.ts";
const COLOR: Record<string, string> = { NOT_YET: "#D9D5C9", COUNTS: "#0B1B33", DEMURRAGE: "#E5484D", EXCEPTED: "#C29A45", REVIEW: "repeating-linear-gradient(135deg,#C29A45 0 5px,#F3E6C4 5px 10px)" };
const key = (i: Interval) => (i.cls === "COUNTS" && i.onDemurrage ? "DEMURRAGE" : i.cls);
const LABEL: Record<string, string> = { NOT_YET: "Before laytime", COUNTS: "Laytime counting", DEMURRAGE: "On demurrage", EXCEPTED: "Excepted, with receipt", REVIEW: "Review" };
export function LaytimeBar({ intervals }: { intervals: Interval[] }) {
  const total = intervals.reduce((a, i) => a + i.minutes, 0); if (!total) return null;
  const sums: Record<string, number> = {}; for (const i of intervals) sums[key(i)] = (sums[key(i)] ?? 0) + i.minutes;
  const h = (m: number) => `${(m / 60).toFixed(1)} h`;
  return (
    <figure aria-label="The stay as a proportional bar" className="m-0">
      <div className="flex h-9 w-full overflow-hidden rounded-xl border border-hair" role="img" aria-label={Object.entries(sums).map(([k, v]) => `${LABEL[k]} ${h(v)}`).join(", ")}>
        {intervals.map((i, n) => <div key={n} title={`${LABEL[key(i)]}: ${i.minutes} min, ${i.reason.replaceAll("_", " ").toLowerCase()}`} style={{ width: `${(100 * i.minutes) / total}%`, background: COLOR[key(i)], minWidth: 2, borderRight: "1px solid rgba(255,255,255,.55)" }} />)}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
        {Object.entries(sums).map(([k, v]) => <span key={k} className="inline-flex items-center gap-2"><i style={{ background: COLOR[k], width: 12, height: 12, borderRadius: 4, border: "1px solid rgba(11,27,51,.2)", display: "inline-block" }} />{LABEL[k]} <b className="num">{h(v)}</b></span>)}
        <span className="text-muted ml-auto">Whole stay {h(total)}</span>
      </figcaption>
    </figure>
  );
}
