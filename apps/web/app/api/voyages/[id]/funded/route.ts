import { q } from "@/lib/db";
import { getVoyage, ledgerOf } from "@/lib/voyages";
import { voyageAccount, houseAccount } from "@/lib/clients";
import { createPublicClient, createWalletClient, http, parseAbi, parseEther } from "viem";
import { sepolia } from "viem/chains";
export const dynamic = "force-dynamic"; export const maxDuration = 90;
const D = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const;
// The server confirms the deposit from the node's ledger (never from the browser's word), tops up gas, then sets the
// per-block charge limit from the voyage key. The watcher starts only after the ledger shows the full cap.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const v = await getVoyage(id); if (!v) return Response.json({ error: "no such voyage" }, { status: 404 });
  const led = await ledgerOf(v.voyage_address); const dep = BigInt(led?.deposited ?? 0); const cap = BigInt(v.cap_uusdc);
  if (dep < cap) return Response.json({ funded: false, depositedUusdc: dep.toString(), capUusdc: cap.toString(), message: "the node ledger does not show the deposit yet" }, { status: 202 });
  const steps: any = { limit: null };
  try {
    const pub = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com") });
    const vk = voyageAccount(v.voyage_index); const gas = await pub.getBalance({ address: vk.address });
    if (gas < parseEther("0.0005")) { const h = houseAccount(); const hash = await createWalletClient({ account: h, chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com") }).sendTransaction({ to: vk.address, value: parseEther("0.001") }); await pub.waitForTransactionReceipt({ hash }); steps.gasTx = hash; }
    const per = (cap / 10n) < 20_000n ? 20_000n : cap / 10n;
    const tx = await createWalletClient({ account: vk, chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com") }).writeContract({ address: D, abi: parseAbi(["function setMyChargeLimit(uint256)"]), functionName: "setMyChargeLimit", args: [per] });
    await pub.waitForTransactionReceipt({ hash: tx }); steps.limit = { tx, perBlockUusdc: per.toString() };
  } catch (e: any) { steps.limitError = String(e.shortMessage ?? e.message).slice(0, 160); }
  await q("update voyages set status='WATCHING' where id=$1 and status='AWAITING_FUNDS'", [id]);
  return Response.json({ funded: true, depositedUusdc: dep.toString(), ...steps });
}
