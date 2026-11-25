# RULES_EXTRACT

Verbatim extracts of the live Season II pages and the bounties repository, retrieved 2026-11-25T06:17Z. Nothing below is
paraphrased. Page chrome (navigation, widgets) is removed; the text between the headings is as served. Raw HTML and
text captures are kept in `reference/docs/raw/` (gitignored) with the hashes listed at the end.

This file quotes third-party text, including its punctuation, so it is excluded from the house-style check.

## Open item: Mission 08 issue (bounties issue 196)

The issue body could not be retrieved in this session. GitHub reads other than git clone are not available to the
build agent, and the repository attach that would allow API reads was declined. The title and link come from the
bounties README table: `08 | Commodities | Build and power Commodities | https://github.com/telegraphprotocol/bounties/issues/196`.
Kinnoski to paste the issue body into `reference/issue-196.md` (or approve the attach) so this file can quote it.
Until then, the mission text below is taken from the live missions page and from `docs/MISSIONS.md` in the repository.

---

## 1. Official Competition Rules (https://hackathon.telegraphprotocol.com/rules)

# Official Competition Rules.
Season II is about building something people can use. Apps need intelligence. Providers supply it. Evaluators test its quality. Together, they turn working ideas into products and make Telegraph more useful for the next builder.
November 1 – December 1, 2026
Main competition deadline: December 1, 2026, at 23:59 UTC
$10,000 in prizes for H2: $7,000 for the main competition and $3,000 reserved for separate challenges announced in December. Those later challenges have their own rules and deadlines. They do not extend Season II.
$10,000in prizes
3competition tracks
15commercial missions
70/100minimum score to win
Register for Season II →Join the Discord ↗

On this page
- 01Choose your track
- 02The 15 missions
- 03Dates and milestones
- 04Prizes
- 05What your entry must do
- 06How judging works
- 07How delivery awards are chosen
- 08What to submit
- 09How we verify results
- 10Fair play and participant rights
- 11Keep building after H2

Section 01

## Choose your track#
Track 01Apps & AgentsA working app or agent that buys intelligence through Telegraph to complete a useful task.SelectedTrack 02Miners / ProvidersA working intelligence service that answers requests for a supported task (an Intent) and can be tested for quality.SelectTrack 03EvaluatorsAn evaluation adapter, evaluation material, or both, that helps measure intelligence quality for an Intent.Select
You can enter alone or as a team. You can work with other tracks or submit to more than one track, as long as each entry is a real, distinct contribution. Several teams can build for the same mission or Intent. Nobody gets exclusive rights to a mission by choosing it first.
Can you start before November 1? Yes. You can prepare, reuse your own code, and adapt open-source projects that allow it. Follow their licenses and disclose major reused components. Judges will look at what actually works, what you contributed, and your Telegraph integration, not whether you wrote every line from scratch. H2-specific activity and transaction evidence must come from the event period.
Register on the official H2 website, choose a track and mission or Intent, and use the linked documentation, Explorer, Discord, and GitHub opportunities to get started. Final entries go through the H2 website.

Section 02

## The 15 missions#
These are the commercial problems we want Apps & Agents builders to tackle. Each mission gives you a direction, not a fixed app design. You can build a different workflow if it genuinely solves the same problem.
Search missions01Exchange02Stablecoin03Institutional Markets04Legal05Conflict Intelligence06Resources & Agriculture07Consumer Platform08Commodities09Personal Agent10Model Economy11Autonomous Systems12Mining & Power13Asset Management14Web3 Native & DeFi15Consumer Automation
Mission 01 / 15
### Exchange
What a working project could do
Check a token listing, counterparty, or market-integrity question, with evidence from intelligence bought through Telegraph.
Mission page →←→

### Mission acceptance
When does a mission count as completed? A reviewer must be able to:
- 01Run itRun your app with a new, realistic input.
- 02Check itCheck the useful result.
- 03Inspect itInspect the real Telegraph request and its available transaction or accounting evidence.
- 04Break itTest a reasonable failure case.
- 05Reproduce itFollow your instructions to reproduce it.

An app can complete several missions, but each one needs its own meaningful, testable result. Merely attaching several mission labels to the same trivial action does not count.
We will report both missions completed and distinct working apps. A single app completing three missions is still one app.

