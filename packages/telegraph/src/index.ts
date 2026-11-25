// Telegraph escrow client. 402 -> sign -> X-PAYMENT -> receipt. Caps live in code AND in the escrow.
// Verified against the live node on 2026-11-25 (evidence/probe/c5_auth_refusals.json, evidence/probe/paid/).
import { keccak256, toHex } from "viem";
import type { LocalAccount } from "viem/accounts";

export const DEFAULT_NODE = "https://devnode.telegraphprotocol.com";
export const MAX_WINDOW_SEC = 120;
export const DEFAULT_CAP_UUSDC = 50_000n;

export type Receipt = { receipt_hash: string; rail: string; payer: string; miner: string; intent: string; amount_uusdc: string; epoch_id: number; settlement: string; chain: string; timestamp: number };
export type Auth = { from: string; to: string; value: string; validAfter: number; validBefore: number; nonce: string };
export type Purchase = { ok: boolean; status: number; ms: number; body: any; receipt: Receipt | null; auth: Auth | null; askedAt: string; path: string; refusal: string | null };
export type AskBody = { intent: string; params: Record<string, string | number> };
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const decode = (s: string | null) => (s ? JSON.parse(Buffer.from(s, "base64").toString("utf8")) : null);
export class OverCapError extends Error { constructor(public quote: bigint, public cap: bigint) { super(`quote ${quote} uUSDC is over the cap ${cap}`); } }

export function escrowClient(account: Pick<LocalAccount, "address" | "signMessage">, opts: { node?: string; capUusdc?: bigint; windowSec?: number; fetch?: FetchLike; now?: () => number } = {}) {
  const node = opts.node ?? DEFAULT_NODE;
  const cap = opts.capUusdc ?? DEFAULT_CAP_UUSDC;
  const BACKDATE_SEC = 5; // validAfter is backdated against clock skew, so it counts toward the 120 s the node allows
  const windowSec = Math.min(opts.windowSec ?? 100, MAX_WINDOW_SEC - BACKDATE_SEC);
  const f: FetchLike = opts.fetch ?? ((u, i) => fetch(u, i));
  const nowMs = opts.now ?? (() => Date.now());
  const path = (minerId?: string) => (minerId ? `/engine/v1/ask/${minerId}` : "/engine/v1/ask");

  async function ask(body: AskBody, minerId?: string): Promise<Purchase> {
    const url = node + path(minerId); const t0 = nowMs();
    const first = await f(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
    if (first.status !== 402) return { ok: first.ok, status: first.status, ms: nowMs() - t0, body: await first.json().catch(() => null), receipt: null, auth: null, askedAt: new Date(t0).toISOString(), path: path(minerId), refusal: first.ok ? null : `HTTP ${first.status}` };
    const ch: any = await first.json();
    const esc = ch.accepts?.find((a: any) => a.scheme === "escrow");
    if (!esc) throw new Error("node offered no escrow scheme");
    const template: string = esc.extra.message;
    const value = template.match(/Amount:\s*(\d+)\s*uUSDC/)?.[1];
    if (!value) throw new Error("could not read amount from the challenge");
    if (BigInt(value) > cap) throw new OverCapError(BigInt(value), cap);
    const now = Math.floor(nowMs() / 1000);
    const auth: Auth = { from: account.address.toLowerCase(), to: esc.payTo, value, validAfter: now - BACKDATE_SEC, validBefore: now + windowSec, nonce: globalThis.crypto.randomUUID() };
    if (auth.validBefore - auth.validAfter > MAX_WINDOW_SEC) throw new Error("authorization window over 120 s");
    const message = template.replace("{from}", auth.from).replace("{nonce}", auth.nonce).replace("{validAfter}", String(auth.validAfter)).replace("{validBefore}", String(auth.validBefore));
    const signature = await account.signMessage({ message });
    const payment = Buffer.from(JSON.stringify({ x402Version: 2, scheme: "escrow", network: esc.network, payload: { signature, authorization: { ...auth, validAfter: String(auth.validAfter), validBefore: String(auth.validBefore) } } })).toString("base64");
    const sentAt = nowMs();
    const r = await f(url, { method: "POST", headers: { "content-type": "application/json", "X-PAYMENT": payment }, body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
    const text = await r.text(); let parsed: any = text; try { parsed = JSON.parse(text); } catch { /* keep text */ }
    const refusal = r.ok ? null : String((parsed && typeof parsed === "object" ? parsed.reason ?? parsed.error ?? parsed.message : parsed) ?? `HTTP ${r.status}`);
    return { ok: r.ok, status: r.status, ms: nowMs() - t0, body: parsed, receipt: decode(r.headers.get("x-payment-response")), auth, askedAt: new Date(sentAt).toISOString(), path: path(minerId), refusal };
  }
  const get = async (p: string) => { const r = await f(node + p, { signal: AbortSignal.timeout(30_000) }); const t = await r.text(); try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, json: t as any }; } };
  return { address: account.address, ask, signal: (h: string) => get(`/engine/v1/signal/${h}`), ledger: (a = account.address) => get(`/v1/ledger/account/${a.toLowerCase()}`),
    proof: (a = account.address) => get(`/v1/ledger/proof/${a.toLowerCase()}`), block: (e: number) => get(`/v1/blocks/${e}`), miners: (intent: string) => get(`/engine/v1/intents/${intent}/miners`) };
}

// ---- signal recompute (offline) ----
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}
export function canonicalSignalPayload(payload: Record<string, unknown>): string {
  const p = { ...payload }; if (typeof p.wallet_address === "string") p.wallet_address = p.wallet_address.toLowerCase();
  return JSON.stringify(sortKeys(p)).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
export const recomputeSignalHash = (s: { payload: Record<string, unknown> }) => keccak256(toHex(new TextEncoder().encode(canonicalSignalPayload(s.payload))));
