# FINDINGS

Pre-registered probe questions for Phase 1 (G5). This section was written and hashed before any probe result was
recorded. Results are appended below the line "RESULTS" and never edit this section.

Date written: 2026-11-25 (UTC). Node: https://devnode.telegraphprotocol.com. Network: Ethereum Sepolia (eip155:11155111).

## Pre-registered questions

Each question has a prediction. The prediction is a guess made before looking, kept so that surprises are visible.

### A. Kill and pivot gate (section 18D of the build instruction)

- **A1.** How many operators (grouped by the miner's operator wallet or owner, not by display name) serve
  `VESSEL_TELEMETRY_VERIFY_GENERAL` and return a usable, fresh position for a vessel currently in port at HaminaKotka
  or Helsinki? Usable means: `latitude`, `longitude` present and numeric, `observed_at` present and parseable,
  fresh means `observed_at` within 20 minutes of the answer. Prediction: at least 2 operators, but fewer than the 19
  listed miners suggest, because many miners share one operator.
- **A2.** Can funds credited by `depositUSDCFor(voyageKey, amount)` from a different wallet be spent by the voyage key
  through a signed escrow authorization? Prediction: yes, the docs say only the beneficiary can spend.

### B. Per-intent matrix (run for each intent in section 4.2)

For `VESSEL_TELEMETRY_VERIFY_GENERAL`, `LIVE_PORT_CONGESTION_GENERAL`, `WEATHER_FORECAST_GENERAL`,
`WEATHER_FORECAST_VERIFY_GENERAL`, `SANCTIONS_SCREENING_MATCH_GENERAL`, `FX_NOW_EUR`, `SHIP_RATE_ETA_GENERAL`,
`DOCUMENT_AUTHENTICITY_GENERAL`:

- **B1.** Does the unpaid call return 402 with an `escrow` entry in `accepts`? What price, what message template?
- **B2.** What do the published request params and response fields look like (`GET /engine/v1/intents/{intent}`)?
  Does the published schema match the section 4.2 table?
- **B3.** How many compatible miners are listed, how many are `mapping: code` versus `llm`, and how many distinct
  operators do they belong to?
- **B4.** One paid routed ask with a real Kotka vessel or port: which miner, `served_rank`, cost, latency,
  `signal_hash`, receipt fields. (Blocked until the house wallet is funded.)
- **B5.** Does `GET /engine/v1/signal/{hash}` show the paying wallet as ours, and what are its `created_at` and
  verification fields? (Blocked until B4 runs.)

### C. Escrow mechanics

- **C1.** `depositUSDCFor` to a fresh address: does `GET /v1/ledger/account/{address}` show the deposit, and after how
  long (the ledger is built per epoch, 1 hour on the testnet)? Prediction: `deposited` appears within minutes
  because it is read from chain, `balance` and `available` follow `deposited`.
- **C2.** `setMyChargeLimit`: exact signature, units, whether the voyage key must hold gas, whether a limit lower than
  one answer makes the next ask return `charge limit reached`, and the exact refusal text.
- **C3.** `requestWithdraw` lifecycle: how long until `request.status` is `ready`, what `GET /v1/ledger/proof/{address}`
  returns, whether `executeWithdraw` pays out. Prediction: about 30 to 60 minutes.
- **C4.** Does the devnode accept a browser `fetch` with an `X-PAYMENT` header (CORS preflight, allowed headers,
  exposed `X-PAYMENT-RESPONSE`)? Prediction: preflight allows it, but the response header may not be exposed.
- **C5.** Does the node refuse an authorization window over 2 minutes, a reused nonce, a wrong amount, a wrong `to`?
  Record the exact reason strings.

### D. Evidence quality (these decide the corroboration design)

- **D1.** For a vessel at berth, how often does a routed vessel answer's position disagree with a second operator
  (distance in metres), and by how much?
- **D2.** How stale is `observed_at` relative to the signal `created_at`, per miner?
- **D3.** Is the vessel intent's answer for a name or MMSI ever for a different vessel?
- **D4.** Does `LIVE_PORT_CONGESTION_GENERAL` return the same figures from different operators for HaminaKotka, and
  what does `wait_hours` mean in each answer's own words?
- **D5.** Does a same-name place get returned for Finnish port towns by the weather intents?

### E. Platform behaviour

- **E1.** What 404s, what is silently ignored, and what contradicts the docs. Each goes to `PLATFORM_PROBE.md`; the
  flaws go to `FRICTION_REPORT.md` and never to the headline.
- **E2.** Does the public Daemon feed show our questions (the docs say requests are public)? What does that mean for
  vessel MMSIs?

---

## RESULTS

Appended after the pre-registered section above. The pre-registered text is byte-identical to
`evidence/probe/FINDINGS.prereg.md` (sha256 `35b76431f3dfd3dff3101edfbf611effe1050e2421048b3d086896c124bbe6bf`).

### Answered on 2026-11-25 without funds

| Question | Result | Prediction | Evidence |
|---|---|---|---|
| B1 unpaid 402 has an `escrow` entry | Yes, for all four intents tried. Price `$0.01`, `Amount: 10000 uUSDC`, network `eip155:11155111`, payTo is the Diamond | as predicted | `402_*.json` |
| B2 published schema vs section 4.2 | Matches for vessel, port, weather verify, FX. Differs for `SHIP_RATE_ETA_GENERAL` (parcel rate, not vessel ETA). Weather verify is daily | partly wrong | `PLATFORM_PROBE.md` F5, F6 |
| B3 miners, mapping, operators | Vessel 19 miners, 18 llm, 6 operators. Port 15, 13 llm, 6 operators | operators fewer than miners, as predicted | `SPONSOR_INTEL.md` section 3 |
| C4 CORS | Preflight allows only `Content-Type`; `X-PAYMENT` is not allowed from a browser. Response headers: `access-control-allow-origin: *` | preflight as predicted. The 402 response carries `access-control-allow-origin: *` and no `access-control-expose-headers`, so a browser could not read `X-PAYMENT-RESPONSE` either (the paid response itself is untested until funded) | F2 |
| C5 refusal strings | 13 cases, all as documented | as predicted | `c5_auth_refusals.json` |
| E2 asks public | Yes: user asks are listed with question text; signal names the wallet | as predicted | `daemon_user_sample.json` |
| A1 (partial) operators serving the vessel intent | 6 operator wallets, but 2 groups share one upstream, so independent sources number fewer. Decisive result needs paid asks | as predicted on operators, worse than predicted on source independence | F4 |

### Open: blocked on a funded probe wallet

A2, B4, B5, C1, C2, C3, D1 to D5. Probe address: see `PROGRESS.md`. Run order is in the header of
`scripts/probe-paid.ts`.

### Answered by the paid probe, 2026-11-25 (rows in `evidence/probe/paid/`)

| Question | Result | Prediction | Where |
|---|---|---|---|
| A1 operators with usable fresh position | 4 operator wallets, all the same upstream; the one different source was 25 h stale | at least 2: right; "fewer than 19 suggest": right; independent sources: worse | F15, F16 |
| A2 voyage key spends `depositUSDCFor` funds | Yes, 4 asks served | as predicted | `paid/stage_limit.json` |
| B4 paid routed ask per intent | 28 rows; routed asks served at rank 1 or 2; median latency about 5 s; cost 10000 uUSDC each | n/a | `paid/asks_matrix.json` |
| B5 signal shows our wallet; `created_at` | 22 of 22 ours; inside the authorization window in all 22 | as predicted | `paid/asks_matrix.json` |
| C1 deposit visibility | 1.2 s after confirmation (house and voyage) | within minutes: faster | `paid/stage_deposit.json`, `stage_voyage.json` |
| C2 charge limit | Applies after a delay of minutes; refusal text recorded; resets next block | n/a | F21 |
| D1 operator disagreement | Not small disagreements: 5 agree within 1 m, 3 wrong positions, 2 no position | n/a | F16 |
| D2 staleness | 86 to 161 s for fresh answers; one answer 25.3 h old | n/a | F16 |
| D3 wrong vessel | Yes: one miner returned a list of other vessels | not predicted | F16 |
| D4 port wait agreement | Only one operator answered routed port asks; a second pinned operator returned raw AIS; no agreement test possible | n/a | F17, F20 |
| D5 same-name place | Weather resolved Kotka correctly. The port intent returned Hanko for Kotka | partly | F17 |