Section 03

## Dates and milestones#
All times are UTC.
- 01Nov 1
### Season II opens
Season II opens for all three tracks and all 15 missions.

- 02Nov 14
### First Integration Milestone (Apps & Agents)
Show your first working Telegraph intelligence request or purchase, an attempt, or what is blocking you. This is a progress check, not a submission deadline or a disqualification rule.

- 03Nov 20
### Community showcase
Working progress, uncovered missions, and opportunities where builders need help.

- 04Final week of H2
### Anjoman hands-on community session
Try features that are actually available. We will announce the session details through official channels.

- 05Dec 1, 23:59 UTC
### Season II closes
Final deadline for all three tracks and all main-competition mission submissions.

- 06Dec 2 – 8 (planned)
### Main-entry verification and judging
Dates may shift if a documented platform issue prevents fair testing.

- 07From Dec 9 (planned)
### Provisional results
Provisional results and individual notices. Each participant has 72 hours after their notice to appeal a factual mistake. Final results follow the appeal review.

- 08After Dec 1
### Separate December challenges
New, separate challenges may open using the reserved $3,000. Their tasks, dates, submission requirements, and judging rules will be announced before they open.

The November 14 milestone is a way to find and fix integration problems early. You do not need a finished app that day. A final Apps & Agents submission still needs a working purchase through Telegraph.
The December follow-on challenges are not extra time to submit to Season II. A previous H2 project can enter a later challenge if it meets that challenge's published rules and achieves something new. We won't pay twice for the same result.

Section 04

## Prizes: $10,000 total#
$7,000 for the main competition and $3,000 reserved for separate December challenges. Hover or focus any slice to see where the money goes.
$10,000 total prize pool
$1,800$1,200$1,200$800$1,200$800$2,000$1,000
Apps & Agents$3,000
verified delivery8 awards of $225$1,800excellence1st $700 · 2nd $350 · 3rd $150$1,200
Miners / Providers$2,000
verified delivery4 awards of $300$1,200excellence1st $500 · 2nd $300$800
Evaluators$2,000
verified delivery4 awards of $300$1,200excellence1st $500 · 2nd $300$800
December$3,000
new mission results and useful technical work4 awards of $500$2,000real adoption and ecosystem activity2 awards of $500$1,000

### How awards work
Main Season II competition: $7,000. Separate December challenges: $3,000 reserved. Total announced prize allocation: $10,000.
Verified delivery rewards completed, independently checked work, with priority given to covering more missions and removing real blockers. Excellence rewards the strongest technical entries in each track. The detailed selection rules are in Section 7.
A team can win one delivery award and one excellence award in the same track if it qualifies for both. Every award needs an eligible entry; registration or a passing score alone does not guarantee a prize.
We'll publish the specific December challenges, who can enter, what evidence is needed, how entries will be selected, and their deadlines before each challenge opens. The general priorities are explained in Section 7. Entering the main hackathon does not automatically enter you in a later challenge.
Prizes are quoted in USD. Eligible countries, identity and tax checks, supported payout methods (including any wallet option), and payout timing are governed by the official prize-payment terms. Those terms must be available before the competition opens. Registration by itself does not confirm cash-prize eligibility or a particular payment method. GitHub bounties and normal network earnings are separate from these prizes.

Section 05

## What your entry must do#
Every entry must be real, working, and independently testable. Judges need enough access and evidence to see it work, not just a pitch or a demo video.

### Every track must show
- 01
#### Something working
An app, a callable Provider service, or a valid Evaluator contribution.

- 02
#### A real Telegraph integration
Use the supported interfaces and show genuine evidence for any claims about registration, requests, rankings, payment, accounting, or rewards.

- 03
#### Repeatable results
Clear instructions that let reviewers try new inputs and reasonable error cases.

- 04
#### Safe handling
Appropriate permissions, spending limits, error handling, and protection of private data, keys, and confidential evaluation material.

- 05
#### Accurate claims
Say which network you used and what was actually verified. Testnet, production, internal testing, and real customer demand are different things.

- 06
#### Star the bounties repo
Star the Telegraph bounties repository on GitHub (github.com/telegraphprotocol/bounties). This is required for every track and is part of your entry.

