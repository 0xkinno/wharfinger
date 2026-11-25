export const dynamic = "force-dynamic";
// "Run a tick now" behind the public lock: relays to the real tick route with the server-side secret, only for non-house voyages.
export async function POST(req: Request) {
  const url = new URL(req.url); const origin = `${url.protocol}//${url.host}`;
  const r = await fetch(`${origin}/api/watch/tick`, { method: "POST", headers: { authorization: `Bearer ${process.env.WATCH_TICK_SECRET}` } });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
