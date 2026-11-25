# THESIS

Wharfinger turns Telegraph's payment rule into evidence. Telegraph sells an answer only while it is current: a paid
authorization lives at most two minutes and its nonce works once. A paid answer is therefore a timestamped fact. A
demurrage claim is won or lost on timestamped facts.

**Person:** a post-fixture demurrage analyst (persona, `MOMENT.md`).
**Action:** sign a laytime statement the shipowner can recompute and countersign or dispute line by line.
**Primitive:** the Telegraph escrow rail: routed ask, receipt, signal, ledger and epoch block.
**One sentence:** miners perceive the port, code decides each interval, a person signs.

## Primary guarantee

No hour is moved out of laytime or into demurrage unless a paid Telegraph receipt, bought while that hour was
happening, says so; and the counterparty can recompute every line without trusting Wharfinger.

## Rules the code enforces (each has a test in `packages/*/test`)

1. **No receipt, no deduction.** An interval is EXCEPTED only if corroborated facts and the SOF both support it.
2. **Corroboration needs two operators and, for position, two source families.** An operator is a registrant wallet.
   A source family is the upstream feed (for example public AIS). When both operators share a family the fact is
   marked `SAME_SOURCE` and may support an interval only together with the SOF; it is shown as one upstream.
   Reason: the probe found four operator wallets relaying one feed (`PLATFORM_PROBE.md` F15).
3. **Our own miner never counts.** Labelled "ours" wherever it appears.
4. **Stale, wrong place, out of range, no reading, disagreement, node refusal, budget spent** are named refusals, kept
   append-only, each shown in the interface. Codes: `STALE`, `WRONG_PLACE`, `OUT_OF_RANGE`, `NO_READING`, `DISAGREE`,
   `NODE_REFUSED`, `BUDGET_SPENT`, `WRONG_VESSEL`, `SAME_SOURCE`.
5. **A model never sets a number.** Money and minutes come from the engine only.
6. **Integers only.** Minutes and uUSDC; no floats in a statement.

## Weather decision (resolves finding F6)

The network sells daily observed precipitation and an hourly forecast probability, not hourly observations. Decision
taken by the build agent; Kinnoski may change it before Phase 6:

- An interval is EXCEPTED for weather only when (a) two operators from different registrants report precipitation above
  zero for that local date, and (b) the SOF has a "loading stopped" line covering the interval. The statement labels the
  weather fact "daily".
- With the SOF line but no (a), the interval is REVIEW. With (a) but no SOF line nothing stopped, so the interval counts.
- `WEATHER_FORECAST_GENERAL` is bought as a "conditions read" and shown, but never moves an hour.

## What Wharfinger will not claim

Hourly rain observations; independent corroboration of position beyond the upstream feed; any mainnet or customer
result; anything about ships it did not watch.