### Track requirements
Apps & AgentsMiners / ProvidersEvaluators
Apps & AgentsYour app must make at least one genuinely autonomous machine-to-machine purchase or sale using the supported Telegraph flow, then use the intelligence to perform a meaningful task. A supported testnet implementation can qualify. Judges will also consider how close the app is to real-world use, given the features the network currently supports.

Section 06

## How judging works#
Only entries that meet Section 5 are scored. Every track is scored out of 100. To win, an entry needs at least 70/100 and must pass its track's technical minimum.
Apps & AgentsMiners / ProvidersEvaluators
- 35Technical quality and mainnet readinessMinimum 24/35
- 25Commercial viability
- 10Genuine independent adoption and retention
- 5Telegraph network integration and usage quality
- 5Reproducibility, demo/tutorial, and verifiable proof
- 20Organic growth, education, and developer activation

Minimum: 24/35 for technical quality, plus a working Telegraph purchase.
Commercial viability means there's a clear user or buyer, a genuine problem, a useful result, sensible costs, and a believable path to adoption. The short commercial summary in Section 8 helps judges assess this.
Adoption includes verified third-party use, retention, integrations, or independently funded customer activity. New apps are welcome; they are scored on the evidence they actually have. Testnet use is not presented as paying production usage.
Novelty can break a close tie for excellence awards after quality and repeatability are compared.

### Organic growth, education, and developer activation: 20 points
Your work should help someone discover Telegraph, understand what it does, try it, and take the next step. These points reward useful, original content and real developer actions. A large audience is not required. Posting alone does not earn all 20 points.
CriterionPointsWhat judges look for
Content and education5A clear public explanation or demonstration of the work (2); a useful technical tutorial, walkthrough, or breakdown that explains Telegraph's role (2); honest results, limitations, or lessons learned (1).
Ease of adoption5Steps another developer can follow, including prerequisites and an example (2); a working demo, sample, repository, endpoint, or safe equivalent that another developer can actually test or reproduce (2); clear troubleshooting, costs, and next steps (1).
Organic distribution5At least three meaningful original updates on separate dates covering progress and results (2); sharing relevant technical work with developers beyond the participant's own immediate team/Discord thread (2); genuine technical discussion, answers, or follow-up to feedback (1).
Community growth and activation5A specific invitation with a useful next step to try Telegraph, inspect its docs/GitHub/bounties, or contribute (1); evidence that an independent developer acted on the work, such as reproducing a Telegraph request, testing an integration, or submitting useful technical feedback (2); a further independently verified developer contribution, integration, or substantive repeat use attributable to the work (2).
Total20

A participant may use X, LinkedIn, GitHub, YouTube, articles, videos, technical forums, Discord, or other relevant developer channels. Tag @Telegraphprotoc on X where applicable and link to the relevant Telegraph documentation, repository, mission, Intent, or working integration. Posts made to promote contest entries should clearly disclose hackathon participation and the prize incentive where required by the platform or applicable law. Telegraph tags alone are not necessarily adequate disclosure.
Judges review the content, working examples, public links, and independent evidence supplied by the participant. A GitHub issue, accepted PR, reproduction report, verified request, or external integration is stronger evidence of activation than a signup or impression. A new visitor, star, watch, reaction, follower, repost, or Discord join alone is not proof of a successful integration or an independent contribution. Stars and watches are welcome, never mandatory, and never directly rewarded with points.
No bought or coordinated engagement, engagement exchanges, spam, fake accounts, false adoption claims, manufactured requests, self-dealing presented as external demand, or incentives to others merely to star, watch, like, follow, or repost. Honest criticism and documented failures are acceptable content. Do not expose protected evaluation questions, customer data, credentials, or other confidential material; use public-safe demonstrations and provide sensitive verification evidence privately to judges when needed.
The same technical standard applies to everyone. A participant can earn growth points for helping external developers use Telegraph, not just for promoting their own entry. Existing independent adoption/consumption criteria continue to score the actual product outcome; these 20 points score the quality of the participant's education, distribution, accessibility, and evidence of bringing others into the ecosystem. Judges must not invent extra requirements or award points by follower count alone.

Score yourselfDrag each slider to the score you expect. Illustrative only; official scores come from independent reviewers.

