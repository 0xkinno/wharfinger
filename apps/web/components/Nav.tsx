"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import { Mark } from "./HarbourScene";

const links = [["/harbour", "Harbour"], ["/voyage/new", "Voyage"], ["/verify", "Verify"], ["/evidence", "Evidence"], ["/judge", "Judges"]];
export function Nav() {
  const path = usePathname(); const { isConnected } = useAccount(); const { disconnect } = useDisconnect();
  const [net, setNet] = useState<{ ok: boolean; ms?: number } | null>(null); const [open, setOpen] = useState(false);
  useEffect(() => { fetch("/api/status").then((r) => r.json()).then((s) => setNet(s.node)).catch(() => setNet({ ok: false })); }, []);
  return (
    <header className="sticky top-3 z-40 px-3">
      <nav aria-label="Main" className="mx-auto max-w-[1180px] h-14 rounded-[14px] bg-white border border-hair shadow-[0_8px_30px_-10px_rgba(11,27,51,.25)] flex items-center gap-3 px-3">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Wharfinger home"><Mark /><span className="font-display text-[20px] tracking-tight hidden sm:inline">Wharfinger</span></Link>
        <div className="hidden lg:flex flex-1 justify-center gap-1">
          {links.map(([h, t]) => { const a = path === h || (h !== "/" && path.startsWith(h) && h !== "/voyage/new") || (h === "/voyage/new" && path.startsWith("/voyage")); return <Link key={h} href={h} aria-current={a ? "page" : undefined} className={`whitespace-nowrap rounded-[10px] px-3 py-1.5 text-sm font-semibold ${a ? "bg-ink text-white" : "text-ink hover:bg-paper"}`}>{t}</Link>; })}
        </div>
        <div className="flex-1 lg:hidden" />
        <span className="chip hidden xl:inline-flex" title="Measured from /api/status"><i style={{ background: net?.ok ? "var(--signal)" : net ? "var(--flag)" : "var(--muted)" }} />Sepolia, Telegraph testnet{net?.ms ? `, ${net.ms} ms` : ""}</span>
        <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} label="Connect wallet" />
        {isConnected && <button className="btn ghost !p-2" onClick={() => disconnect()} aria-label="Disconnect wallet" title="Disconnect"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v9" /><path d="M6.3 6.7a8 8 0 1 0 11.4 0" /></svg></button>}
        <button className="lg:hidden btn ghost !p-2" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>Menu</button>
      </nav>
      {open && <div className="lg:hidden mx-auto max-w-[1180px] mt-2 card p-2 flex flex-col">{links.map(([h, t]) => <Link key={h} href={h} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg font-semibold hover:bg-paper">{t}</Link>)}</div>}
    </header>
  );
}
