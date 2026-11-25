# Buy a timestamped fact on Telegraph from your wallet in 20 lines

Telegraph sells an answer only while it is current. The paid authorization lives at most two minutes and its nonce
works once, so a paid answer is a fact with a time on it. This tutorial buys one and reads back the proof. It costs
$0.01 of testnet USDC.

## What you need

- Node 22 and pnpm.
- A wallet key with a little Sepolia ETH (gas for one deposit) and test USDC. The test USDC contract lets anyone mint:
  `mint(address,uint256)` on `0xcc194e1a843B658526D0D5C431f670028582Ae17` (6 decimals).
- Some USDC in your Telegraph escrow: `approve(Diamond, n)` then `depositUSDC(n)` on the Diamond
  `0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b`. Details: https://anjoman.ai/docs/using/escrow-inference

## The code (`examples/buy-a-fact.ts`, 9 lines)

```ts
import { privateKeyToAccount } from "viem/accounts";
import { escrowClient } from "../packages/telegraph/src/index.ts";

const client = escrowClient(privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`));
const p = await client.ask({ intent: "FX_NOW_EUR", params: { currency: "EUR" } });
if (!p.ok) throw new Error(p.refusal ?? `HTTP ${p.status}`);
const signal = (await client.signal(p.body.signal_hash)).json;
console.log({ answer: p.body.result, receipt: p.receipt?.receipt_hash, epoch: p.receipt?.epoch_id, paidBy: signal.signal.wallet_address, boughtAt: signal.signal.created_at });
```

Run it:

```bash
pnpm install
PRIVATE_KEY=0x... pnpm exec tsx examples/buy-a-fact.ts
```

Output from a real run on 2026-11-25:

```text
{ answer: { rate: 0.9121590805436468 }, receipt: '0x8cc37dcc...97de3', epoch: 53,
  paidBy: '0x2d62433a1c398cae11ae98dbd5ccce3645a95540', boughtAt: '2026-11-25T07:01:48.146269Z' }
```

## What happened

1. The first request had no payment and returned 402 with an `escrow` entry whose `extra.message` is a template.
2. The client filled `{from}` (lowercase), a fresh nonce and a window under two minutes, signed it with `personal_sign`,
   and sent it base64 in `X-PAYMENT`. It refuses to sign a quote above a cap you can set.
3. The node returned the answer, a `signal_hash`, and the receipt in `X-PAYMENT-RESPONSE`.
4. The signal page names your wallet and the time the answer was recorded.

## Check the signal yourself

The signal hash commits to the request and the response. `recomputeSignalHash` in
`packages/telegraph/src/index.ts` re-derives it offline: keccak256 of the payload as compact JSON, keys sorted, wallet
lower-cased, `<`, `>`, `&` escaped. Fetch `/engine/v1/signal/<hash>`, pass the JSON in, compare.

## When it fails

| You see | Meaning | Do |
|---|---|---|
| `insufficient escrow for delivery` | Signature fine, balance short | Deposit more |
| `charge limit reached for this block` | A cap you set with `setMyChargeLimit` | Wait for the next block or raise it. The node applies a new limit a few minutes after the transaction |
| `authorization.nonce has already been used` | Replay | The client mints a fresh nonce every call |
| Browser `fetch` blocked | The node's CORS preflight allows only `Content-Type` | Make the paid call from a server |

## Costs and limits

$0.01 per answer at the demand multiplier 1.0. Testnet only. Requests are public: the Daemon feed shows the question and
the signal page shows your wallet. Do not ask private questions.
