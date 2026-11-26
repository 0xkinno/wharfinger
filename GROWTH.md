# GROWTH

What has been posted, what is next, and the exact text for each place. Every post says it is a hackathon entry and tags
`@Telegraphprotoc`. Rules kept: no bought or coordinated engagement, no fake accounts, no asking anyone to like, follow or star.
Likes and follower counts are not used as evidence.

## 1. Posted

| Date (UTC) | Where | Link | What it covers |
|---|---|---|---|
| 2026-11-26 | X, first thread (3 posts) | https://x.com/0xkiddok/status/2125900333683482939 | The problem, how Wharfinger watches a ship, and the recompute check |

The thread, as posted:

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

Images: `social/cover.jpg` on post 1, `social/tamper.jpg` on post 3. The exact text with the emoji is in `reference/TWEETS.md` (not committed).

## 2. Next posts on X

The organisers ask for at least three useful updates on different dates, so these go out on later days, not today.

Update 2, about Nov 28 to 29, with `social/gate.jpg`:

```text
Wharfinger can now hold a payment. A gate checks the statement recomputes, both keys match and the payee screens clean on a paid @Telegraphprotoc receipt. Tampered: blocked. Sanctions hit: escalated. Clean: released on @solana devnet. Hackathon entry.
https://wharfinger-kinnoskis-projects.vercel.app/settle
```

Update 3, about Nov 30, with the demo video if it exists:

```text
Telegraph miners answered the Kotka port queue as Hanko. So I registered a provider that gets it right: Wharfinger Port Queue on @Telegraphprotoc. I also bought 150+ answers from other miners and labelled them for evaluators.
https://github.com/0xkinno/wharfinger
Hackathon entry.
```

## 3. Discord

### 3a. Showcase post (channel `showcase`, tag "Apps & Agents")

Title:

```text
Wharfinger: every disputed hour of a port call, with a receipt the shipowner can check
```

Message:

```text
Mission 08 (Commodities). Wharfinger watches a ship in port and buys vessel position, port queue and weather answers on Telegraph every 30 minutes, with a receipt for each. Code, not a model, classifies every hour of the stay. The analyst signs it, and the shipowner recomputes every line in a browser.

What works today (testnet):
- Paid Telegraph answers with receipts. Wrong and stale answers are refused and re-bought (one miner put a ship 3,710 km away).
- Change one minute in a signed statement and the recompute fails at that line.
- A settlement gate blocks, holds, escalates or releases a payment on that evidence. A release was sent on Solana devnet and read back from the chain.
- A production voyage (MV Kraftca at Kotka) is ticking by itself.
- A Provider (Wharfinger Port Queue, answers Kotka correctly) and labelled evaluator material.

Try it, no login: https://wharfinger-kinnoskis-projects.vercel.app/judge
Settlement gate: https://wharfinger-kinnoskis-projects.vercel.app/settle
Code: https://github.com/0xkinno/wharfinger
X thread: https://x.com/0xkiddok/status/2125900333683482939

Limits: everything is testnet, the Solana payment uses a devnet test token (not USDC), hourly rain cannot be bought, and port zones are a draft. Hackathon entry, built with AI assistance.
```

### 3b. Reply in the Commercial Use Cases thread

```text
Mission 08 Commodities, Apps & Agents: Wharfinger. It buys vessel position, port queue and weather on Telegraph, refuses wrong and stale answers, and produces a statement the counterparty can recompute. A settlement gate then blocks, holds, escalates or releases a payment on that evidence. A released payment was sent on Solana devnet (test token, not USDC) and read back from the chain: https://explorer.solana.com/tx/3uAkgU3WL2E1XrXA9JZ5ckaJhKaciMCxKu8ubRjv68iZcRTMp141VcDcAWqMVM2fcAGKQHrCjpNFDA2T6SfQ15M5?cluster=devnet

Closest fit: Solana use case 4, Verified Global Trade and Autonomous Commerce. Pay.sh is not integrated yet; happy to work with anyone who builds that adapter.

Repo: https://github.com/0xkinno/wharfinger | Live: https://wharfinger-kinnoskis-projects.vercel.app
```

## 4. GitHub: the Mission 08 issue

Where: https://github.com/telegraphprotocol/bounties/issues/196 (sign in to GitHub as 0xkinno).

Steps, in order:
1. Scroll to the box at the bottom of the page, paste the scope text below, press **Comment**.
2. Write a second comment that contains only the word `/claim` and press **Comment**. The bot reads the first word of a comment as a command, so it must be alone.
3. Within 72 hours, and then at least every 72 hours, comment `/progress` followed by one or two lines of what changed (for example `/progress production voyage still running, port queue miner now covers 11 ports`). A claim with no progress update is released automatically.
4. When you are ready to hand in, comment `/submit` followed by the links.

Scope text:

```text
Scope: Wharfinger, a demurrage evidence and settlement app for post-fixture analysts at commodity trading desks. The problem it removes: laytime disputes argued from a handwritten Statement of Facts.
Track(s): Apps & Agents, Miners / Providers, Evaluators
Working on: watches a ship in port and buys VESSEL_TELEMETRY_VERIFY_GENERAL, LIVE_PORT_CONGESTION_GENERAL, WEATHER_FORECAST_VERIFY_GENERAL and SANCTIONS_SCREENING_MATCH_GENERAL answers. Code classifies each hour of the stay, the analyst signs, the owner recomputes in a browser, and a settlement gate holds or releases a payment on that evidence. Provider: Wharfinger Port Queue (miner 7310101), which answers Kotka correctly. Evaluator: labelled preference pairs for vessel telemetry and port congestion.
Reusing: public Digitraffic AIS and port calls, the Telegraph escrow rail.
Approach: every paid answer keeps its receipt and signal hash; wrong place, stale, wrong vessel and empty answers are refused and re-bought; operators that relay one feed are labelled as one upstream.
Failure cases shown: stale AIS reading, wrong place (a miner 3,710 km off), Kotka answered as Hanko, no reading.
Current state: built and tested on testnet. A production voyage is running. A released payment was sent on Solana devnet (test token, not USDC) and read back from the chain.
Proof: https://wharfinger-kinnoskis-projects.vercel.app (try /judge and /settle), https://github.com/0xkinno/wharfinger
```

## 5. Independent developer evidence

| Date | Who (with permission) | What they did | Link |
|---|---|---|---|
| none yet | | | |

`TUTORIAL.md` and `examples/buy-a-fact.ts` (9 lines) are in the repository. Another developer reproducing them is the evidence that counts here.
