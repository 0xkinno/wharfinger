// C5 probe: how the node refuses malformed escrow authorizations. Uses a throwaway key that holds nothing.
// Every request here is refused before delivery, so nothing is charged. Raw responses go to evidence/probe/.
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { writeFileSync } from "node:fs";

const NODE = process.env.TELEGRAPH_NODE ?? "https://devnode.telegraphprotocol.com";
const account = privateKeyToAccount(generatePrivateKey()); // throwaway, never stored
const body = JSON.stringify({ intent: "FX_NOW_EUR", params: { currency: "EUR" } });
const json = { "content-type": "application/json" };

async function challenge() {
  const r = await fetch(`${NODE}/engine/v1/ask`, { method: "POST", headers: json, body });
  const c = await r.json();
  const esc = c.accepts.find((a: any) => a.scheme === "escrow");
  return { template: esc.extra.message as string, payTo: esc.payTo as string, network: esc.network as string };
}
type Over = Partial<{ from: string; to: string; value: string; validAfter: number; validBefore: number; nonce: string; network: string; messageNetwork: string }>;
async function attempt(label: string, ch: Awaited<ReturnType<typeof challenge>>, o: Over = {}, reuse?: string) {
  const now = Math.floor(Date.now() / 1000);
  const auth = {
    from: (o.from ?? account.address.toLowerCase()), to: o.to ?? ch.payTo,
    value: o.value ?? ch.template.match(/Amount:\s*(\d+)\s*uUSDC/)![1],
    validAfter: o.validAfter ?? now - 5, validBefore: o.validBefore ?? now + 100, nonce: o.nonce ?? crypto.randomUUID(),
  };
  let template = ch.template;
  if (o.messageNetwork) template = template.replace(/Network: [^\n]+/, `Network: ${o.messageNetwork}`);
  const message = template.replace("{from}", auth.from).replace("{nonce}", auth.nonce)
    .replace("{validAfter}", String(auth.validAfter)).replace("{validBefore}", String(auth.validBefore));
  const signature = await account.signMessage({ message });
  const payment = reuse ?? Buffer.from(JSON.stringify({ x402Version: 2, scheme: "escrow", network: o.network ?? ch.network,
    payload: { signature, authorization: { ...auth, validAfter: String(auth.validAfter), validBefore: String(auth.validBefore) } } })).toString("base64");
  const r = await fetch(`${NODE}/engine/v1/ask`, { method: "POST", headers: { ...json, "X-PAYMENT": payment }, body });
  const text = await r.text();
  let parsed: any = text; try { parsed = JSON.parse(text); } catch {}
  const reason = typeof parsed === "object" && parsed ? (parsed.reason ?? parsed.error ?? text) : text;
  console.log(`${label.padEnd(34)} HTTP ${r.status}  ${String(reason).slice(0, 190)}`);
  return { label, status: r.status, reason: String(reason), payment };
}

const ch = await challenge();
const out: any[] = [];
const a = await attempt("a valid authorization, no funds", ch); out.push(a);
out.push(await attempt("b window 300 s (limit 120 s)", ch, { validBefore: Math.floor(Date.now() / 1000) + 300 }));
out.push(await attempt("c value 9999 (quote 10000)", ch, { value: "9999" }));
out.push(await attempt("d value 10001", ch, { value: "10001" }));
out.push(await attempt("e wrong recipient", ch, { to: "0x000000000000000000000000000000000000dEaD" }));
out.push(await attempt("f replay of (a)", ch, {}, a.payment));
out.push(await attempt("g checksummed from", ch, { from: account.address }));
out.push(await attempt("h expired validBefore", ch, { validAfter: Math.floor(Date.now() / 1000) - 400, validBefore: Math.floor(Date.now() / 1000) - 300 }));
out.push(await attempt("i not yet valid", ch, { validAfter: Math.floor(Date.now() / 1000) + 600, validBefore: Math.floor(Date.now() / 1000) + 650 }));
out.push(await attempt("j message names another chain", ch, { messageNetwork: "eip155:1" }));
out.push(await attempt("k envelope network mismatch", ch, { network: "eip155:1" }));
out.push(await attempt("l nonce reused with fresh signature", ch, { nonce: "fixed-nonce-12345678" }));
out.push(await attempt("m same nonce again", ch, { nonce: "fixed-nonce-12345678" }));
writeFileSync("evidence/probe/c5_auth_refusals.json", JSON.stringify({ at: new Date().toISOString(), node: NODE,
  throwawayAddress: account.address, results: out.map(({ payment, ...r }) => r) }, null, 1));
