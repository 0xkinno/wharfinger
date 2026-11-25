import { describe, it, expect } from "vitest";
import { MINERS } from "../../evidence/src/index.ts";
import { tick, dueKinds, slotOf, MemoryStore, type VoyageState, type Buy, type Deps } from "../src/index.ts";

const NOW = Date.parse("2026-11-25T06:40:30Z");
const voyage = (o: Partial<VoyageState> = {}): VoyageState => ({ id: "v1", status: "WATCHING", mmsi: "246546000", portLocode: "FIKTK", portQuery: "Kotka", moored: false, lastBought: {}, ownOperators: [], ...o });
const OP: Record<string, string> = { "7603": "0x8b22", "9002": "0xb3fb", "20260828": "0x5c4b", "302": "0xd4c7", "93001": "0xbd6f" };
// miners (ids from the real operator map): good ones return the real Kotka position, 93001 returns the lat=lon fault
const good = (nowMs: number) => ({ vessel: "246546000", speed_knots: 0, latitude: 60.534235, longitude: 27.171965, course_deg: 75.8, observed_at: new Date(nowMs - 90_000).toISOString() });
function fake(routedOrder: string[], opts: { budget?: number; failOn?: Set<string> } = {}) {
  let budget = opts.budget ?? 1_000_000; let routedIdx = 0; const asks: { minerId?: string; intent: string }[] = [];
  const buy: Buy = async (body, minerId) => {
    asks.push({ minerId, intent: body.intent });
    if (budget < 10_000) return { ok: false, status: 402, ms: 5, body: { reason: "insufficient escrow for delivery: unbilled=0 μUSDC + price=10000 μUSDC > balance=0 μUSDC" }, receipt: null, auth: null, askedAt: new Date(NOW).toISOString(), refusal: "insufficient escrow for delivery: unbilled=0 μUSDC + price=10000 μUSDC > balance=0 μUSDC" };
    const id = minerId ?? routedOrder[routedIdx++ % routedOrder.length];
    if (opts.failOn?.has(id)) return { ok: false, status: 503, ms: 5, body: { error: "no_compatible_miner" }, receipt: null, auth: null, askedAt: new Date(NOW).toISOString(), refusal: "no_compatible_miner" };
    budget -= 10_000;
    const sec = Math.floor(NOW / 1000);
    const result = body.intent.startsWith("VESSEL") ? (id === "93001" ? { ...good(NOW), latitude: 27.17 } : good(NOW)) : { port: "FIKTK", vessels_waiting: 2, wait_hours: 17.4, congestion_level: "moderate", as_of: new Date(NOW - 60_000).toISOString() };
    return { ok: true, status: 200, ms: 5, body: { miner_id: id, result, result_shape: "intent", signal_hash: `0xsig${asks.length}` }, receipt: { receipt_hash: `0xrcpt${asks.length}`, epoch_id: 53, amount_uusdc: "10000" }, auth: { validAfter: sec - 5, validBefore: sec + 100 }, askedAt: new Date(NOW).toISOString(), refusal: null };
  };
  return { buy, asks, get budget() { return budget; } };
}
const deps = (f: ReturnType<typeof fake>, store = new MemoryStore()): Deps => ({ buy: f.buy, store, now: () => NOW, signalCreatedAt: async () => new Date(NOW + 2000).toISOString(), available: async () => BigInt(f.budget) });

describe("cadence", () => {
  it("buys everything on a new voyage, then waits by state", () => {
    expect(dueKinds(voyage(), 100)).toEqual(["vessel", "port", "weather"]);
    expect(dueKinds(voyage({ lastBought: { vessel: 80, port: 80, weather: 80 } }), 100)).toEqual([]);
    expect(dueKinds(voyage({ lastBought: { vessel: 60 } }), 100)).toContain("vessel");
    expect(dueKinds(voyage({ moored: true, lastBought: { vessel: 60 } }), 100)).not.toContain("vessel");
  });
  it("a slot is 30 minutes", () => { expect(slotOf(NOW)).toBe(slotOf(NOW + 10 * 60000)); expect(slotOf(NOW)).not.toBe(slotOf(NOW + 30 * 60000)); });
});

