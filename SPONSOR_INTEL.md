# SPONSOR_INTEL

What Telegraph is, as read from its documentation and measured on its testnet node on 2026-11-25. Every statement
here is either quoted from a page saved in `reference/docs/telegraph/` or backed by a file in `evidence/probe/`.
Claims about behaviour that was not measured are marked "docs say".

## 1. What Wharfinger relies on

| Fact | Basis |
|---|---|
| A paid ask is `POST /engine/v1/ask` (routed by the node) or `POST /engine/v1/ask/{minerId}` (pinned). Canonical body is `{intent, params}`, validated before any charge | docs; unpaid challenge captured in `evidence/probe/402_*.json` |
| The unpaid call returns 402 with three `accepts` entries: `exact` on Base Sepolia, `exact` on Solana Devnet, and `escrow` on Ethereum Sepolia paying the Diamond. Price quoted as `$0.01` | `evidence/probe/402_VESSEL_TELEMETRY_VERIFY_GENERAL.json` |
| Escrow authorization is an EIP-191 signature over the template in `extra.message`, sent base64 in `X-PAYMENT`. The node enforces: exact amount, `to` is the Diamond, window at most 2 minutes, single-use nonce, lowercase `from`, chain in the message | 13 refusal cases reproduced with a throwaway key: `evidence/probe/c5_auth_refusals.json`. Every refusal string matches the docs |
| A verified signature spends the nonce even when the ask is then refused for balance | Reproduced (cases a, f, l, m in the same file) |
| Receipt header `X-PAYMENT-RESPONSE`: `receipt_hash`, `rail`, `payer`, `miner`, `intent`, `amount_uusdc`, `epoch_id`, `settlement:"epoch"`, `chain:"telegraph"`, `timestamp`. No `tx_hash` | docs; live receipt pending the funded probe |
| `GET /engine/v1/signal/{hash}` returns the signal (with `created_at` and the paying `wallet_address`), the payload the hash covers, and `verification`. The hash re-derives offline: keccak256 of the payload as compact JSON, keys sorted, wallet lower-cased, `<`, `>`, `&` escaped | Re-derived on a real signal: `scripts/verify-signal.ts`, `evidence/probe/signal_sample.json` |
| `GET /v1/ledger/account/{address}` returns `deposited`, `withdrawn`, `charged`, `credited`, `unbilled`, `balance`, `available`, `charge_limit`, `charged_this_block`, `request`, `active_root` | Read live for a known paying wallet (see `PLATFORM_PROBE.md`) |
| `GET /v1/blocks/{epochId}` returns the epoch block: `window_from`, `window_to`, and a `deliveries` list with `receipt_hash`, `payer`, `miner_id`, `intent`, `usdc`, `class`, `ranking_round` | Read live for epoch 52 (window 4.5 hours). Epoch 53 was still running and answered 404 "no block recorded for this epoch" |
| Routing is probabilistic by leaderboard rank: 70 percent top, 20 percent second, 10 percent third. New miners get a 7-day grace period with 5 percent of traffic shared among all grace miners | docs (`protocol/how-it-works`, `miners/miner-overview`) |
| Price is the miner floor times a demand multiplier by 24-hour volume per intent (1.0 below 1,000 requests a day) | docs. All 19 vessel miners have a floor of 10,000 uUSDC |
| Requests are public: the Daemon feed lists user asks with their question text, and the signal page shows the paying wallet | docs; confirmed by `evidence/probe/daemon_user_sample.json` |
| Escrow funds another wallet with `depositUSDCFor(beneficiary, amount)`; only the beneficiary can spend or withdraw | docs; contract function present on chain; spend by a funded key still to be tested |
| `setMyChargeLimit(uint256)` exists on the escrow facet (selector `0xf3f44d54`). `chargeLimitOf(address)` returns 1,000,000,000 uUSDC (1,000 USDC per block) for an address that never set one | `evidence/probe/diamond_selectors_matched.json`, `chain_state.json` |
| `executeWithdraw` calldata is served by `GET /v1/ledger/proof/{address}`; its selector is `0x6c438297` | proof response for a known wallet |

## 2. Primitive depth ladder (build instruction 4.3)

| Rung | What it looks like | Who does it | Wharfinger status |
|---|---|---|---|
| Shallow | One server key, one routed ask per question, show the answer | Most entries | not our target |
| Deep | Escrow rail with receipts, signal links, re-buy from another miner on a failed check, spend caps in code | The strongest samples | Phase 4 |
| Newest | The user's wallet funds a per-voyage key with `depositUSDCFor`; the cap lives in the escrow; `setMyChargeLimit` on that key; the 2-minute authorization window, signal `created_at` and epoch window used as a notarial clock; corroboration across operators; counterparty recomputation from the signal; leftover funds returned by `requestWithdraw` and `executeWithdraw` | Not seen in any reference repository | Phase 1 verified that every on-chain function exists and every read endpoint works. The spend, limit and withdraw steps await a funded probe |

