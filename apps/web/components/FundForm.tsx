"use client";
import { useState } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseAbi } from "viem";

const D = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const, U = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const erc = parseAbi(["function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)", "function balanceOf(address) view returns (uint256)", "function mint(address,uint256)"]);
const esc = parseAbi(["function depositUSDCFor(address beneficiary, uint256 amount)"]);
type Step = { label: string; state: "idle" | "work" | "done" | "fail"; detail?: string };
export function FundForm() {
  const { address, isConnected } = useAccount(); const { writeContractAsync } = useWriteContract(); const pub = usePublicClient();
  const [f, setF] = useState({ vessel: "", mmsi: "", imo: "", port: "FIKTK", cap: "2.00", rate: "18000", laytimeH: "36", turnH: "6", nor: "PORT_LIMITS", shex: false });
  const [steps, setSteps] = useState<Step[]>([]); const [err, setErr] = useState(""); const [voyage, setVoyage] = useState<string | null>(null);
  const set = (i: number, s: Partial<Step>) => setSteps((x) => x.map((y, j) => (j === i ? { ...y, ...s } : y)));
  const capU = BigInt(Math.round(Number(f.cap) * 1e6)); const estimate = Math.max(1.2, 0.04 * 48 * 0.7).toFixed(2);
  async function go() {
    setErr(""); setVoyage(null); setSteps([{ label: "Create the voyage key", state: "work" }, { label: "Approve test USDC for the escrow", state: "idle" }, { label: "Deposit into the voyage key's escrow (depositUSDCFor)", state: "idle" }, { label: "Server confirms the deposit on the node ledger, sets the per-block cap", state: "idle" }]);
    try {
      const r = await fetch("/api/voyages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vessel: f.vessel, mmsi: f.mmsi || undefined, imo: f.imo || undefined, port: f.port, funder: address, capUusdc: capU.toString(),
        terms: { laytimeMinutes: Number(f.laytimeH) * 60, turnTimeMinutes: Number(f.turnH) * 60, norRule: f.nor, shex: f.shex, demurrageUusdcPerDay: String(BigInt(Math.round(Number(f.rate) * 1e6))), despatchUusdcPerDay: String(BigInt(Math.round(Number(f.rate) * 5e5))) } }) });
      const v = await r.json(); if (!r.ok) throw new Error(v.error); set(0, { state: "done", detail: `${v.voyageAddress.slice(0, 10)}... (only the address is shown)` }); setVoyage(v.id);
      set(1, { state: "work" });
      const bal = await pub!.readContract({ address: U, abi: erc, functionName: "balanceOf", args: [address!] });
      if (bal < capU) { set(1, { state: "work", detail: "your wallet holds less test USDC than the cap; minting the difference (the test token lets anyone mint)" }); const h = await writeContractAsync({ address: U, abi: erc, functionName: "mint", args: [address!, capU - bal] }); await pub!.waitForTransactionReceipt({ hash: h }); }
      const h1 = await writeContractAsync({ address: U, abi: erc, functionName: "approve", args: [D, capU] }); await pub!.waitForTransactionReceipt({ hash: h1 }); set(1, { state: "done", detail: `tx ${h1.slice(0, 12)}...` });
      set(2, { state: "work" }); const h2 = await writeContractAsync({ address: D, abi: esc, functionName: "depositUSDCFor", args: [v.voyageAddress, capU] }); await pub!.waitForTransactionReceipt({ hash: h2 }); set(2, { state: "done", detail: `tx ${h2.slice(0, 12)}...` });
      set(3, { state: "work" }); let ok = false; for (let i = 0; i < 12 && !ok; i++) { const j = await (await fetch(`/api/voyages/${v.id}/funded`, { method: "POST" })).json(); if (j.funded) { ok = true; set(3, { state: "done", detail: j.limit ? `per-block cap tx ${j.limit.tx.slice(0, 12)}...` : `watching (cap note: ${j.limitError ?? "not set"})` }); } else await new Promise((r) => setTimeout(r, 4000)); }
      if (!ok) set(3, { state: "fail", detail: "the ledger did not show the deposit in time; reload the voyage page" });
    } catch (e: any) { setErr(String(e.shortMessage ?? e.message).slice(0, 220)); setSteps((x) => x.map((s) => (s.state === "work" ? { ...s, state: "fail" } : s))); }
  }
  return (<div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8"><div className="card p-6 space-y-4"><h2 className="text-3xl">Fixture recap</h2>
    <div className="grid sm:grid-cols-2 gap-3"><label><span className="eyebrow">Vessel name</span><input value={f.vessel} onChange={(e) => setF({ ...f, vessel: e.target.value })} placeholder="Iceland" /></label><label><span className="eyebrow">MMSI (nine digits)</span><input value={f.mmsi} inputMode="numeric" onChange={(e) => setF({ ...f, mmsi: e.target.value })} placeholder="246546000" /></label>
      <label><span className="eyebrow">Port</span><select value={f.port} onChange={(e) => setF({ ...f, port: e.target.value })}><option value="FIKTK">Kotka (queue not purchasable)</option><option value="FIHEL">Helsinki</option><option value="FITKU">Turku</option></select></label><label><span className="eyebrow">NOR rule</span><select value={f.nor} onChange={(e) => setF({ ...f, nor: e.target.value })}>{["PORT_LIMITS", "BERTH", "WIBON", "WIPON"].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label><span className="eyebrow">Laytime allowed (hours)</span><input value={f.laytimeH} onChange={(e) => setF({ ...f, laytimeH: e.target.value })} /></label><label><span className="eyebrow">Turn time (hours)</span><input value={f.turnH} onChange={(e) => setF({ ...f, turnH: e.target.value })} /></label>
      <label><span className="eyebrow">Demurrage, USD per day</span><input value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></label><label><span className="eyebrow">Voyage cap, test USDC</span><input value={f.cap} onChange={(e) => setF({ ...f, cap: e.target.value })} /></label></div>
    <label className="flex gap-2 items-center"><input type="checkbox" style={{ width: 18 }} checked={f.shex} onChange={(e) => setF({ ...f, shex: e.target.checked })} /> Sundays and holidays excepted (SHEX)</label>
    <p className="text-sm text-muted">The watcher can spend at most what you put in for this voyage. The Telegraph node refuses the next answer when it runs out. Estimate for a 48 hour stay: about ${estimate} of answers at $0.01 each. Terms are hashed at funding; a change needs a new signed version.</p>
    {!isConnected ? <ConnectButton label="Connect the funding wallet" /> : <button className="btn" onClick={go} disabled={!f.vessel || (!f.mmsi && !f.imo) || (f.mmsi !== "" && !/^\d{9}$/.test(f.mmsi)) || Number(f.cap) < 0.1 || steps.some((s) => s.state === "work")}>Fund the voyage and start watching</button>}
    {err && <p className="text-flag text-sm" role="alert">{err}</p>}</div>
    <div className="card p-6"><h2 className="text-3xl mb-3">What your wallet does</h2>{steps.length === 0 ? <ol className="text-[15px] text-muted list-decimal ml-5 space-y-2"><li>A voyage key is created for this ship. You see only its address.</li><li>Your wallet approves the escrow and calls <span className="mono">depositUSDCFor(voyage key, cap)</span>. The cap lives in the escrow, not in our code.</li><li>The server reads the node's ledger, never your word, then sets a per-block limit from the voyage key.</li><li>The watcher buys every 30 minutes. You can withdraw what is left when the ship sails.</li></ol> :
      <ol className="space-y-3">{steps.map((s, i) => <li key={i} className="flex gap-3"><span className={`chip ${s.state === "done" ? "ok" : s.state === "fail" ? "flag" : s.state === "work" ? "live" : ""}`}><i />{s.state}</span><span className="text-sm"><b>{s.label}</b>{s.detail && <span className="block text-muted mono text-[12px]">{s.detail}</span>}</span></li>)}</ol>}
      {voyage && <Link className="btn mt-5" href={`/voyage/${voyage}`}>Open the voyage</Link>}</div></div>);
}
