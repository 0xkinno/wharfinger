// Settlement gate demo on Solana DEVNET. Real: the Telegraph screening purchases (house key, escrow rail), the signed statement
// recompute, and the Solana devnet transfer and its read-back from the chain. Illustrative: the payee and the shipowner names, and the
// payment token, which is a worthless devnet test mint created here (not USDC). Nothing here is mainnet.
// Usage: NODE_USE_ENV_PROXY=1 pnpm exec tsx scripts/solana-settle.ts   (needs HOUSE_PRIVATE_KEY with escrow funds; creates devnet keys on first run)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnv, setEnvVar } from "./lib/env.ts";
import { escrowClient } from "../packages/telegraph/src/index.ts";
import { gate, verifySettlement, memoFor, type Mandate, type Screening } from "../packages/settle/src/index.ts";
import type { SignedStatement } from "../packages/statement/src/index.ts";

loadEnv();
const RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const con = new Connection(RPC, "confirmed");
const MEMO = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const kp = (name: string) => { const v = process.env[name]; if (v) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(v))); const k = Keypair.generate(); setEnvVar(name, JSON.stringify([...k.secretKey])); process.env[name] = JSON.stringify([...k.secretKey]); return k; };
const treasury = kp("SOLANA_TREASURY_KEY"); const payee = kp("SOLANA_PAYEE_KEY");

async function ensureSol() {
  if ((await con.getBalance(treasury.publicKey)) >= 0.05 * LAMPORTS_PER_SOL) return;
  for (let i = 0; i < 4; i++) { try { const sig = await con.requestAirdrop(treasury.publicKey, LAMPORTS_PER_SOL); await con.confirmTransaction(sig, "confirmed"); return; } catch (e: any) { console.log("airdrop retry:", String(e.message).slice(0, 80)); await new Promise((r) => setTimeout(r, 5000)); } }
  throw new Error(`devnet SOL needed at ${treasury.publicKey.toBase58()}`);
}
async function ensureMint() {
  if (process.env.SOLANA_TEST_MINT) return new PublicKey(process.env.SOLANA_TEST_MINT);
  const mint = await createMint(con, treasury, treasury.publicKey, null, 6); setEnvVar("SOLANA_TEST_MINT", mint.toBase58()); process.env.SOLANA_TEST_MINT = mint.toBase58();
  const ata = await getOrCreateAssociatedTokenAccount(con, treasury, mint, treasury.publicKey); await mintTo(con, treasury, mint, ata.address, treasury, 100_000_000_000n); return mint;
}

const house = privateKeyToAccount(process.env.HOUSE_PRIVATE_KEY as `0x${string}`); const tg = escrowClient(house);
async function screen(name: string): Promise<Screening> {
  const p = await tg.ask({ intent: "SANCTIONS_SCREENING_MATCH_GENERAL", params: { name } });
  if (!p.ok || !p.receipt) throw new Error(`screening refused: ${p.refusal}`);
  return { name, matched: typeof p.body.result?.matched === "boolean" ? p.body.result.matched : null, receiptHash: p.receipt.receipt_hash, signalHash: p.body.signal_hash, minerId: String(p.body.miner_id ?? p.body.miner ?? ""), askedAt: p.askedAt, intent: "SANCTIONS_SCREENING_MATCH_GENERAL" };
}

async function pay(mint: PublicKey, amount: bigint, memo: string) {
  const from = getAssociatedTokenAddressSync(mint, treasury.publicKey); const toAta = await getOrCreateAssociatedTokenAccount(con, treasury, mint, payee.publicKey);
  const tx = new Transaction().add(createTransferCheckedInstruction(from, mint, toAta.address, treasury.publicKey, amount, 6), new TransactionInstruction({ keys: [{ pubkey: treasury.publicKey, isSigner: true, isWritable: false }], programId: MEMO, data: Buffer.from(memo) }));
  return sendAndConfirmTransaction(con, tx, [treasury]);
}
// Read the payment back from the chain; trust nothing the sender reported.
async function readBack(txid: string, mint: PublicKey) {
  const t = await con.getParsedTransaction(txid, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }); if (!t || t.meta?.err) throw new Error("transaction not found or failed");
  const ixs: any[] = t.transaction.message.instructions as any[];
  const memo = ixs.find((i) => i.program === "spl-memo")?.parsed as string; const tr = ixs.find((i) => i.parsed?.type === "transferChecked")?.parsed.info;
  const post = (t.meta?.postTokenBalances ?? []).find((b) => b.mint === mint.toBase58() && b.owner === payee.publicKey.toBase58());
  return { memo, amount: BigInt(tr.tokenAmount.amount), to: post?.owner ?? "", slot: t.slot, blockTime: t.blockTime };
}