Max all
- Technical quality and mainnet readiness35/35
- Commercial viability25/25
- Genuine independent adoption and retention10/10
- Telegraph network integration and usage quality5/5
- Reproducibility, demo/tutorial, and verifiable proof5/5
- Organic growth, education, and developer activation20/20

100/100
Clears the 70/100 threshold and the technical minimum.

### Excellence winners
Eligible entries are ranked by total score. Ties go first to the track's main technical score, then to independently repeatable proof. Apps may then be compared on meaningful novelty. An exact remaining tie is decided by a recorded fair draw.

Section 07

## How delivery awards are chosen#
Open any award to see the exact order of selection.
Apps & Agents: 8 awardsJudges select the eight qualifying independent entrant groups together, choosing the set that achieves the following, in order:
- Covers the most distinct completed missions.
- Includes the most distinct accepted working apps.
- Covers the most missions served by only one qualifying entrant group.
- Enables the most verified shared mission-critical capabilities.
- Has the strongest combined app quality.
- Has the strongest technical correctness.

Apps & Agents: counting rules and tiesA mission and a distinct app count once each across the winners. A distinct app must do its own useful end-to-end job and pass independent review. One app can cover several missions but still counts as one app. For an entrant with several accepted apps, its best qualifying app sets its app-quality tie-break score. Each entrant group can win at most one Apps delivery award. An exact remaining tie is settled by a witnessed fair draw.

Miners / Providers and Evaluators: 4 awards per trackFor each track, judges choose the set of four qualifying independent groups that, in order:
- Enables the most distinct commercial missions.
- Enables, unblocks, or improves the most distinct H2 app workflows.
- Meets the most independently verified missing mission-critical Intent needs.
- Has the strongest combined technical quality.

Miners / Providers and Evaluators: ties and proofFor Providers, remaining ties go to verified H2 mission-app consumption, then the Provider quality score. For Evaluators, ties go to proven measurement improvement or valuable new coverage, then the validity score. Exact remaining ties are decided by a witnessed fair draw.
Mission impact needs real proof: a reviewer rerunning an app, an accepted integration test, or a repeatable mission-specific test. Each distinct enabled mission or app workflow counts once across the winners. A Provider or Evaluator can qualify by proving a new mission-critical capability with a suitable test even while apps that will use it are being built. Each claimed Intent must pass its own relevant tests.
Each independent group can win at most one delivery award per track. Related wallets, jointly controlled teams, and materially identical submissions count as one group.

How the later December awards will workThese awards belong to separately announced challenges, not the main Season II judging window.
Four $500 awards: additional missions and technical results. Challenges can reward newly completed missions, distinct working apps (including a new app for an already completed mission), verified fixes for mission-critical blockers, or reusable Provider, Evaluator, and integration work that helps applications run. Challenges will publish their own acceptance tests and deadlines. Selection favors additional completed missions, additional distinct apps, verified impact on blocked workflows, and technical quality. Each accepted result counts once across winners; exact ties are settled by witnessed fair draw.
Two $500 awards: adoption and ecosystem use. Challenges can reward verified third-party onboarding, reproduced integrations, active users, retention, and genuine externally funded customer use. Selection favors completed actions, repeat use, and proof of who caused the result. Each challenge announcement will specify its evidence window and cutoff.
Earlier H2 work may be a starting point, but the new challenge needs its own qualifying submission and a distinct verified result. The same result cannot win a second payment. Each related group can win at most one award in each of the two December categories. Reserved prizes are not automatically paid if qualifying work isn't submitted.

Section 08

## What to submit by December 1#
Submit through the official H2 website by December 1, 2026, at 23:59 UTC. The same deadline applies to all three main tracks. Include:
- 01
### Project details
Your team/contact, track, project name, chosen missions or Intents, a working or reviewer-access link, and the GitHub username that starred the bounties repository.

- 02
### Short demo
A 2–5 minute video or accessible equivalent showing the real input, result, and Telegraph integration. A screen recording is fine.

- 03
### How to run it
Short, beginner-friendly steps, prerequisites, configuration, sample request, expected result, actual network, spending limits or costs, and known limitations. Judges should be able to reproduce it.

- 04
### Evidence
Real receipts, requests, accounting records, service endpoints, evaluation methods, tests, and rankings where applicable. Sensitive material may be shared privately with judges.

