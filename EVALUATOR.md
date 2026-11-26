# Evaluation material: vessel telemetry

Preference pairs for `VESSEL_TELEMETRY_VERIFY_GENERAL`, a judgment-class intent. Each line is `{"prompt","chosen","rejected"}`, the format
Anjoman Evaluate accepts for judgment material. The file to upload is `evidence/eval/vessel_telemetry_upload.jsonl` (pairs whose answers are longer than 4,000 characters are dropped so length cannot give the label away).

## How the pairs were made
`scripts/buy-eval-cases.ts` asks every miner that serves the intent the same question about a ship currently in a Finnish port, paying
each answer from the escrow ($0.01). It labels each answer against Digitraffic AIS, a public source that is independent of the answer
being judged: **GOOD** when the answer passes the place, time, vessel and range checks and lies within 2 km of the AIS position,
**BAD** otherwise. Every BAD answer is paired with the GOOD answer for the same ship nearest in time. `scripts/build-eval-material.ts` adds
pairs from the purchases stored by the app. Provenance (miner ids, receipts, distance from truth, AIS position and time) is in the
`*.provenance.json` files beside the pairs.

## The upload file
28 pairs over 7 prompts (7 ships): 15 rejected answers are wrong place or stale, 13 are no reading. 114 paid answers were labelled in all
(43 GOOD, 50 BAD, 20 miner errors that returned nothing to judge); `evidence/eval/vessel_telemetry_cases.json` holds every one with its receipt.

## What the rejected answers look like
Wrong place (latitude equal to longitude, about 3,700 km from the ship), stale (tens of kilometres off), wrong vessel (a list of other
ships), and no reading (null fields). No answer was edited. Chosen and rejected texts are the miners' own JSON.

## Limits
Most miners relay the same Digitraffic feed, so the GOOD answers agree with the truth source partly because they share it; the pairs
test whether a judge can tell a sound answer from a broken one, not whether the feed is right. Ships were all moored or at anchor, so
no pair covers a moving vessel. The set is small and grows when `buy-eval-cases.ts` is run for more ships. Upload does not promote
material: the Anjoman page shows eligible or rejected separately from any ranking that uses it.
