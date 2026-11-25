# MOMENT

## The person (fictional, labelled wherever she appears)

Mira Kallio, a post-fixture demurrage analyst at a grain and fertiliser trading desk in Helsinki. She handles 30 to
40 voyage charters a month loading at Kotka and Helsinki and argues each demurrage invoice with shipowners in
Piraeus, Hamburg and Singapore. She is a persona, not a customer. Nobody named Mira has used this product.

## The moment, with a clock

A Supramax tenders Notice of Readiness (NOR) at 02:40 on a Saturday from the Kotka anchorage. Snow stops grain loading
twice before dawn. The vessel waits 19 hours for a berth. Three weeks later the owner's invoice arrives: 41 hours on
demurrage at $18,000 a day, which is $750 an hour. The rate and hours are an invented example; the rate sits inside
the range one industry source gives (below). Mira has the Master's handwritten Statement of Facts (SOF) and her own
spreadsheet, and 90 days before the time bar.

## Today, step by step

She reads the SOF PDF, types each event into a spreadsheet, looks up the weather on a public archive after the fact,
emails the agent for berth times, then argues line by line by email.

## What goes wrong

The SOF says "rain 14:00 to 18:00" and the owner rejects it. NOR was tendered from outside port limits and nobody can
prove where the ship was at 02:40. Waiting time is classified the wrong way. The time bar passes.

## The action Wharfinger completes

A signed laytime statement with the demurrage or despatch figure, every contested interval linked to paid Telegraph
receipts bought while that interval was happening, delivered as PDF and JSON, countersigned or disputed line by line
by the owner. Her role: enter the charter-party terms, attach the SOF, resolve each REVIEW interval with a reason,
sign with her own wallet. Only her assertions become durable notes.

## Everyone assumes X; in reality Y

Everyone assumes the facts of a port call can be reconstructed afterwards. The sources that matter (live position,
live port queue, current weather) are sold now, and a dispute three weeks later is fought over memory. Section
"What the network sells" in `DISCOVERY.md` shows this with a script.

## Sourced pain table

Every money figure below is asserted by `tests/sources.test.ts` against `docs/sources/quotes.json`, which holds the
exact quoted sentence, URL and retrieval date (2026-11-25).

| What is true | Source |
|---|---|
| Dry bulk accounts for $8 to 10 billion in demurrage fees annually, roughly 6 to 8% of total freight spend | Marcura, "Demurrage claims leakage" (marcura.com/blog/demurrage-claims-leakage) |
| Demurrage rates run $15,000 to $30,000 per day | same page |
| 99% of statements of facts are still processed manually, an estimated 12 million hours per year | same page |
| One real portfolio documented $450,000 in time bar failures in a single year | same page |
| A single miscategorised six-hour weather event at $20,000/day changes the claim by $5,000 | Voyager, "The Basics of Bulk Shipping Demurrage" (voyagerportal.com) |
| In non-containerised shipping 99% of SoFs are created with clipboard, pen and paper; an estimated 120 million events are logged by hand each year | Hellenic Shipping News, "Manually Processing Demurrage Is Costing Charterers Millions" |
| English Commercial Court case with laytime "48hrs shinc ttl" and a demurrage claim | Amalie Essberger v Marubeni, [2019] EWHC 3402 (Comm), caselaw.nationalarchives.gov.uk/ewhc/comm/2019/3402 |

A claim can be lost on documents as well as on hours: in the clause quoted by Reed Smith in its note on that case, a demurrage claim is waived unless received "within 90 days after completion of discharge of the last parcel of Charterer's cargo(es)" with all supporting calculations and documents, and the firm's advice is to attach all required documents regardless of whether the charterers already hold them (Reed Smith note on Amalie Essberger, read through its Mondaq copy). The firm's own blog page could not be fetched; the Mondaq copy was.

Not quoted, because the page could not be read in the build environment: BIMCO Laytime Definitions for Charter Parties 2013 (the page is rendered in the browser and no PDF mirror was reachable). No rule is claimed from it, and `packages/laytime` states its rules in plain words as rules of the engine, not as BIMCO quotations.

Vendor sources (Marcura, Voyager) sell demurrage software, so their figures are an interested party's estimates.

## Practitioner questions (for a deck officer or ship agent Kinnoski can reach)

1. At Kotka, what makes a Notice of Readiness valid: arrival inside port limits, at the anchorage, or at berth, and who
   checks?
2. How is snow logged on a Statement of Facts, and does "loading stopped, snow" carry a time to the minute?
3. When an owner disputes weather time, what evidence do they accept, and what do they reject?

No reply has been received. Nothing is quoted. Any reply will be recorded here with its date and exact scope.