- 05
### Short public summary
Explain what you've built, which mission or Intent it serves, what works, and how others can try it or contribute.
Include links to your original H2 updates, technical demos or tutorials, any usable integration example, and evidence of independent developer testing or adoption that you want counted under Section 6's 20 growth points. The links can go in the existing public summary or evidence field; no new submission form or website feature is required. Protect sensitive information and provide confidential proof privately to judges.
For confidential projects or protected evaluation material, share a public-safe summary without exposing sensitive information.

- 06
### Showcase permission
Tell us which text, images, recordings, tutorials, or Anjoman experiences may be shared publicly, and whether you agree to possible buyer introductions. These choices do not affect technical scores.

### Evidence for your track
Apps & AgentsMiners / ProvidersEvaluators
Apps & AgentsApps should identify each working app, its missions/Intents, purchased intelligence, and outcome.

### Apps & Agents: short commercial summary
Apps & Agents: answer five short questions in the same form.
01Who is it for?Who is the user or buyer, and how often do they have this problem?

02What does it improve?What does the app improve over today's options, including any known cost, speed, or quality differences?

03What does it do today?What works today, with proof of Telegraph use, spending, and latency where available?

04Why would someone adopt it?Why would someone use or pay for it, and what remains before production?

05How can someone try it?How can someone try it, and who maintains it?

A useful flow for the demo
- Problem
- Telegraph request
- Intelligence and Provider evidence
- Observed cost
- Completed result
- How to try it

Keep the answers short. A useful demo follows the actual problem, Telegraph request, returned intelligence and Provider evidence, observed cost, completed result, and how to try it. Label estimates, testnet results, and unconfirmed customer interest honestly. These answers help judges apply the existing commercial and technical scores; they don't add a new scoring category.

### Share your progress. Help the next developer build.
20 of the 100 judging points now cover original technical content, ease of adoption, organic distribution, and verified developer activation. See the scoring rubric in Section 6.
Show what you're building while you build it. Aim for at least three useful public updates on separate dates during the competition: introduce the problem, show meaningful progress, and demonstrate a working result. Keep sharing when you reach a real milestone or discover something other developers can use.
The best updates explain what the project does, where Telegraph fits, how someone can try it, what happened, and what still needs work. A screen recording, short walkthrough, technical thread, article, working example, GitHub contribution, or tutorial is fine. Make each update useful to a developer who has never heard of Telegraph.
Share with relevant developers on X, LinkedIn, YouTube, GitHub, blogs, and technical communities. Tag @Telegraphprotoc on X; link to your contribution and the appropriate Telegraph docs, GitHub repository, Intent, bounty, or Discord starting point. Respond to genuine questions and invite other builders to test your work, reproduce an integration, contribute an improvement, or build on an Intent.
A post is a starting point. Higher scores come from making your work understandable and usable, then showing that independent developers actually tried, tested, improved, or integrated with Telegraph. Include truthful evidence. Explain network status, costs, and limitations clearly. If a result is confidential, show a safe summary and provide protected details to judges.
Telegraph may feature verified work through its official accounts, Discord, hackathon channels, GitHub, Explorer, and Anjoman, with credit and a useful next action. Public sharing of participant assets remains subject to the permissions in Section 10.
Final-week Anjoman sessionWe'll invite participants to try supported Anjoman features and show what they actually did: for example, exploring an Intent, looking at rankings, finding contribution opportunities, connecting a service, or inspecting an intelligence request. Show whether the activity happened on testnet or production. We'll announce the confirmed session time and instructions. You can share a safe screenshot or clip tagging Telegraph, or provide material for organizer posting with your consent.
These activities support real community participation and discovery. Section 6 now allocates 20 of 100 judging points to organic growth, education, ease of adoption, and verified developer activation. Technical minimums, delivery/excellence award rules, and the $10,000 prize allocation remain unchanged. A public post is not a technical-eligibility requirement; unsupported growth claims do not earn growth points. Likes and follower counts alone earn no points. Confidential material must remain protected.

Section 09

## How we verify results#
Judges use your instructions to test realistic new inputs, relevant failures, and actual network evidence. We may describe a result as:
- Mission VerifiedTestnet / supported networkAn independent reviewer reproduced the qualifying app workflow on the stated network and checked its Telegraph evidence.