describe("tick", () => {
  it("first buy is routed; a second operator is pinned; two operators corroborate; each purchase is stored with its receipt", async () => {
    const f = fake(["9002", "9002", "9002"]); const store = new MemoryStore();
    const r = await tick(voyage(), deps(f, store));
    const vessel = r.facts.find((x) => x.kind === "vessel")!;
    expect(vessel.corroboration!.status).toBe("CORROBORATED"); expect(vessel.corroboration!.operators.length).toBe(2);
    expect(f.asks[0].minerId).toBeUndefined(); expect(f.asks[1].minerId).toBeDefined(); // routed, then pinned re-buy
    expect(store.rows.every((x) => x.receiptHash && x.signalHash)).toBe(true);
    expect(store.rows.some((x) => x.pinned)).toBe(true);
  });
  it("B2/B5 style: a faulty first answer is stored with its refusal and the re-buy goes to another operator", async () => {
    const f = fake(["93001"]); const store = new MemoryStore();
    const r = await tick(voyage(), deps(f, store));
    const first = store.rows[0]; expect(first.verdictOk).toBe(false); expect(first.refusals).toContain("WRONG_PLACE");
    expect(r.facts[0].corroboration!.status).toBe("CORROBORATED");
  });
  it("a port whose queue cannot be bought is skipped, says so, and spends nothing on it", async () => {
    const f = fake(["9002"]); const r = await tick(voyage({ portQuery: null }), deps(f));
    expect(r.facts.find((x) => x.kind === "port")!.corroboration!.note).toContain("not purchasable"); expect(f.asks.every((a) => a.intent.startsWith("VESSEL"))).toBe(true);
  });
  it("a provider error is not billed and the next operator is tried", async () => {
    const f = fake(["7603"], { failOn: new Set(["7603"]) }); const store = new MemoryStore();
    const r = await tick(voyage(), deps(f, store)); expect(store.rows[0].status).toBe(503); expect(store.rows[0].costUusdc).toBe("0");
    expect(r.facts[0].verdicts).toBeGreaterThan(0);
  });
  it("our own operator never corroborates", async () => {
    const f = fake(["9002"]); const r = await tick(voyage({ ownOperators: [...new Set(Object.values(MINERS).map((m) => m.operator))] }), deps(f));
    expect(r.facts[0].corroboration?.status ?? "INSUFFICIENT").not.toBe("CORROBORATED");
  });
  it("idempotent: a second tick in the same slot does nothing and spends nothing", async () => {
    const f = fake(["9002"]); const store = new MemoryStore(); const d = deps(f, store);
    const a = await tick(voyage(), d); const n = f.asks.length; const b = await tick(voyage(), d);
    expect(a.purchases).toBeGreaterThan(0); expect(b.skipped).toBe("LEASE_HELD"); expect(f.asks.length).toBe(n);
  });
  it("two concurrent ticks buy once", async () => {
    const f = fake(["9002"]); const store = new MemoryStore(); const d = deps(f, store);
    const [a, b] = await Promise.all([tick(voyage(), d), tick(voyage(), d)]);
    expect([a.skipped, b.skipped].filter((x) => x === "LEASE_HELD")).toHaveLength(1);
  });
  it("B4: with 0.05 USDC the watcher stops at the node's own refusal, marks BUDGET_SPENT, and never retries", async () => {
    const f = fake(["9002", "7603", "20260828"], { budget: 50_000 }); const store = new MemoryStore(); const v = voyage({ moored: false });
    let buys = 0, held: any = null; let nowMs = NOW;
    const d = { ...deps(f, store), now: () => nowMs, available: async () => 10_000n }; // the ledger read lags, so the gate passes and the node itself refuses the sixth answer
    for (let i = 0; i < 20 && !held; i++) { const r = await tick(v, d); buys += r.purchases; held = r.held ?? null; nowMs += 31 * 60000; v.lastBought = {}; }
    expect(buys).toBe(5); expect(held).toBe("BUDGET_SPENT");
    expect(store.statuses.at(-1)!.status).toBe("BUDGET_SPENT");
    const refused = store.rows.filter((r) => r.status === 402); expect(refused).toHaveLength(1); expect(refused[0].refusal).toContain("insufficient escrow for delivery");
  });
  it("holds when the ledger says less than one answer is available, before spending", async () => {
    const f = fake(["9002"]); const d = { ...deps(f), available: async () => 5_000n };
    const r = await tick(voyage(), d); expect(r.held).toBe("BUDGET_SPENT"); expect(f.asks).toHaveLength(0);
  });
  it("evidence rows are append-only (frozen)", async () => {
    const f = fake(["9002"]); const store = new MemoryStore(); await tick(voyage(), deps(f, store));
    expect(() => { (store.rows[0] as any).status = 0; }).toThrow();
  });
});
