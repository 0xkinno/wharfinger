// Minimal Telegraph escrow client for probes. Phase 4 replaces this with packages/telegraph (tested against a fake node).
// Rules encoded from the docs and confirmed in evidence/probe/c5_auth_refusals.json:
//  - sign extra.message exactly, lowercase `from`, window <= 120 s, fresh nonce each attempt
//  - never sign above a per-answer cap
import { privateKeyToAccount, type LocalAccount } from "viem/accounts";

export const NODE = process.env.TELEGRAPH_NODE ?? "https://devnode.telegraphprotocol.com";
const decode = (s: string | null) => (s ? JSON.parse(Buffer.from(s, "base64").toString("utf8")) : null);

export type Receipt = { receipt_hash: string; rail: string; payer: string; miner: string; intent: string; amount_uusdc: string; epoch_id: number; settlement: string; chain: string; timestamp: number };
export type Purchase = {
  ok: boolean; status: number; ms: number; body: any; receipt: Receipt | null;
  auth: { from: string; to: string; value: string; validAfter: number; validBefore: number; nonce: string } | null;
  askedAt: string; // ISO time the paid request was sent
  minerPath: string;
};

export function escrowClient(account: LocalAccount, opts: { maxUusdc?: bigint; windowSec?: number } = {}) {
  const maxUusdc = opts.maxUusdc ?? 50_000n;
  const windowSec = Math.min(opts.windowSec ?? 100, 120);
  const path = (minerId?: string) => (minerId ? `/engine/v1/ask/${minerId}` : "/engine/v1/ask");

  async function ask(body: { intent: string; params: Record<string, string | number> }, minerId?: string): Promise<Purchase> {
    const url = NODE + path(minerId);
    const t0 = Date.now();
    const first = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
    if (first.status !== 402) {
      return { ok: first.ok, status: first.status, ms: Date.now() - t0, body: await first.json().catch(() => null), receipt: null, auth: null, askedAt: new Date(t0).toISOString(), minerPath: path(minerId) };
    }
    const challenge: any = await first.json();
    const esc = challenge.accepts?.find((a: any) => a.scheme === "escrow");
    if (!esc) throw new Error("node offered no escrow scheme");
    const template: string = esc.extra.message;
    const value = template.match(/Amount:\s*(\d+)\s*uUSDC/)?.[1];
    if (!value) throw new Error("could not read amount from challenge");
    if (BigInt(value) > maxUusdc) throw new Error(`quote ${value} uUSDC is over the cap ${maxUusdc}`);
    const now = Math.floor(Date.now() / 1000);
    const auth = { from: account.address.toLowerCase(), to: esc.payTo as string, value, validAfter: now - 5, validBefore: now + windowSec, nonce: crypto.randomUUID() };
    if (auth.validBefore - auth.validAfter > 120) throw new Error("authorization window over 120 s");
    const message = template.replace("{from}", auth.from).replace("{nonce}", auth.nonce).replace("{validAfter}", String(auth.validAfter)).replace("{validBefore}", String(auth.validBefore));
    const signature = await account.signMessage({ message });
    const payment = Buffer.from(JSON.stringify({ x402Version: 2, scheme: "escrow", network: esc.network,
      payload: { signature, authorization: { ...auth, validAfter: String(auth.validAfter), validBefore: String(auth.validBefore) } } })).toString("base64");
    const sentAt = Date.now();
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "X-PAYMENT": payment }, body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
    const text = await r.text();
    let parsed: any = text; try { parsed = JSON.parse(text); } catch { /* keep text */ }
    return { ok: r.ok, status: r.status, ms: Date.now() - t0, body: parsed, receipt: decode(r.headers.get("x-payment-response")) as Receipt | null, auth, askedAt: new Date(sentAt).toISOString(), minerPath: path(minerId) };
  }
  const get = async (p: string) => { const r = await fetch(NODE + p, { signal: AbortSignal.timeout(30_000) }); const t = await r.text(); try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, json: t }; } };
  return {
    address: account.address, ask,
    signal: (h: string) => get(`/engine/v1/signal/${h}`),
    ledger: (addr = account.address) => get(`/v1/ledger/account/${addr.toLowerCase()}`),
    proof: (addr = account.address) => get(`/v1/ledger/proof/${addr.toLowerCase()}`),
    block: (epoch: number) => get(`/v1/blocks/${epoch}`),
  };
}
export const accountFromKey = (k: string) => privateKeyToAccount(k as `0x${string}`);