- Production VerifiedThe working production deployment was independently tested using features actually supported in production.

- Commercially ValidatedThere is proof of genuine, independently funded third-party customer activity. Repeat usage is reported separately when verified.

- Competitive Supply VerifiedAt least two meaningfully independent Providers meet the relevant quality and eligibility requirements.

### What reviewers connect
When the evidence exists, reviewers connect three things for each Intent:
Quality measuredEvaluator and material version, tests, and any finalized ranking.

What each mission app consumedApp and operator, fulfilled requests, Miner–Intent pair, outputs, and receipts/accounting.

What happened commerciallyCompeting supply, ranked routing, payments or earnings, and any genuine repeat demand.

Ranking evaluations and live customer requests are not the same activity. The evaluation process establishes rankings; ordinary customer requests consume intelligence using those rankings. How much demand a Provider receives also depends on eligibility, quality, price, availability, and the routing policy.
We won't count the same request or payment twice for the same claimed result. We'll distinguish protocol-paid tests, internal demos, testnet traffic, and independently funded customer activity. For batched accounting, provide the records supported by the network. Performance claims need an Intent, test conditions, and a real evaluation source. Sensitive evaluation or customer material can be reviewed privately.

Section 10

## Fair play and participant rights#
- 01
### Independent judging
Reviewers keep a record of evidence and decisions. Anyone with a direct financial or team conflict must step aside. We record mission completion, distinct app acceptance, and cash awards separately.

- 02
### Network problems
If a verified Telegraph platform issue disrupts participants, we'll report it and extend affected milestones by the documented impact for similarly affected participants. If a necessary test cannot be run fairly, we'll delay the affected award decision until comparable testing is possible, and announce schedule changes.

- 03
### One team, one identity
Disclose related teams or wallets when asked. Fake receipts, manufactured adoption, collusive requests, copied work presented as independent, or disclosure of protected material can lead to disqualification after review and a chance to respond.

- 04
### Appeals
You have 72 hours after your individual provisional-result notice to raise a factual, eligibility, or scoring-calculation error. An independent reviewer handles eligible appeals before the affected prize is paid.

- 05
### Your work stays yours
You keep ownership of your original work, subject to any third-party licenses. We need permission to review your submission privately. Public features of your project, reusing your images or videos, and sharing contact details for buyer introductions need your relevant consent. Private keys, customer data, and protected tests stay confidential.

- 06
### Getting paid
Winners must meet the published country eligibility, identity, tax, and payout requirements. Payments happen after results and appeals are finalized and the required checks are complete, according to the published payout schedule.

Section 11

## Keep building after H2#
The hackathon ends on December 1. Telegraph's missions, Intents, Explorer, Discord, and GitHub contribution opportunities can continue afterward. We may open separate December challenges with their own deadlines, and funded GitHub issues have their own terms. You can keep improving your app, compete on an Intent, or help another team ship.
Register for Season II →Discord ↗Docs ↗
- Build something useful.
- Prove it works.
- Show the next person how to use it.

---

## 2. Missions page (https://hackathon.telegraphprotocol.com/missions)

# Fifteen commercial missions.
Season II starts from real applications and works backwards into the intelligence and evaluation required to make them work. The missions give direction to the Apps & Agents track. Each one is a real industry with a problem solved slowly, expensively, or not at all. Pick one to see the problem, the finished product we want, example builds, and the shared Intents behind them.
15 missions define the demand → Intents define the intelligence needed → Providers supply it → Evaluators measure it → Apps prove whether the whole thing actually works.

Search missionsAll builds[ Full ][ Mechanism ]Any intelligence

