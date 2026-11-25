# SDK_SURFACE

Every Telegraph feature the code calls, with the line that calls it. `tests/sdk-surface.test.ts` fails when a listed line stops containing its text, so this file cannot drift from the code (build instruction, rule 14).

Version context: Telegraph testnet node and Diamond as probed on 2026-11-25 (`PLATFORM_PROBE.md`). The node publishes no version string.

| Feature | `file:line` | Text on that line | Status |
|---|---|---|---|
| Routed ask (`POST /engine/v1/ask`) | `packages/telegraph/src/index.ts:26` | `const path = (minerId?: string) =>` | live |
| Pinned ask (`POST /engine/v1/ask/{minerId}`), used only for a re-buy | `packages/watch/src/index.ts:58` | `pin = nx.minerId` | live |
| Escrow authorization (EIP-191 over `extra.message`, lowercase `from`, nonce, window) | `packages/telegraph/src/index.ts:42` | `const message = template.replace` | live |
| Window never over 120 s (backdate counted) | `packages/telegraph/src/index.ts:22` | `const BACKDATE_SEC = 5` | live |
| Per-answer signing cap | `packages/telegraph/src/index.ts:38` | `if (BigInt(value) > cap) throw new OverCapError` | live |
| `X-PAYMENT` header | `packages/telegraph/src/index.ts:46` | `"X-PAYMENT": payment` | live |
| Receipt from `X-PAYMENT-RESPONSE` | `packages/telegraph/src/index.ts:49` | `receipt: decode(r.headers.get("x-payment-response"))` | live |
| Signal read (`GET /engine/v1/signal/{hash}`) | `packages/telegraph/src/index.ts:52` | `signal: (h: string) =>` | live |
| Signal hash recompute (offline) | `packages/telegraph/src/index.ts:66` | `export const recomputeSignalHash` | live |
| Ledger read (`GET /v1/ledger/account/{address}`) | `packages/telegraph/src/index.ts:52` | `ledger: (a = account.address)` | live |
| Ledger proof (`GET /v1/ledger/proof/{address}`) | `packages/telegraph/src/index.ts:53` | `proof: (a = account.address)` | live (read; the withdraw send is in the probe script) |
| Epoch block read (`GET /v1/blocks/{epoch}`) | `packages/telegraph/src/index.ts:53` | `block: (e: number)` | live (read); receipt lookup in a block is not yet used |
| Compatible miners (`GET /engine/v1/intents/{intent}/miners`) | `packages/telegraph/src/index.ts:53` | `miners: (intent: string)` | live (read) |
| Budget gate from ledger `available` | `packages/watch/src/index.ts:56` | `if ((await deps.available()) < PRICE_UUSDC)` | live |
| Node refusal kept and the watcher holds | `packages/watch/src/index.ts:43` | `const isEscrowRefusal` | live |
| `depositUSDCFor` to a voyage key | `scripts/probe-paid.ts:92` | `functionName: "depositUSDCFor"` | live (probe script; the app flow is not built) |
| `setMyChargeLimit` on a voyage key | `scripts/probe-paid.ts:100` | `functionName: "setMyChargeLimit"` | live (probe script; the app flow is not built) |
| `requestWithdraw` | `scripts/probe-paid.ts:114` | `functionName: "requestWithdraw"` | live (probe script); `executeWithdraw` not yet completed |
| Operator grouping by registrant wallet | `packages/evidence/src/index.ts:112` | `const byOperator =` | live |
| Re-buy ranked by persisted pass rate | `packages/evidence/src/index.ts:143` | `export function nextRebuy` | live |

## Used by the design but not yet called by code

| Feature | Why not yet |
|---|---|
| `executeWithdraw` sweep from the app | The probe sent `requestWithdraw`; the node still reports `waiting_root`. The send is scripted (`--stage=withdraw-exec`) and untested until the status is `ready` |
| Epoch block receipt lookup (`/v1/blocks/{epoch}/deliveries/{receiptHash}`) | Epoch 53 had not closed when last read |
| `FX_NOW_EUR` conversion line | Bought once in the probe; not wired into a statement |
| `SANCTIONS_SCREENING_MATCH_GENERAL` screening note | Bought once; returned a false person match for a vessel name (F22). Not wired |
| WebSocket, API key, MCP, on-chain jobs, x402 `exact` rail | Not used, so not claimed |

## Not claimed

Hourly weather observations, independent corroboration of position beyond the upstream feed, mainnet operation.
