# GROWTH

Build in public log. This file is what judges read for the 20 growth points (content and education, ease of adoption,
organic distribution, community growth and activation). Every post, reply and reproduction goes here with a date and a
link. Nothing is posted without Kinnoski's approval; nothing below has been posted yet.

Rules kept (from the rules page): no bought or coordinated engagement, no fake accounts, no incentives to star or
follow. Every promotional post discloses hackathon participation and the prize incentive and tags `@Telegraphprotoc`.
Likes and follower counts are not recorded as evidence.

## Log

| Date (UTC) | Channel | Link | What it covers | Independent action that followed |
|---|---|---|---|---|
| 2026-11-26 | X thread (3 posts), posted by the owner | https://x.com/0xkiddok/status/2125900333683482939 | The problem, the watcher and the recompute check, with cover and tamper images | none yet |

## Independent developer evidence

| Date | Who (with permission) | What they did | Link or artefact |
|---|---|---|---|
| none yet | | | |

## Drafts awaiting approval

### Draft 1: scope comment on the Mission 08 issue (bounties issue 196)

Post this as an ordinary comment first. Then post `/claim` alone as a second comment, because the bot reads the first
word of a comment as the command. A claim must be followed by a meaningful `/progress` update within 72 hours or it is
released automatically (bounties `CONTRIBUTING.md`).

```text
Scope for Mission 08 (Commodities), entering Apps & Agents with the same code also feeding an Evaluators and a Miners entry.

Who: a post-fixture demurrage analyst at a physical commodity trading desk.
What the app does: watches a ship in port at HaminaKotka, Helsinki or Turku and buys vessel position, port wait and weather
answers on Telegraph every 30 minutes, from a per-voyage key funded with depositUSDCFor from the analyst's own wallet.
Each answer is kept with its receipt and signal hash. Code, not a model, classifies each hour of the stay as counting,
excepted or review, and the analyst signs a laytime statement the shipowner can recompute from the signals.
Intents used: VESSEL_TELEMETRY_VERIFY, LIVE_PORT_CONGESTION, WEATHER_FORECAST_VERIFY, FX_NOW (plus sanctions screening as a
pre-watch check).
Network: Telegraph testnet, Ethereum Sepolia escrow. Nothing here is a mainnet or customer claim.
Hackathon entry; the prize incentive applies.
```

### Superseded: the earlier single-post draft (use the three-post thread above instead)

```text
Build log 1, Telegraph Hackathon Season II (hackathon entry, prize incentive applies) @Telegraphprotoc

A ship's port stay gets argued weeks later from a handwritten page. At an example rate of $18,000 a day, one hour is $750.

Telegraph only sells an answer while it is current, so a paid answer is a timestamped fact. Building Wharfinger for
Mission 08 to use that for demurrage claims.

First paid vessel answer, with its signal: [SIGNAL LINK, added after the first paid ask]
Repo: github.com/0xkinno/wharfinger
```

### Draft 2b and 2c: follow-up updates on later dates (awaiting approval)

The organisers say to aim for at least three useful updates on different dates. Post the thread above first, then these on later days.

```text
Update 2 (around Nov 28 to 29, with gate.jpg)
Wharfinger can now hold a payment. The gate checks the statement recomputes, both keys match and the payee has a clean paid sanctions receipt from @Telegraphprotoc.
Tampered: blocked. Sanctions hit: escalated. Clean: released on @solana devnet, statement hash in the memo.
https://wharfinger-kinnoskis-projects.vercel.app/settle
Hackathon entry.

Update 3 (around Nov 30, with the demo video if it exists)
Ask Telegraph for the Kotka port queue and miners answered for Hanko. So I registered a provider that does not: Wharfinger Port Queue, for LIVE_PORT_CONGESTION. I also bought 150+ answers from other miners and labelled them for evaluators.
https://github.com/0xkinno/wharfinger
Hackathon entry for @Telegraphprotoc. AI assisted.
```

### Later option: tutorial post (the tutorial exists and was run live)

`TUTORIAL.md` and `examples/buy-a-fact.ts` (9 lines) are in the repository. A post linking them, disclosing the hackathon and prize incentive and tagging `@Telegraphprotoc`, waits for approval. Independent reproduction by another developer is the evidence that earns points; none yet.

