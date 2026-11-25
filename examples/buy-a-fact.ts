// Buy a timestamped fact on Telegraph from your own wallet. Run: PRIVATE_KEY=0x... pnpm exec tsx examples/buy-a-fact.ts
import { privateKeyToAccount } from "viem/accounts";
import { escrowClient } from "../packages/telegraph/src/index.ts";

const client = escrowClient(privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`));
const p = await client.ask({ intent: "FX_NOW_EUR", params: { currency: "EUR" } });
if (!p.ok) throw new Error(p.refusal ?? `HTTP ${p.status}`); // the node's own words, e.g. insufficient escrow for delivery
const signal = (await client.signal(p.body.signal_hash)).json;
console.log({ answer: p.body.result, receipt: p.receipt?.receipt_hash, epoch: p.receipt?.epoch_id, paidBy: signal.signal.wallet_address, boughtAt: signal.signal.created_at });
