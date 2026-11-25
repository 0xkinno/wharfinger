import { q, hasDb } from "./db";
import { loadStatement } from "./statements";
import { money as usd } from "./render";
const m = (x: number) => new Date(x * 60000).toISOString().slice(5, 16).replace("T", " ");
export async function statementDemo() {
  try {
    if (!hasDb()) return null;
    const v = (await q("select id from voyages where label like 'Preloaded%' order by created_at limit 1"))[0]; if (!v) return null;
    const r = await loadStatement(v.id); if (!r) return null;
    const s = r.statement.body;
    return { id: v.id, hash: r.statement.statementHash.slice(0, 14) + "...", demurrage: `${(s.result.demurrageMinutes / 60).toFixed(1)} h, ${usd(s.result.amountUusdc)}`,
      rows: s.result.intervals.slice(0, 7).map((i) => ({ from: m(i.from), minutes: i.minutes, cls: i.cls, receipts: i.receipts.length })) };
  } catch { return null; }
}