## 3. Intents Wharfinger would buy, with verified schemas

Read from `GET /engine/v1/intents/{intent}` on 2026-11-25. Scored field marked with an asterisk.

| Intent | Class | Params | Response fields | Compatible miners | Operators (by registrant wallet) | Correction to the build instruction |
|---|---|---|---|---|---|---|
| `VESSEL_TELEMETRY_VERIFY_GENERAL` | judgment | `vessel` (name, MMSI or IMO) | `vessel`, `speed_knots`*, `latitude`, `longitude`, `course_deg`, `observed_at` | 19 (18 llm-mapped, 1 code-mapped) | 6, sizes 11, 4, 1, 1, 1, 1 | Confirmed. Operator count is not source count: see F4 |
| `LIVE_PORT_CONGESTION_GENERAL` | judgment | `port` | `port`, `vessels_waiting`, `wait_hours`*, `congestion_level`, `as_of` | 15 (13 llm, 2 code) | 6, sizes 10, 1, 1, 1, 1, 1 | Confirmed |
| `WEATHER_FORECAST_GENERAL` | judgment | `location`, optional `window_hours` | `location`, `when`, `temp_max_c`*, `temp_min_c`, `precipitation_probability_pct`, `condition` | 28 | 17 | A forecast probability, not an observation |
| `WEATHER_FORECAST_VERIFY_GENERAL` | judgment | `location`, `date` (past date) | `location`, `date`, `temp_max_c`*, `temp_min_c`, `precipitation_mm`, `condition` | 28 (27 llm, 1 code) | 11 | Daily granularity only. Cannot say whether it rained in a given hour: see F6 |
| `SANCTIONS_SCREENING_MATCH_GENERAL` | judgment | `name` | `name`, `matched`*, `matches`, `lists`, `match_score` | 31 | 14 | Confirmed |
| `FX_NOW_EUR` | deterministic | `currency` | `rate`* | 20 (14 llm, 6 code) | 10 | Confirmed |
| `SHIP_RATE_ETA_GENERAL` | judgment | `origin`, `destination`, `weight_kg` | `carrier`, `rate`*, `currency`, `transit_days`, `eta` | 21 | 6 | **Not a vessel ETA.** It prices a parcel by carrier. Dropped from Wharfinger: not used, so not claimed |
| `DOCUMENT_AUTHENTICITY_GENERAL` | judgment | `document` (text or link) | `document`, `authentic`*, `verdict`, `evidence` | 19 | 6 | Optional only; never sets a number |

Rankings: the leaderboard for epoch 53 has no entry for the vessel, weather-verify and document intents. Every ranked
vessel miner shows score 0. See F3.

## 4. How much of each document was read

The build instruction asks for every document in 4.1. Pages were saved as HTML and text in `reference/docs/telegraph/`.

| Depth | Pages |
|---|---|
| Read in full | `introduction`, `whats-new-v2`, `using/consume-intelligence`, `using/intent-schema`, `using/engine-ask`, `using/inference-paths`, `using/escrow-inference`, `using/daemon-signals`, `protocol/addresses-and-params`, `protocol/how-it-works`, `miners/miner-overview`, `scoring/contribute-evaluation-data` |
| Read for the sections Wharfinger depends on | `using/x402-inference` (verification, receipts, networks, pricing), `protocol/roles` (agent and miner) |
| Read by headings and opening section | `using/api-keys`, `using/anjoman-skill`, `using/mcp-server`, `using/websocket-signals`, `using/erc8183-jobs`, `protocol/tokenomics` |
| Read by headings, opening section and every constraint line (must, refused, rejected, at least, minimum, limit) | `miners/yaml-config`, `miners/validation-api`, `miners/miner-registration`, `scoring/build-a-scoring-module`, `scoring/train-a-scoring-adapter`, `scoring/upgrade-shared-foundation` |

The third group covers paths Wharfinger does not use in Phases 1 to 8 (API keys, WebSocket, on-chain jobs) or work that
starts in Phase 9 (miner registration, adapter training). A full read of those pages is the first task of Phase 9.
The Anjoman dashboards listed in 4.1 are rendered in the browser and could not be read by the build agent.

## 5. What this changes for the design

1. Corroboration must group by upstream source as well as by operator wallet (F4).
2. The weather exception cannot rest on a bought hourly precipitation fact; the intents sell a daily observation and
   an hourly forecast probability (F6).
3. Paid asks run server-side only, because the node's CORS preflight rejects `X-PAYMENT` from a browser (F2). The
   verify page can still read signals, ledger and blocks directly.
4. Receipts are provable from the epoch block only after the block is recorded, hours later (F8). The statement must
   keep the receipt header and show a "block pending" state.
5. The vessel intent has no ranking to route by (F3). The first buy is still routed, as the rules require, and the
   statement records the served rank the node reports.
