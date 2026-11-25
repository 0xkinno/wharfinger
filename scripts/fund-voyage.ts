// Funds a voyage key the way the browser flow does: depositUSDCFor(voyage key, cap) from the funder wallet. For headless use.
// Usage: pnpm exec tsx scripts/fund-voyage.ts <voyageAddress> <capUusdc>   (funder: PROBE_HOUSE_PRIVATE_KEY or HOUSE_PRIVATE_KEY)
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const [addr, cap] = process.argv.slice(2); if (!/^0x[0-9a-fA-F]{40}$/.test(addr ?? "") || !cap) { console.error("usage: fund-voyage.ts <voyageAddress> <capUusdc>"); process.exit(2); }
const D = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const, U = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const acct = privateKeyToAccount((process.env.PROBE_HOUSE_PRIVATE_KEY || process.env.HOUSE_PRIVATE_KEY) as `0x${string}`);
const transport = http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
const pub = createPublicClient({ chain: sepolia, transport }); const w = createWalletClient({ account: acct, chain: sepolia, transport });
const abi = parseAbi(["function approve(address,uint256) returns (bool)", "function depositUSDCFor(address,uint256)", "function mint(address,uint256)", "function balanceOf(address) view returns (uint256)"]);
const amt = BigInt(cap); const bal = await pub.readContract({ address: U, abi, functionName: "balanceOf", args: [acct.address] });
if (bal < amt) await pub.waitForTransactionReceipt({ hash: await w.writeContract({ address: U, abi, functionName: "mint", args: [acct.address, amt - bal] }) });
await pub.waitForTransactionReceipt({ hash: await w.writeContract({ address: U, abi, functionName: "approve", args: [D, amt] }) });
const h = await w.writeContract({ address: D, abi, functionName: "depositUSDCFor", args: [addr as `0x${string}`, amt] }); await pub.waitForTransactionReceipt({ hash: h });
console.log("deposited", cap, "uUSDC for", addr, "tx", h);
