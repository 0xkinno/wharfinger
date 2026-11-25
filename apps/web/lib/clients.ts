import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import { escrowClient } from "../../../packages/telegraph/src/index.ts";
export const NODE = process.env.TELEGRAPH_NODE ?? "https://devnode.telegraphprotocol.com";
export function voyageAccount(index: number) {
  if (!process.env.WATCH_MASTER_MNEMONIC) throw new Error("WATCH_MASTER_MNEMONIC is not set");
  return mnemonicToAccount(process.env.WATCH_MASTER_MNEMONIC, { addressIndex: index });
}
export const voyageClient = (index: number, capUusdc = 50_000n) => escrowClient(voyageAccount(index), { node: NODE, capUusdc });
export function houseAccount() { const k = process.env.HOUSE_PRIVATE_KEY; if (!k) throw new Error("HOUSE_PRIVATE_KEY is not set"); return privateKeyToAccount(k as `0x${string}`); }
export const houseClient = () => escrowClient(houseAccount(), { node: NODE });