- 01ExchangeGlobal spot and derivatives venuesAn autonomous listings desk that buys contract audit, contributor authenticity, holder concentration and sanctions exposure in parallel, and returns a signed listing risk memo with a cost line at the bottom.3 example builds
- 02StablecoinStablecoin issuers and on-chain creditAn agent fleet with a real expense ledger, compliance screening attached to the payment itself as a proof, and a machine that opens a vault, borrows, spends on intelligence, earns as a miner and repays.9 example builds, 3 buyers
- 03Institutional MarketsPrivacy-first issuance and liquidity venuesA defensible mark on a private asset, an autonomous issuance desk that prices every input, and pre-trade diligence between two agents where neither sees the other book.3 example builds
- 04LegalInternational law firms, Hong Kong and APACRegulatory monitoring with a chain of custody, an overnight five-jurisdiction diligence pack with per-item cost, and two agents negotiating a services agreement on paid evidence.3 example builds
- 05Conflict IntelligenceSystematic macro and commodities fundsAn escalation score that traces to a specific input at a specific price, media forensics bought before a position is sized, and one verified answer mapped across rates, FX and energy at once.9 example builds, 3 buyers
- 06Resources and AgricultureMines, cattle stations, grain growersA days-to-impact figure per site keyed to geolocation, a destocking clock measured in weeks of carrying capacity, and a yield forecast published against the official estimate.9 example builds, 3 buyers
- 07Consumer PlatformSocial, camera and messaging platformsA model that pays for what it does not know, a camera lens that buys a verdict on whether what it sees is real, and marketplace agents that verify each other before money moves.9 example builds, 3 buyers
- 08CommoditiesPhysical commodity trading housesP&L per unit of intelligence purchased, cargo and counterparty provenance with a receipt on every check, and live price discovery where agents bid for one scarce answer.3 example builds
- 09Personal AgentOpenClaw, Hermes Agent, Kimi ClawA wallet and a market wired into the heartbeat loop, an assistant that publishes one of its own capabilities as a miner, and two assistants settling a task swap in a group chat.9 example builds, 3 buyers
- 10Model EconomyHugging Face, GitHub, OpenRouterA leaderboard denominated in cost per verified correct answer, supply chain verification priced per commit, and a coding agent that buys the answer instead of hallucinating it.9 example builds, 3 buyers
- 11Autonomous SystemsRobotics fleets and frontier hardwareOne intelligence budget allocated across heterogeneous machines, a robot that checks what it sees before it acts, and a skill bought mid-task for cents.9 example builds, 3 buyers
- 12Mining and PowerBitcoin miners and AI compute operatorsAn allocation agent for every megawatt every hour, SLA verification neither landlord nor tenant has to trust, and a curtailment decision that carries a receipt.9 example builds, 3 buyers
- 13Asset ManagementThematic issuers and index providersOpen research with every input priced and provable, index rebalancing with receipts on liquidity and float, and a daily holdings proof an investor agent can verify without the issuer.12 example builds, 4 buyers
- 14Web3 Native and DeFiOnchain traders, conditional contracts, whitehat securityA sniper that buys bytecode and drainer analysis before committing capital, two agents settling a conditional escrow that resolves itself, and a bug bounty paid to the machine that proved the bug.3 example builds
- 15Consumer AutomationRetail consumers, travel and e-commerceAn agent that buys a verified disruption report and files the refund claim with the receipt attached, and a browser agent that waits for cryptographic proof of stock before it checks out.3 example builds

---

## 3. Mission 08, core starting intents (bounties repository, `docs/MISSIONS.md`)

## 08. Commodities

Core starting Intents:

- `SHIP_RATE_ETA`
- `LIVE_PORT_CONGESTION`
- `VESSEL_TELEMETRY_VERIFY`
- `WEATHER_FORECAST_VERIFY`
- `SANCTIONS_SCREENING_MATCH`
- `DOCUMENT_AUTHENTICITY`
- `FX_NOW`
- `MACRO_ECONOMIC_INDICATOR`
- `WEB_SEARCH_QUERY` — the network serves no Intent under this name yet

> This map is a coordination baseline, not a hard whitelist. App builders may compose any relevant Telegraph Intents.

---

## 4. How Season II works (bounties repository, `docs/H2.md`)

# How Season II works

Season II starts from the **end state**: real applications must work.

The 15 commercial missions define the demand side. Apps and Agents choose a mission and compose the reusable Telegraph Intents they need. Miners and Evaluators remain Intent-based and industry-agnostic.

## Who does what

- **Apps think in missions.**
- **Miners think in Intents.**
- **Evaluators think in Intents.**
- **The bounty queue connects them by exposing blockers.**

A mission-specific output should become a new Intent only when it is genuinely a reusable intelligence primitive.

