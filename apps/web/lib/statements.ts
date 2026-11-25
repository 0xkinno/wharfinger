import { q, hasDb } from "./db";
import { FIXTURE } from "./fixture";
import { getVoyage, statementFor } from "./voyages";
import type { SignedStatement } from "../../../packages/statement/src/index.ts";

/** The signed snapshot if the analyst has signed, with the latest owner decision attached; otherwise a live draft. */
export async function loadStatement(id: string): Promise<{ statement: SignedStatement; draft: boolean } | null> {
  const v = await getVoyage(id); if (!v) return null;
  const sigs: any[] = hasDb() ? await q("select * from signatures where voyage_id=$1 order by id", [id]) : (FIXTURE.signatures as any[]).filter((g) => g.voyage_id === id);
  const a = [...sigs].reverse().find((g) => g.role === "ANALYST");
  if (a) {
    const s: SignedStatement = { ...(a.statement as SignedStatement), analyst: { address: a.address, signature: a.signature } };
    const o = [...sigs].reverse().find((g) => g.role === "OWNER" && g.statement_hash === a.statement_hash);
    if (o) s.countersign = { address: o.address, decision: o.decision, disputedLines: o.disputed_lines, reason: o.reason ?? "", signature: o.signature };
    return { statement: s, draft: false };
  }
  return { statement: await statementFor(v), draft: true };
}
