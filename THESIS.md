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

## Weather decision (resolves finding F6). Kinnoski approved.

**The problem in plain words.** A ship loading grain stops when it rains or snows. Under a weather working day clause those
stopped hours are not counted against the charterer. The charterer's analyst has to prove the stop was weather. Telegraph cannot
sell "it rained between 14:00 and 18:00": the weather intents sell a daily observation (millimetres for a calendar date) and an
hourly forecast probability. So the system must decide what is enough proof, given what can actually be bought.

**Decision.** An interval is EXCEPTED for weather only when all three hold:

1. The Statement of Facts has a loading stop line whose remark names weather (snow, rain, sleet, fog and so on) and the
   interval lies inside that stop. The line is the evidence that work stopped; Telegraph never sees the quay.
2. Two operators from different registrant wallets report precipitation for that local date (a corroborated daily fact, labelled
   "daily" on the statement and the receipt cards).
3. The corroborated rainfall is at least **1.0 mm** for the day (`DEFAULT_WEATHER_MIN_PRECIP_MM`, overridable per charter with
   `weatherMinPrecipMm`). A trace of 0.1 mm does not excuse eight hours of lost loading and an owner would reject it.

Everything else is settled by one rule, "no receipt, no deduction":

| SOF weather stop | Daily rain receipt | Result |
|---|---|---|
| yes | at least the threshold | EXCEPTED, receipt attached to the line |
| yes | above zero but below the threshold | REVIEW (`WEATHER_STOP_RAIN_BELOW_THRESHOLD`), receipt attached |
| yes | none | REVIEW (`WEATHER_STOP_SOF_NO_RECEIPT`) |
| no stop line | any | the hours count; nothing stopped |
| stop for another reason (breakdown) | any | the hours count |

REVIEW hours do not count and are not excepted until the analyst resolves them with a reason, which becomes a durable note and
is listed on the statement. Once on demurrage, exceptions stop applying (once on demurrage, always on demurrage).

**Why this and not the alternatives.** Rain-only (no SOF line) would deduct hours nobody says were lost and would invite the
"obedient model" failure; an SOF line only (no receipt) is what the owner already rejects today. Requiring both, with a
threshold, is the strongest rule that the data on sale can support, and it is the one a counterparty can recompute.
`WEATHER_FORECAST_GENERAL` is bought as a conditions read and shown, but never moves an hour.

**Versioning.** Engine `laytime-1.1.0` introduced the threshold. A statement signed under `laytime-1.0.0` (any rain above zero)
is recomputed under the 1.0.0 rule by the verifier, so earlier signatures stay valid. Tests: `packages/laytime/test`.

## What Wharfinger will not claim

Hourly rain observations; independent corroboration of position beyond the upstream feed; any mainnet or customer
result; anything about ships it did not watch.
