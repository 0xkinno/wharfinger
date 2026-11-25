// DISCOVERY: the node only sells "now". Prints, from the live schemas, every param each intent accepts and
// whether any of them can carry a time. Needs no keys and spends nothing.
const NODE = process.env.TELEGRAPH_NODE ?? "https://devnode.telegraphprotocol.com";
const intents = ["VESSEL_TELEMETRY_VERIFY_GENERAL", "LIVE_PORT_CONGESTION_GENERAL", "WEATHER_FORECAST_GENERAL", "WEATHER_FORECAST_VERIFY_GENERAL"];
for (const i of intents) {
  const s: any = await (await fetch(`${NODE}/engine/v1/intents/${i}`)).json();
  const params = (s.request?.params ?? []).map((p: any) => `${p.name}:${p.type}`);
  const timeParams = (s.request?.params ?? []).filter((p: any) => p.type === "date" || p.type === "datetime" || /time|date|when|at$/i.test(p.name));
  console.log(`${i.padEnd(34)} params [${params.join(", ")}]  time-capable: ${timeParams.length ? timeParams.map((p: any) => p.name).join(",") + " (daily date only)" : "none"}`);
}
const ch: any = await (await fetch(`${NODE}/engine/v1/ask`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ intent: "FX_NOW_EUR", params: { currency: "EUR" } }) })).json();
const msg: string = ch.accepts.find((a: any) => a.scheme === "escrow").extra.message;
console.log("\nEscrow authorization template (what a paid answer is bound to):\n" + msg);
console.log("\nThe authorization window is at most 2 minutes and the nonce is single use, so a paid answer is bound to the minute it was bought.");
export {};
