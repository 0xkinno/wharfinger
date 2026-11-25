import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { verifyStatement, ownerCountersign, analystSign, lineId, type SignedStatement } from "../src/index.ts";

const load = (): SignedStatement => JSON.parse(readFileSync("examples/statement.sample.json", "utf8"));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe("statement verification, offline", () => {
  it("the sample built from real Phase 1 answers verifies end to end", async () => {
    const r = await verifyStatement(load()); expect(r.firstMismatch).toBeNull(); expect(r.pass).toBe(true);
    expect(r.checks.map((c) => c.name)).toEqual(expect.arrayContaining(["statement hash", "every interval recomputes", "signal hashes recompute", "analyst signature", "owner countersignature"]));
  });
  it("B7: changing one minute in an interval fails at that line", async () => {
    const s = clone(load()); const i = s.body.result.intervals.length - 1; s.body.result.intervals[i].to += 1; s.body.result.intervals[i].minutes += 1;
    const r = await verifyStatement(s); expect(r.pass).toBe(false);
    expect(r.checks.find((c) => c.name === "every interval recomputes")!.detail).toContain(`interval ${i}`);
  });
  it("B7: changing a SOF time breaks the hash and the recompute", async () => {
    const s = clone(load()); s.body.sof[1].at += 1; const r = await verifyStatement(s);
    expect(r.pass).toBe(false); expect(r.checks.find((c) => c.name === "statement hash")!.pass).toBe(false);
  });
  it("changing the amount alone fails the totals check", async () => {
    const s = clone(load()); s.body.result.amountUusdc = "1"; const r = await verifyStatement(s); expect(r.checks.find((c) => c.name === "totals")!.pass).toBe(false);
  });
  it("tampering with an embedded signal fails the hash re-derivation", async () => {
    const s = clone(load()); const x = s.body.receipts.find((r) => r.signal)!; x.signal.payload.request += " tampered";
    const r = await verifyStatement(s); expect(r.checks.find((c) => c.name === "signal hashes recompute")!.pass).toBe(false);
  });
  it("a fact that cites a receipt the statement does not list fails", async () => {
    const s = clone(load()); s.body.facts[0].receipts = ["0xdeadbeef"]; const r = await verifyStatement(s);
    expect(r.checks.find((c) => c.name === "every receipt used is listed")!.pass).toBe(false);
  });
  it("a receipt from our own miner used by a fact fails", async () => {
    const s = clone(load()); const used = s.body.facts[0].receipts[0]; s.body.receipts.find((r) => r.receiptHash === used)!.ours = true;
    expect((await verifyStatement(s)).checks.find((c) => c.name === "no receipt from our own miner")!.pass).toBe(false);
  });
  it("a signature from another key is rejected", async () => {
    const s = clone(load()); const other = privateKeyToAccount(generatePrivateKey());
    const forged = await analystSign({ ...s, analyst: undefined }, other); forged.analyst!.address = s.analyst!.address;
    expect((await verifyStatement(forged)).checks.find((c) => c.name === "analyst signature")!.pass).toBe(false);
  });
  it("an unsigned statement does not pass", async () => { const s = clone(load()); delete s.analyst; expect((await verifyStatement(s)).pass).toBe(false); });
  it("owner dispute names real lines with a reason, and verifies", async () => {
    const s = clone(load()); delete s.countersign; const line = lineId(s.body.result.intervals[1]);
    const d = await ownerCountersign(s, privateKeyToAccount(generatePrivateKey()), "DISPUTE", [line], "weather hours claimed without a receipt");
    expect((await verifyStatement(d)).pass).toBe(true);
    await expect(ownerCountersign(s, privateKeyToAccount(generatePrivateKey()), "DISPUTE", [], "")).rejects.toThrow();
  });
  it("a dispute that names a line that does not exist fails", async () => {
    const s = clone(load()); delete s.countersign;
    const d = await ownerCountersign(s, privateKeyToAccount(generatePrivateKey()), "DISPUTE", ["1-2"], "x");
    expect((await verifyStatement(d)).checks.find((c) => c.name === "disputed lines exist")!.pass).toBe(false);
  });
  it("the sample is labelled illustrative where it is", () => {
    const s = load(); expect(s.body.labels.sof).toContain("illustrative"); expect(s.body.labels.persona).toContain("fictional");
  });
});