For example, an Agriculture app may compute a `destocking clock` from weather, satellite, telemetry and logistics intelligence. The `destocking clock` is application logic; the reusable intelligence inputs are the Intents.

## How gaps turn into work

```text
App declares / discovers required Intents
            ↓
Live use exposes weak supply, evaluation or integration
            ↓
Gap becomes / raises a bounty
            ↓
Miners / Evaluators / contributors attack the gap
            ↓
App retests
            ↓
Mission reaches working state
```

The objective is **not** to maximize issue count, Miner count or Evaluator count.

The objective is to minimize the number of real applications still blocked.

## When an Intent is ready

A mission-critical Intent is not ready because somebody created a repository.

Readiness depends on the actual demand and may include:

- live independent Miner supply;
- usable evaluation;
- ranking available;
- paid Telegraph requests succeeding;
- app-facing normalization / adapter compatibility where the consuming App requires a common shape;
- latency/reliability within the application's tolerance;
- App integration working end-to-end;
- reference fixtures / smoke tests passing.

Telegraph does **not** impose one universal response schema on Provider-native outputs at the protocol layer. Anjoman, Apps or adapters may normalize outputs when a workflow needs a common shape.

Each bounty defines the exact closure criteria required for that gap.

## What counts as working

For H2 application work, the application—not a slide—is the proof. The expected pattern is:

**machine requests intelligence → Telegraph routes to ranked supply → the paid request/receipt is visible → the machine consumes the result → the workflow continues.**

Bounties exist to remove whatever prevents that flow from working.

## Relationship to ongoing supply

This repository is a permanent contribution surface. Season II issues carry `source:h2` (and, where relevant, a `mission:*` label); customer/mainnet work, release coverage and general gaps continue independently in the same GitHub queue. Don't turn every unrelated request into an H2 mission. Builders may use Anjoman to make optional, real end-to-end demonstrations, but no H2-specific Anjoman role or mandatory workflow is required. A mission ending doesn't close a still-valid, reusable technical gap; maintainers can reclassify approved ongoing work without duplicating the issue.

---

## 5. Timeline page (https://hackathon.telegraphprotocol.com/timeline)

# The thirty days.
1 November to 1 December 2026. A first integration milestone on 14 November catches problems early, so nothing is left to be faked in the last forty-eight hours.

- 01Before 1 Nov
### Register and explore
Register once for all three tracks, then explore the fifteen commercial missions and the shared Intent catalogue before building starts.

- 021 - 13 Nov
### Season II opens: pick your track and build
Season II opens for all three tracks and all fifteen missions. Teams form and choose a track: Miners and Evaluators pick the Intents they will serve or score, and App builders pick a commercial mission.

- 0314 Nov
### First Integration Milestone
Apps & Agents teams show their first working Telegraph intelligence request or purchase, an attempt, or what is blocking them. This is a progress check, not a submission deadline or a disqualification rule.

- 0415 - 23 Nov
### Build and integrate
Community showcase on 20 Nov: working progress, uncovered missions, and where builders need help. Miners tune against real requests coming off real builds.

- 0524 Nov - 1 Dec
### Final week and submission
Anjoman hands-on community session in the final week. Season II closes on 1 Dec at 23:59 UTC, the final deadline for all three tracks. $10,000 total prize pool; the split is in the Official Rules.

- 06After 1 Dec
### Judging and results
Verification and judging 2 - 8 Dec (planned), then provisional results from 9 Dec with a 72-hour appeal window. Separate December challenges use the reserved $3,000 and have their own rules and deadlines.

---

## Capture hashes (sha256 of the raw HTML as served)

| Page | sha256 |
|---|---|
| rules | da21c6d6d62cadbc1a1debf55f1afb135d798169ceb021533c81abc75020a67f |
| missions | 792a22f73dc57e96444aa3a1cbfddfb467de50c07bd1ded85c5b3702df9fa3aa |
| timeline | cbb454ce647d99446b524b0c77884ed5b5ac7b933ab508735493d087005591e4 |
| bounties `docs/MISSIONS.md` | 14fd63c6908104b41986b234eeb4e8f2c11d73a2923e8229dffe44c4dcb0c831 |
| bounties `docs/H2.md` | 6c76839656b847e25890cde7b7d72fd278795bc72f15f62785ccc1fd7c819a59 |
