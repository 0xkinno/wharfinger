import { HarbourScene, Mark } from "@/components/HarbourScene";
export const metadata = { robots: { index: false }, title: "Wharfinger social card" };
// 1200x630 card, captured to public/og.png by e2e/screens.mjs for link previews.
export default function Og() {
  return (<div id="og" style={{ width: 1200, height: 630, position: "relative", overflow: "hidden", background: "var(--paper-ash)", display: "grid", gridTemplateColumns: "1.05fr .95fr", alignItems: "center", gap: 0, padding: "0 0 0 56px" }}>
    <div><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}><Mark size={44} /><span className="font-display" style={{ fontSize: 34 }}>Wharfinger</span></div>
      <h1 style={{ fontSize: 62, margin: 0 }}>Every disputed hour, with a receipt.</h1>
      <p style={{ fontSize: 22, color: "var(--muted)", marginTop: 20, maxWidth: 520 }}>Demurrage claims settled without arguing over memory. Paid Telegraph answers, bought while the ship was in port.</p>
      <p className="mono" style={{ marginTop: 26, fontSize: 15, color: "var(--muted)", letterSpacing: ".08em" }}>MISSION 08 COMMODITIES · TELEGRAPH TESTNET</p></div>
    <div style={{ width: 600, height: 630, display: "flex", alignItems: "center" }}><HarbourScene /></div></div>);
}
