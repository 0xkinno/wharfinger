import { recoverMessageAddress, sha256, toHex } from "viem";
/** Writes that change a voyage are signed by the funding wallet: message binds action, voyage, payload hash and a time. */
export const writeMessage = (action: string, id: string, payload: unknown, ts: number) =>
  `Wharfinger ${action}\nvoyage: ${id}\npayload_sha256: ${sha256(toHex(new TextEncoder().encode(JSON.stringify(payload)))).slice(2)}\ntimestamp: ${ts}`;
export async function verifyWrite(a: { action: string; id: string; payload: unknown; ts: number; address: string; signature: `0x${string}` }) {
  if (Math.abs(Date.now() - a.ts) > 10 * 60_000) return false;
  const rec = await recoverMessageAddress({ message: writeMessage(a.action, a.id, a.payload, a.ts), signature: a.signature }).catch(() => "");
  return rec.toLowerCase() === a.address.toLowerCase();
}
