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
