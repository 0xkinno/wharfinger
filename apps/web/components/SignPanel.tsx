"use client";
import { useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { DOMAIN, TYPES, statementMessage, type SignedStatement } from "@pk/statement/src/index.ts";
export function SignPanel({ voyageId, statement, funder, review }: { voyageId: string; statement: SignedStatement; funder: string | null; review: number }) {
  const { address, isConnected } = useAccount(); const { signTypedDataAsync } = useSignTypedData(); const [msg, setMsg] = useState("");
  const can = isConnected && !!funder && address?.toLowerCase() === funder.toLowerCase();
  const sign = async () => { setMsg(""); try {
    const signature = await signTypedDataAsync({ domain: DOMAIN, types: { LaytimeStatement: TYPES.LaytimeStatement }, primaryType: "LaytimeStatement", message: statementMessage(statement) });
    const r = await fetch(`/api/statement/${voyageId}/sign`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, statementHash: statement.statementHash, signature }) }); const j = await r.json();
    setMsg(r.ok ? "Signed. The statement is frozen and the owner can verify it." : j.error); if (r.ok) setTimeout(() => location.reload(), 900); } catch (e: any) { setMsg(String(e.shortMessage ?? e.message).slice(0, 160)); } };
  return (<div className="space-y-2"><button className="btn" onClick={sign} disabled={!can || review > 0}>Sign as analyst (EIP-712)</button>
    {!isConnected && <p className="text-sm text-muted">Connect the funding wallet to sign.</p>}{isConnected && !can && <p className="text-sm text-muted">Only the funding wallet signs as the analyst.</p>}{review > 0 && <p className="text-sm text-flag">{review} minutes are still in REVIEW. Resolve them on the voyage page first.</p>}{msg && <p className="text-sm" role="status">{msg}</p>}</div>);
}
