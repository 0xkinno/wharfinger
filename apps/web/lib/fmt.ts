// Plain formatting helpers, safe to call from server and client components.
export const short = (h?: string | null, n = 10) => (h ? `${h.slice(0, n)}...${h.slice(-4)}` : "none");
export const usd = (u: string | bigint) => {
  const n = BigInt(u); const neg = n < 0n; const a = neg ? -n : n;
  return `${neg ? "-" : ""}$${(a / 1_000_000n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${(a % 1_000_000n).toString().padStart(6, "0").slice(0, 2)}`;
};
export const cents = (u: string | bigint) => `$${(Number(u) / 1_000_000).toFixed(2)}`;