Open questions for Kinnoski before posting: the exact repo URL once public; whether to include a screenshot of the first
signal page; the account to post from (`@0xkinno`).

### Draft 2: X thread, three posts (awaiting approval)

Each post is under 280 characters (a link counts as 23). The first ends with the thread emoji (written here as [thread emoji] because the repository style check bans emoji; the exact text with the emoji is in `reference/TWEETS.md`, which is not committed). The last carries the disclosure the rules
require: hackathon entry, prize incentive, AI assistance.

```text
1/3
A ship sat in port for three days. Three weeks later the owner billed 41 hours of demurrage, $750 an hour, and the analyst had one handwritten page to argue with.

So I built a harbour officer on @Telegraphprotoc that buys the evidence while it is still true. [thread emoji]

2/3
Wharfinger watches the ship: position, port queue and weather every 30 minutes, each one a paid answer with a receipt. It refuses wrong or stale answers (one miner put the ship 3,710 km away). Code classifies every hour of the stay. No model sets a number.

3/3
The owner recomputes each line in a browser from the receipts. Change one minute and it fails at that line. Now a gate holds the payment until that evidence checks out.

Testnet. Hackathon entry, built with AI assistance.
https://wharfinger-kinnoskis-projects.vercel.app
```

Attach `judge-break.jpg` to post 3 (or the video once recorded). Post the repository link as a reply, not in the thread.

### Later option: tutorial post (the tutorial exists and was run live)

`TUTORIAL.md` and `examples/buy-a-fact.ts` (9 lines) are in the repository. A post linking them, disclosing the hackathon and prize incentive and tagging `@Telegraphprotoc`, waits for approval. Independent reproduction by another developer is the evidence that earns points; none yet.

Open questions for Kinnoski before posting: the exact repo URL once public; whether to include a screenshot of the first
signal page; the account to post from (`@0xkinno`).

### Draft 2: first post on X (awaiting approval)

Discloses the hackathon and the prize incentive, as the rules require.

```text
A ship sits in port for three days. Three weeks later the owner bills 41 hours of demurrage and the analyst has one handwritten page.

Wharfinger buys the facts on @Telegraphprotoc while they are still true (position, port queue, weather), classifies every hour
in code, and lets the owner recompute each line from the receipts. Press "tamper one minute" and the check fails at that line.

Telegraph testnet entry for the Season II hackathon (prize incentive applies). Built with AI assistance.
Live: https://wharfinger-kinnoskis-projects.vercel.app
Code: https://github.com/0xkinno/wharfinger
```

Attach `apps/web/public/readme/judge-break.jpg` or the video. The card image is `/og.png`.

### Draft 3: reply in the Commercial Use Cases thread (awaiting approval)

```text
Mission 08 Commodities, Apps & Agents: Wharfinger (repo and live app below). It already buys vessel position, port queue and
weather on Telegraph, refuses wrong and stale answers, and produces a statement the counterparty can recompute.

Closest fit, stated plainly: Solana use case 4 (Verified Global Trade and Autonomous Commerce) needs the same layer:
independent evidence of a shipment or a port stay before money moves. Wharfinger supplies that evidence and a recompute check
today on Sepolia, and a settlement gate now holds, escalates, blocks or releases a payment on that evidence. A released
payment was sent on Solana devnet (test token, not USDC) and read back from the chain: https://explorer.solana.com/tx/3uAkgU3WL2E1XrXA9JZ5ckaJhKaciMCxKu8ubRjv68iZcRTMp141VcDcAWqMVM2fcAGKQHrCjpNFDA2T6SfQ15M5?cluster=devnet
Pay.sh is not integrated yet; looking for a Pay.sh adapter author.

Repo: https://github.com/0xkinno/wharfinger | Live: https://wharfinger-kinnoskis-projects.vercel.app
```

### Discord notes (2026-11-26)

The organiser asked for apps to be listed in the Anjoman Apps directory now, the final form opens near the end, and showcase posts go
in the `showcase` channel. Use cases outside Mission 08 are optional; one application may address several.
