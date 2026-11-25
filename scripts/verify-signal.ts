// Recompute a Telegraph signal hash offline from GET /engine/v1/signal/{hash}.
// Rule (docs, "Verifying a call"): keccak256 of payload as compact JSON, keys sorted, wallet_address lower-cased,
// and <, > and & escaped as \u003c, \u003e, \u0026 (Go json style).
import { keccak256, toHex } from "viem";
import { readFileSync } from "node:fs";

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  }
  return v;
}
export function canonicalPayload(payload: Record<string, unknown>): string {
  const p = { ...payload } as Record<string, unknown>;
  if (typeof p.wallet_address === "string") p.wallet_address = p.wallet_address.toLowerCase();
  return JSON.stringify(sortKeys(p)).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
export function recomputeSignalHash(signalJson: { payload: Record<string, unknown> }): `0x${string}` {
  return keccak256(toHex(new TextEncoder().encode(canonicalPayload(signalJson.payload))));
}
if (process.argv[1]?.endsWith("verify-signal.ts")) {
  const file = process.argv[2] ?? "evidence/probe/signal_sample.json";
  const sig = JSON.parse(readFileSync(file, "utf8"));
  const got = recomputeSignalHash(sig);
  const ok = got.toLowerCase() === String(sig.signal_hash).toLowerCase();
  console.log(JSON.stringify({ file, claimed: sig.signal_hash, recomputed: got, match: ok }));
  process.exit(ok ? 0 : 1);
}