const base: SignedStatement = JSON.parse(readFileSync("examples/statement.sample.json", "utf8"));
const NAME = "Nordic Bulk Owners Oy", BAD = "Rosoboronexport"; // BAD is a known listed Russian arms exporter, used only to prove the hold
const m: Mandate = { payer: "charterer (illustrative)", payeeName: NAME, payeeAddress: payee.publicKey.toBase58(), analystAddress: base.analyst!.address, ownerAddress: base.countersign!.address, maxUusdc: 10_000_000_000n };
const run: any[] = []; const show = (g: any) => ({ decision: g.decision, payUusdc: g.payUusdc.toString(), heldUusdc: g.heldUusdc.toString(), reasons: g.reasons });
const tampered = structuredClone(base); { const i = tampered.body.result.intervals.length - 1; tampered.body.result.intervals[i].to += 1; tampered.body.result.intervals[i].minutes += 1; }
const { countersign: _c, ...unsigned } = base;
// Screening receipts are bought once and kept, so a re-run does not pay twice for the same fact.
const CACHE = "evidence/settlement/screening.json";
const sc: Record<string, Screening> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
for (const n of [NAME, BAD]) sc[n] ??= await screen(n);
writeFileSync(CACHE, JSON.stringify(sc, null, 1) + "\n");
const clean = sc[NAME], listed = sc[BAD];
if (process.env.SCREEN_ONLY) { console.log("screening receipts saved", Object.values(sc).map((x) => `${x!.name}: matched=${x!.matched}`)); process.exit(0); }
await ensureSol(); const mint = await ensureMint();
const cases: [string, SignedStatement, Mandate, Screening][] = [
  ["1 tampered statement: one minute added", tampered, m, clean],
  ["2 owner has not countersigned", unsigned as SignedStatement, m, clean],
  ["3 payee matches a sanctions list", base, { ...m, payeeName: BAD }, listed],
  ["4 everything checks: pay on Solana devnet", base, m, clean],
];
for (const [label, s, mm, sc] of cases) {
  const g = await gate(s, mm, sc); const row: any = { label, ...show(g), screening: sc && { name: sc.name, matched: sc.matched, receipt: sc.receiptHash, signal: sc.signalHash } };
  if (g.decision === "RELEASE" || g.decision === "RELEASE_PARTIAL") {
    const memo = memoFor(g); const txid = await pay(mint, g.payUusdc, memo); const b = await readBack(txid, mint);
    const v = verifySettlement(g, { rail: "solana", network: "devnet", txid, amountUusdc: b.amount, to: b.to, memo: b.memo }, mm);
    row.settlement = { txid, explorer: `https://explorer.solana.com/tx/${txid}?cluster=devnet`, mint: mint.toBase58(), payee: mm.payeeAddress, slot: b.slot, blockTime: b.blockTime, readBack: { amount: b.amount.toString(), memo: b.memo }, verified: v.pass, checks: v.checks };
    if (!v.pass) throw new Error("settlement did not verify");
  } else row.settlement = null;
  console.log(label, "->", g.decision, row.settlement?.explorer ?? ""); run.push(row);
}
const out = JSON.stringify({ at: new Date().toISOString(), network: "solana-devnet", token: "devnet test mint, not USDC", statementHash: base.statementHash, results: run }, null, 1) + "\n";
writeFileSync("evidence/settlement/run.json", out); writeFileSync("apps/web/fixtures/settlement-run.json", out); // the page reads the second copy
console.log("wrote evidence/settlement/run.json");
