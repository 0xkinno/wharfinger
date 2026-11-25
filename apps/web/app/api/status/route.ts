import { measure } from "@/lib/telemetry";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json(await measure(), { headers: { "cache-control": "no-store" } }); }
