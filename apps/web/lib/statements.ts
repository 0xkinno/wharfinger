import { q } from "./db";
import { getVoyage, statementFor } from "./voyages";
import type { SignedStatement } from "../../../packages/statement/src/index.ts";

/** The signed snapshot if the analyst has signed, with the latest owner decision attached; otherwise a live draft. */
export async function loadStatement(id: string): Promise<{ statement: SignedStatement; draft: boolean } | null> {
  const v = await getVoyage(id); if (!v) return null;
  const a = (await q("select * from signatures where voyage_id=$1 and role='ANALYST' order by id desc limit 1", [id]))[0];
  if (a) {
    const s: SignedStatement = { ...(a.statement as SignedStatement), analyst: { address: a.address, signature: a.signature } };
    const o = (await q("select * from signatures where voyage_id=$1 and role='OWNER' and statement_hash=$2 order by id desc limit 1", [id, a.statement_hash]))[0];
    if (o) s.countersign = { address: o.address, decision: o.decision, disputedLines: o.disputed_lines, reason: o.reason ?? "", signature: o.signature };
    return { statement: s, draft: false };
  }
  return { statement: await statementFor(v), draft: true };
}
