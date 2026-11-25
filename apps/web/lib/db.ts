import { neon } from "@neondatabase/serverless";
export const hasDb = () => !!process.env.DATABASE_URL;
let _sql: ReturnType<typeof neon> | null = null;
export function sql() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set"); return (_sql ??= neon(process.env.DATABASE_URL)); }
export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> { return (await sql().query(text, params)) as T[]; }
