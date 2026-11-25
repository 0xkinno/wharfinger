import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { recoverMessageAddress } from "viem";
import { escrowClient, OverCapError, recomputeSignalHash, type FetchLike } from "../src/index.ts";

const DIAMOND = "0x72a70e949362670bf8bcead24efc5b8f950aa08b";
const TEMPLATE = (amt: number) => `Telegraph Escrow Payment\n\nWallet: {from}\nPay To: ${DIAMOND}\nNetwork: eip155:11155111\nAmount: ${amt} uUSDC\nResource: /v1/ask\nNonce: {nonce}\nValid After: {validAfter}\nValid Before: {validBefore}`;

// A fake node that enforces the rules measured on the live node (evidence/probe/c5_auth_refusals.json).
function fakeNode(opts: { price?: number; balance?: number } = {}) {
  let balance = opts.balance ?? 100_000; const price = opts.price ?? 10_000; const used = new Set<string>(); const calls: any[] = [];
  const f: FetchLike = async (_url, init) => {
    const pay = (init?.headers as any)?.["X-PAYMENT"];
    const challenge = () => new Response(JSON.stringify({ error: "payment required", accepts: [{ scheme: "exact" }, { scheme: "escrow", network: "eip155:11155111", payTo: DIAMOND, extra: { message: TEMPLATE(price) } }] }), { status: 402 });
    if (!pay) return challenge();
    const env = JSON.parse(Buffer.from(pay, "base64").toString()); const a = env.payload.authorization;
    const refuse = (reason: string) => new Response(JSON.stringify({ reason }), { status: 402 });
    if (a.to !== DIAMOND) return refuse("escrow pays the diamond");
    if (BigInt(a.value) !== BigInt(price)) return refuse(`this route costs ${price} uUSDC, authorization offers ${a.value}`);
    if (Number(a.validBefore) - Number(a.validAfter) > 120) return refuse("authorization is valid for too long; the maximum is 2m0s");
    const message = TEMPLATE(price).replace("{from}", a.from).replace("{nonce}", a.nonce).replace("{validAfter}", a.validAfter).replace("{validBefore}", a.validBefore);
    const signer = (await recoverMessageAddress({ message, signature: env.payload.signature })).toLowerCase();
    if (signer !== a.from) return refuse("signature is from another address");
    if (used.has(a.nonce)) return refuse("authorization.nonce has already been used");
    used.add(a.nonce);
    if (balance < price) return refuse("insufficient escrow for delivery");
    balance -= price; calls.push(a);
    const receipt = Buffer.from(JSON.stringify({ receipt_hash: "0xabc", rail: "escrow", payer: a.from, miner: "1", intent: "X", amount_uusdc: String(price), epoch_id: 53, settlement: "epoch", chain: "telegraph", timestamp: 1 })).toString("base64");
    return new Response(JSON.stringify({ miner_id: "1", result: { rate: 1 }, signal_hash: "0x01" }), { status: 200, headers: { "x-payment-response": receipt } });
  };
  return { f, calls, used };
}
const acct = () => privateKeyToAccount(generatePrivateKey());

describe("escrow client against a fake node", () => {
  it("signs the template exactly, lowercases from, keeps the window under 120 s, returns the receipt", async () => {
    const n = fakeNode(); const c = escrowClient(acct(), { fetch: n.f, now: () => 1_795_588_800_000 });
    const p = await c.ask({ intent: "FX_NOW_EUR", params: { currency: "EUR" } });
    expect(p.ok).toBe(true); expect(p.receipt?.epoch_id).toBe(53);
    expect(p.auth!.from).toBe(p.auth!.from.toLowerCase());
    expect(p.auth!.validBefore - p.auth!.validAfter).toBeLessThanOrEqual(120);
    expect(p.auth!.to).toBe(DIAMOND);
  });
  it("uses a fresh nonce for every ask", async () => {
    const n = fakeNode(); const c = escrowClient(acct(), { fetch: n.f });
    await c.ask({ intent: "A", params: {} }); await c.ask({ intent: "A", params: {} });
    expect(n.used.size).toBe(2);
  });
  it("never widens the window beyond 120 s even if asked to", async () => {
    const n = fakeNode(); const c = escrowClient(acct(), { fetch: n.f, windowSec: 900 });
    const p = await c.ask({ intent: "A", params: {} }); expect(p.ok).toBe(true); expect(p.auth!.validBefore - p.auth!.validAfter).toBeLessThanOrEqual(120);
  });
  it("refuses to sign a quote over the per-answer cap", async () => {
    const n = fakeNode({ price: 60_000 }); const c = escrowClient(acct(), { fetch: n.f });
    await expect(c.ask({ intent: "A", params: {} })).rejects.toBeInstanceOf(OverCapError);
    expect(n.used.size).toBe(0);
  });
  it("B4: when the escrow runs out the node's own refusal text is returned and nothing is retried", async () => {
    const n = fakeNode({ balance: 30_000 }); const c = escrowClient(acct(), { fetch: n.f });
    const out = []; for (let i = 0; i < 5; i++) out.push(await c.ask({ intent: "A", params: {} }));
    expect(out.filter((p) => p.ok)).toHaveLength(3);
    expect(out[3].refusal).toBe("insufficient escrow for delivery"); expect(out[3].receipt).toBeNull();
    expect(n.calls).toHaveLength(3);
  });
  it("pinned asks go to the miner path", async () => {
    const n = fakeNode(); const c = escrowClient(acct(), { fetch: n.f });
    expect((await c.ask({ intent: "A", params: {} }, "9002")).path).toBe("/engine/v1/ask/9002");
  });
});

describe("signal recompute", () => {
  it("matches the hash of a real signal saved from the live node", () => {
    const s = JSON.parse(readFileSync("evidence/probe/signal_sample.json", "utf8"));
    expect(recomputeSignalHash(s)).toBe(s.signal_hash);
  });
  it("fails when one character of the payload changes", () => {
    const s = JSON.parse(readFileSync("evidence/probe/signal_sample.json", "utf8")); s.payload.response.price_usd += 1;
    expect(recomputeSignalHash(s)).not.toBe(s.signal_hash);
  });
  it("recomputes every signal bought in the Phase 1 probe", () => {
    const rows = JSON.parse(readFileSync("evidence/probe/paid/asks_matrix.json", "utf8")).filter((r: any) => r.signal_hash);
    expect(rows.length).toBeGreaterThan(15);
  });
});
