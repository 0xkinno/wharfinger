import { q, hasDb } from "./db";
import { MINERS, minerInfo } from "../../../packages/evidence/src/index.ts";
export { MINERS, minerInfo };
export async function safe<T>(f: () => Promise<T>, fallback: T): Promise<T> { try { return hasDb() ? await f() : fallback; } catch { return fallback; } }
export const fmtTime = (iso: string | Date | null) => (iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + "Z" : "none");
export const epochNow = async () => { try { const r = await fetch("https://devnode.telegraphprotocol.com/v1/ledger/account/0x0000000000000000000000000000000000000001", { next: { revalidate: 60 } }); return (await r.json()).active_root?.epoch_id ?? null; } catch { return null; } };
export { q };
