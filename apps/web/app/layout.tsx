import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/Nav";
import Link from "next/link";

export const metadata: Metadata = { metadataBase: new URL("https://wharfinger-kinnoskis-projects.vercel.app"), openGraph: { title: "Wharfinger", description: "Every disputed hour of a port call, with a receipt the shipowner can check.", images: [{ url: "/og.png", width: 1200, height: 630 }], type: "website" }, twitter: { card: "summary_large_image", title: "Wharfinger", description: "Every disputed hour of a port call, with a receipt the shipowner can check.", images: ["/og.png"] }, title: "Wharfinger: every disputed hour of a port call, with a receipt", description: "Wharfinger watches a ship in port and buys the facts on Telegraph while they are still true, so a laytime statement settles instead of arguing. Telegraph testnet.", icons: { icon: "/icon.svg" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F3F1EC" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
      <Providers><Nav /><main id="main" className="wrap pt-8 pb-24">{children}</main></Providers>
      <footer className="wrap pb-12 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2 border-t border-hair pt-6">
        <span>Telegraph testnet only. Mira is a fictional analyst; the ships, positions and receipts are real.</span>
        <Link href="/trace" className="underline">Trace</Link><Link href="/judge" className="underline">For judges</Link><a className="underline" href="https://github.com/0xkinno/wharfinger">Source</a>
        <span>Hackathon entry; the prize incentive applies.</span>
      </footer>
    </body></html>
  );
}
