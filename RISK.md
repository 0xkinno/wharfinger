# RISK

## Money

| Item | Value | Where enforced |
|---|---|---|
| Price per answer | 10,000 uUSDC ($0.01) at the demand multiplier 1.0 (the vessel and port intents had no demand in the epoch read) | node quote |
| Per-answer signing cap | 50,000 uUSDC; the client refuses to sign a larger quote | `packages/telegraph` |
| Authorization window | at most 120 s; the client refuses a longer one | `packages/telegraph`, node |
| Voyage cap | the amount deposited with `depositUSDCFor`. The node refuses the next answer with `insufficient escrow for delivery` when it runs out | escrow, not our code |
| Per-block cap | `setMyChargeLimit` on the voyage key. Applied by the node minutes after the transaction (probe F21) | escrow |
| Max loss per voyage | the deposit. A voyage key holds no other funds except gas dust (0.002 ETH testnet) | escrow |
| House voyage (judge door) | a separate funded key, labelled, with a daily spend ceiling in the database | `packages/watch` |

## Cost model, corrected

The build instruction suggests a default cap of 0.50 USDC (50 answers). Priced from the probe, that is too small for a
30 minute double-bought cadence: vessel bought from two operators every 30 minutes costs 4 answers an hour, $0.04 an
hour, $1.92 for a 48 hour stay before port, weather and ledger reads. The funding screen therefore shows an estimate
before the deposit, and the watcher uses a cadence that depends on state:

| State | Vessel (2 operators) | Port wait | Weather read |
|---|---|---|---|
| Approaching, at anchor, or moving | every 30 min | every 2 h | every 3 h |
| Moored, speed 0, same zone for 3 reads | every 2 h | every 4 h | every 6 h |
| Any state change, NOR, all fast, loading stop or resume | immediate | immediate | immediate |

Estimated cost for a 48 hour stay with 10 hours of anchorage: about $1.20 to $1.60. Default cap proposed: 2.00 USDC,
changeable by the analyst before funding. These are estimates until Phase 5 records a real voyage.

## Rounding (stated once, used everywhere)

- Instants are whole minutes, truncated (floor) when captured.
- Interval length is the difference of two whole minutes.
- Money for a statement is computed once on total minutes: `floor(minutes x ratePerDay / 1440)` in uUSDC integers.
  Rounding down means a statement never overstates the owner's liability. This favours the owner by less than one
  uUSDC per statement, and is stated on the statement.
- Currency conversion to EUR (via `FX_NOW_EUR`, receipt attached) is a display line and never feeds the USD figure.

## Failure modes and the response

| Risk | Response |
|---|---|
| Node refuses (balance, limit, nonce) | Hold. Never retry with another key. Record `NODE_REFUSED` or `BUDGET_SPENT` |
| Miner returns wrong place, stale or empty | Refuse with a code, re-buy from a different operator by pinned ask |
| Two operators share a feed | `SAME_SOURCE`; the interval cannot move on that fact alone |
| Duplicate tick | Lease row per voyage per 30 minute slot; unique constraint |
| Receipt not yet in an epoch block (hours) | Show "block pending"; keep the receipt header; verify later |
| Withdraw stalls | Show "pending since"; never assume |
| Key custody | Voyage keys derive from a mnemonic held only in the server environment; only addresses are shown; keys never logged |
| Public asks | Vessel names and MMSIs are public record and appear in the public feed |
