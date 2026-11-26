// Settlement gate: decides whether a payment that depends on a laytime statement may go out. Pure and deterministic.
// It never moves money. A rail adapter (see scripts/solana-settle.ts) executes a RELEASE and the same module checks the result.
// Decisions: RELEASE (pay the amount), RELEASE_PARTIAL (pay only the undisputed minutes), HOLD (missing evidence or agreement),
// ESCALATE (a human must decide), BLOCK (the statement does not recompute), NO_PAYMENT (nothing is owed by the payer).
import { verifyStatement, lineId, type SignedStatement } from "../../statement/src/index.ts";

export type Decision = "RELEASE" | "RELEASE_PARTIAL" | "HOLD" | "ESCALATE" | "BLOCK" | "NO_PAYMENT";
export type Mandate = {
  payer: string;            // who is authorised to pay, free text label
  payeeName: string;        // legal name screened before payment
  payeeAddress: string;     // where the rail sends funds
  analystAddress: string;   // key that must have signed the statement
  ownerAddress: string;     // key that must have countersigned it
  maxUusdc: bigint;         // authority limit for one payment
};
export type Screening = { name: string; matched: boolean | null; receiptHash: string; signalHash: string; minerId: string; askedAt: string; intent: string } | null;
export type Reason = { code: string; text: string };
export type Gate = { decision: Decision; payUusdc: bigint; heldUusdc: bigint; reasons: Reason[]; checks: { name: string; pass: boolean; detail: string }[]; statementHash: string };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export async function gate(s: SignedStatement, m: Mandate, screening: Screening): Promise<Gate> {
  const v = await verifyStatement(s);
  const total = BigInt(s.body.result.amountUusdc);
  const out = (decision: Decision, payUusdc: bigint, reasons: Reason[]): Gate => ({ decision, payUusdc, heldUusdc: total > 0n ? total - payUusdc : 0n, reasons, checks: v.checks, statementHash: s.statementHash });
  if (!v.pass) return out("BLOCK", 0n, [{ code: "DOES_NOT_RECOMPUTE", text: v.firstMismatch ?? "the statement fails its own recompute" }]);
  if (!s.analyst || !same(s.analyst.address, m.analystAddress)) return out("HOLD", 0n, [{ code: "ANALYST_KEY", text: "not signed by the analyst key named in the mandate" }]);
  if (total <= 0n) return out("NO_PAYMENT", 0n, [{ code: "NOTHING_OWED", text: total === 0n ? "no demurrage is due" : "despatch is owed by the owner, not payable by the charterer" }]);
  if (s.body.result.reviewMinutes > 0) return out("HOLD", 0n, [{ code: "UNRESOLVED_REVIEW", text: `${s.body.result.reviewMinutes} minutes are still in REVIEW and need a signed reason` }]);
  if (!s.countersign) return out("HOLD", 0n, [{ code: "NO_COUNTERSIGNATURE", text: "the owner has not agreed or disputed the statement" }]);
  if (!same(s.countersign.address, m.ownerAddress)) return out("HOLD", 0n, [{ code: "OWNER_KEY", text: "countersigned by a key that is not the owner named in the mandate" }]);
  // Counterparty screening is bought evidence. Name screening can false-positive, so a match goes to a person and a miss is never a pass without a receipt.
  if (!screening) return out("HOLD", 0n, [{ code: "NOT_SCREENED", text: `no paid screening receipt for ${m.payeeName}` }]);
  if (!same(screening.name, m.payeeName)) return out("HOLD", 0n, [{ code: "SCREENING_NAME", text: "the screening receipt is for a different name than the payee" }]);
  if (screening.matched === null) return out("HOLD", 0n, [{ code: "SCREENING_INCONCLUSIVE", text: "the screening answer had no match flag" }]);
  if (screening.matched) return out("ESCALATE", 0n, [{ code: "SCREENING_MATCH", text: `${m.payeeName} matched a sanctions list entry (receipt ${screening.receiptHash.slice(0, 12)}); a person must clear or reject it` }]);
  let pay = total; const reasons: Reason[] = [];
  let decision: Decision = "RELEASE";
  if (s.countersign.decision === "DISPUTE") {
    const disputed = new Set(s.countersign.disputedLines);
    const dm = s.body.result.intervals.filter((i) => i.onDemurrage && disputed.has(lineId(i))).reduce((a, i) => a + i.minutes, 0);
    const rate = BigInt(s.body.terms.demurrageUusdcPerDay as unknown as string);
    const held = (BigInt(dm) * rate) / 1440n; // same floor rule as the engine
    pay = total - held; decision = "RELEASE_PARTIAL";
    reasons.push({ code: "DISPUTED_LINES", text: `${dm} demurrage minutes disputed by the owner; ${held} uUSDC held back: ${s.countersign.reason}` });
    if (pay <= 0n) return out("HOLD", 0n, [...reasons, { code: "ALL_DISPUTED", text: "every demurrage minute is disputed" }]);
  }
  if (pay > m.maxUusdc) return out("ESCALATE", 0n, [{ code: "OVER_AUTHORITY", text: `${pay} uUSDC is over the mandate limit of ${m.maxUusdc}` }]);
  reasons.push({ code: "ALL_CHECKS_PASS", text: "statement recomputes, both keys match the mandate, payee screened clear, amount within authority" });
  return out(decision, pay, reasons);
}

// After a rail pays, check the payment against the decision. A rail result is a claim until this passes.
export type Settlement = { rail: string; network: string; txid: string; amountUusdc: bigint; to: string; memo: string };
export const memoFor = (g: Gate) => `wharfinger:${g.statementHash}:${g.decision}:${g.payUusdc}`;
export function verifySettlement(g: Gate, st: Settlement, m: Mandate): { pass: boolean; checks: { name: string; pass: boolean; detail: string }[] } {
  const c = [
    { name: "decision allows payment", pass: g.decision === "RELEASE" || g.decision === "RELEASE_PARTIAL", detail: g.decision },
    { name: "amount equals the gate", pass: st.amountUusdc === g.payUusdc, detail: `${st.amountUusdc} vs ${g.payUusdc}` },
    { name: "paid to the mandate address", pass: st.to === m.payeeAddress, detail: st.to },
    { name: "memo anchors the statement hash", pass: st.memo === memoFor(g), detail: st.memo },
  ];
  return { pass: c.every((x) => x.pass), checks: c };
}
