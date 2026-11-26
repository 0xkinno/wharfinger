import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { gate, verifySettlement, memoFor, type Mandate, type Screening } from "../src/index.ts";
import { ownerCountersign, type SignedStatement } from "../../statement/src/index.ts";

const base: SignedStatement = JSON.parse(readFileSync("examples/statement.sample.json", "utf8"));
const m: Mandate = { payer: "charterer", payeeName: "Nordic Bulk Owners Oy", payeeAddress: "PAYEE", analystAddress: base.analyst!.address, ownerAddress: base.countersign!.address, maxUusdc: 10_000_000_000n };
const clear: Screening = { name: m.payeeName, matched: false, receiptHash: "0xabc0000000000000", signalHash: "0xdef", minerId: "1", askedAt: "t", intent: "SANCTIONS_SCREENING_MATCH_GENERAL" };

describe("settlement gate", () => {
  it("releases when everything checks", async () => { const g = await gate(base, m, clear); expect(g.decision).toBe("RELEASE"); expect(g.payUusdc).toBe(4_500_000_000n); });
  it("holds without a countersignature", async () => { const { countersign, ...rest } = base; expect((await gate(rest as SignedStatement, m, clear)).decision).toBe("HOLD"); });
  it("blocks a statement that does not recompute", async () => {
    const t = structuredClone(base); const i = t.body.result.intervals.length - 1; t.body.result.intervals[i].to += 1; t.body.result.intervals[i].minutes += 1;
    expect((await gate(t, m, clear)).decision).toBe("BLOCK");
  });
  it("holds when no screening receipt exists, escalates on a match, holds on a name mismatch", async () => {
    expect((await gate(base, m, null)).decision).toBe("HOLD");
    expect((await gate(base, m, { ...clear, matched: true })).decision).toBe("ESCALATE");
    expect((await gate(base, m, { ...clear, name: "Someone Else" })).decision).toBe("HOLD");
    expect((await gate(base, m, { ...clear, matched: null })).decision).toBe("HOLD");
  });
  it("escalates over the authority limit", async () => { expect((await gate(base, { ...m, maxUusdc: 1n }, clear)).decision).toBe("ESCALATE"); });
  it("holds when the owner key is not the mandated owner", async () => { expect((await gate(base, { ...m, ownerAddress: "0x0000000000000000000000000000000000000001" }, clear)).decision).toBe("HOLD"); });
  it("a dispute of the only demurrage line holds everything", async () => {
    const owner = privateKeyToAccount(generatePrivateKey()); const { countersign, ...rest } = base;
    const line = base.body.result.intervals.find((i) => i.onDemurrage)!; const id = `${line.from}-${line.to}`;
    const s = await ownerCountersign(rest as SignedStatement, owner, "DISPUTE", [id], "weather hours claimed without a receipt");
    const g = await gate(s, { ...m, ownerAddress: owner.address }, clear); expect(g.decision).toBe("HOLD"); expect(g.payUusdc).toBe(0n);
  });
  it("verifySettlement matches amount, address and memo, and rejects a different amount", async () => {
    const g = await gate(base, m, clear); const st = { rail: "solana", network: "devnet", txid: "x", amountUusdc: g.payUusdc, to: "PAYEE", memo: memoFor(g) };
    expect(verifySettlement(g, st, m).pass).toBe(true); expect(verifySettlement(g, { ...st, amountUusdc: g.payUusdc - 1n }, m).pass).toBe(false);
  });
});

import { buildStatement, analystSign } from "../../statement/src/index.ts";
describe("partial release", () => {
  it("pays only the undisputed demurrage minutes", async () => {
    const analyst = privateKeyToAccount(generatePrivateKey()); const owner = privateKeyToAccount(generatePrivateKey());
    const b = base.body; const dem = b.result.intervals.find((i) => i.onDemurrage)!; const mid = dem.from + 120;
    // the same stay with an SOF stop and resume inside the demurrage period splits it into three demurrage lines
    const sof = [...b.sof, { kind: "LOADING_STOP" as const, at: mid, line: 90, remark: "loader fault" }, { kind: "LOADING_RESUME" as const, at: mid + 60, line: 91 }];
    let s = buildStatement({ voyage: b.voyage, terms: { ...b.terms, demurrageUusdcPerDay: BigInt(b.terms.demurrageUusdcPerDay as unknown as string), despatchUusdcPerDay: BigInt(b.terms.despatchUusdcPerDay as unknown as string) }, sof, facts: b.facts, resolutions: b.resolutions, receipts: b.receipts, geometry: b.geometry, labels: b.labels });
    const lines = s.body.result.intervals.filter((i) => i.onDemurrage);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    s = await analystSign(s, analyst); s = await ownerCountersign(s, owner, "DISPUTE", [`${lines[0].from}-${lines[0].to}`], "stop was the shipper's fault");
    const g = await gate(s, { ...m, analystAddress: analyst.address, ownerAddress: owner.address, maxUusdc: 10n ** 12n }, clear);
    expect(g.decision).toBe("RELEASE_PARTIAL"); expect(g.payUusdc + g.heldUusdc).toBe(BigInt(s.body.result.amountUusdc)); expect(g.payUusdc > 0n).toBe(true);
  });
});
