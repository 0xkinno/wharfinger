// The signed laytime statement: canonical JSON, EIP-712 signatures from both parties, and an offline verifier.
// Verification re-runs the laytime engine from the embedded inputs and re-derives every embedded signal hash, so it
// needs no keys, no network and no trust in Wharfinger.
import { keccak256, toHex, recoverTypedDataAddress, type Hex, type LocalAccount } from "viem";
import { computeLaytime, canonical, ENGINE_VERSION, SUPPORTED_ENGINE_VERSIONS, type Terms, type SofEvent, type Fact, type Resolution, type Result } from "../../laytime/src/index.ts";
import { recomputeSignalHash } from "../../telegraph/src/index.ts";

export const DIAMOND = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const;
export const DOMAIN = { name: "Wharfinger", version: "1", chainId: 11155111, verifyingContract: DIAMOND } as const;
export const TYPES = {
  LaytimeStatement: [
    { name: "statementHash", type: "bytes32" }, { name: "vessel", type: "string" }, { name: "port", type: "string" },
    { name: "norTenderedAt", type: "uint64" }, { name: "demurrageMinutes", type: "int64" }, { name: "amountUusdc", type: "int256" }, { name: "engineVersion", type: "string" },
  ],
  Countersign: [
    { name: "statementHash", type: "bytes32" }, { name: "decision", type: "string" }, { name: "disputedLines", type: "bytes32" }, { name: "reason", type: "string" },
  ],
} as const; // amountUusdc is int256 because despatch is negative (the build instruction's uint256 cannot hold it)

export type ReceiptRow = { receiptHash: string; signalHash: string; epochId: number | null; minerId: string; operator: string; family: string; intent: string; costUusdc: string; askedAt: string; ours: boolean; signal?: any };
export type StatementInput = {
  voyage: { vessel: string; imo?: number; mmsi?: number; port: string };
  terms: Terms; sof: SofEvent[]; facts: Fact[]; resolutions: Record<string, Resolution>;
  receipts: ReceiptRow[]; geometry: { version: string; sha256: string };
  labels: { persona?: string; sof?: string; network: string; note?: string };
};
export type StatementBody = StatementInput & { schema: "wharfinger.statement.v1"; engineVersion: string; result: { resultHash: string; intervals: Result["intervals"]; demurrageMinutes: number; amountUusdc: string; usedMinutes: number; exceptedMinutes: number; reviewMinutes: number } };
export type SignedStatement = { body: StatementBody; statementHash: Hex; analyst?: { address: string; signature: Hex }; countersign?: { address: string; decision: "ACCEPT" | "DISPUTE"; disputedLines: string[]; reason: string; signature: Hex } };

export const hashCanonical = (v: unknown): Hex => keccak256(toHex(new TextEncoder().encode(canonical(v))));
export function buildStatement(input: StatementInput): SignedStatement {
  const r = computeLaytime(input.terms, input.sof, input.facts, input.resolutions);
  // Money is carried as decimal strings so the body is plain JSON; the canonical hash is identical either way.
  const terms = { ...input.terms, demurrageUusdcPerDay: input.terms.demurrageUusdcPerDay.toString(), despatchUusdcPerDay: input.terms.despatchUusdcPerDay.toString() } as unknown as Terms;
  const body: StatementBody = { schema: "wharfinger.statement.v1", engineVersion: ENGINE_VERSION, ...input, terms,
    result: { resultHash: r.resultHash, intervals: r.intervals, demurrageMinutes: r.demurrageMinutes, amountUusdc: r.amountUusdc.toString(), usedMinutes: r.usedMinutes, exceptedMinutes: r.exceptedMinutes, reviewMinutes: r.reviewMinutes } };
  return { body, statementHash: hashCanonical(body) };
}
export const lineId = (i: { from: number; to: number }) => `${i.from}-${i.to}`;
export const disputedHash = (lines: string[]): Hex => hashCanonical([...lines].sort());
export const statementMessage = (s: SignedStatement) => ({ statementHash: s.statementHash, vessel: s.body.voyage.vessel, port: s.body.voyage.port,
  norTenderedAt: BigInt(s.body.sof.find((e) => e.kind === "NOR_TENDERED")?.at ?? 0), demurrageMinutes: BigInt(s.body.result.demurrageMinutes), amountUusdc: BigInt(s.body.result.amountUusdc), engineVersion: s.body.engineVersion });

export async function analystSign(s: SignedStatement, account: LocalAccount): Promise<SignedStatement> {
  const signature = await account.signTypedData({ domain: DOMAIN, types: { LaytimeStatement: TYPES.LaytimeStatement }, primaryType: "LaytimeStatement", message: statementMessage(s) });
  return { ...s, analyst: { address: account.address, signature } };
}
export async function ownerCountersign(s: SignedStatement, account: LocalAccount, decision: "ACCEPT" | "DISPUTE", disputedLines: string[] = [], reason = ""): Promise<SignedStatement> {
  if (decision === "DISPUTE" && (disputedLines.length === 0 || !reason)) throw new Error("a dispute names the lines and gives a reason");
  const signature = await account.signTypedData({ domain: DOMAIN, types: { Countersign: TYPES.Countersign }, primaryType: "Countersign", message: { statementHash: s.statementHash, decision, disputedLines: disputedHash(disputedLines), reason } });
  return { ...s, countersign: { address: account.address, decision, disputedLines, reason, signature } };
}

export type Check = { name: string; pass: boolean; detail: string };
export async function verifyStatement(s: SignedStatement): Promise<{ pass: boolean; checks: Check[]; firstMismatch: string | null }> {
  const checks: Check[] = []; let firstMismatch: string | null = null;
  const add = (name: string, pass: boolean, detail: string) => { checks.push({ name, pass, detail }); if (!pass && !firstMismatch) firstMismatch = `${name}: ${detail}`; };
  add("statement hash", hashCanonical(s.body) === s.statementHash, "keccak256 of the canonical body");
  // Re-run the engine from the embedded inputs and compare line by line.
  const b = s.body;
  // JSON carries bigint money as strings; revive before recomputing. The canonical form is identical either way.
  const terms: Terms = { ...b.terms, demurrageUusdcPerDay: BigInt(b.terms.demurrageUusdcPerDay as unknown as string), despatchUusdcPerDay: BigInt(b.terms.despatchUusdcPerDay as unknown as string) };
  const supported = (SUPPORTED_ENGINE_VERSIONS as readonly string[]).includes(b.engineVersion);
  add("engine version", supported, supported ? `statement ${b.engineVersion}, verifier ${ENGINE_VERSION}` : `statement ${b.engineVersion} is not a version this verifier can run`);
  const r = computeLaytime(terms, b.sof, b.facts, b.resolutions, { engineVersion: b.engineVersion });
  const claimed = b.result.intervals; let bad = -1;
  for (let i = 0; i < Math.max(claimed.length, r.intervals.length); i++) if (canonical(claimed[i]) !== canonical(r.intervals[i])) { bad = i; break; }
  add("every interval recomputes", bad < 0, bad < 0 ? `${claimed.length} intervals` : `first mismatch at interval ${bad}${claimed[bad] ? ` (${lineId(claimed[bad])})` : ""}`);
  add("engine result hash", r.resultHash === b.result.resultHash, "engine output hash");
  add("totals", r.demurrageMinutes === b.result.demurrageMinutes && r.amountUusdc.toString() === b.result.amountUusdc, `${r.demurrageMinutes} min, ${r.amountUusdc} uUSDC`);
  // Signals: re-derive each embedded hash, and require every receipt used by a fact or interval to be present.
  const byReceipt = new Map(b.receipts.map((x) => [x.receiptHash, x]));
  let sigBad: string | null = null; let embedded = 0;
  for (const x of b.receipts) if (x.signal) { embedded++; if (recomputeSignalHash(x.signal) !== x.signalHash) sigBad ??= x.signalHash; }
  add("signal hashes recompute", sigBad === null, sigBad ? `mismatch for ${sigBad}` : `${embedded} of ${b.receipts.length} signals embedded and re-derived`);
  const used = new Set([...b.facts.filter((f) => f.status === "CORROBORATED").flatMap((f) => f.receipts), ...r.intervals.flatMap((i) => i.receipts)]);
  const missing = [...used].filter((h) => !byReceipt.has(h));
  add("every receipt used is listed", missing.length === 0, missing.length ? `missing ${missing.join(",")}` : `${used.size} receipts used`);
  add("no receipt from our own miner", b.receipts.filter((x) => x.ours && used.has(x.receiptHash)).length === 0, "own miner never counts");
  if (s.analyst) {
    const rec = await recoverTypedDataAddress({ domain: DOMAIN, types: { LaytimeStatement: TYPES.LaytimeStatement }, primaryType: "LaytimeStatement", message: statementMessage(s), signature: s.analyst.signature }).catch(() => "");
    add("analyst signature", rec.toLowerCase() === s.analyst.address.toLowerCase(), `recovered ${rec}`);
  } else add("analyst signature", false, "statement is unsigned");
  if (s.countersign) {
    const c = s.countersign;
    const rec = await recoverTypedDataAddress({ domain: DOMAIN, types: { Countersign: TYPES.Countersign }, primaryType: "Countersign", message: { statementHash: s.statementHash, decision: c.decision, disputedLines: disputedHash(c.disputedLines), reason: c.reason }, signature: c.signature }).catch(() => "");
    add("owner countersignature", rec.toLowerCase() === c.address.toLowerCase(), `${c.decision}, recovered ${rec}`);
    const known = new Set(b.result.intervals.map(lineId)); const unknown = c.disputedLines.filter((l) => !known.has(l));
    add("disputed lines exist", unknown.length === 0, unknown.length ? `unknown lines ${unknown.join(",")}` : `${c.disputedLines.length} lines`);
  }
  return { pass: checks.every((c) => c.pass), checks, firstMismatch };
}
