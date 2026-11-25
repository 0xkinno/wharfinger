"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const config = getDefaultConfig({ appName: "Wharfinger", projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "missing", chains: [sepolia], transports: { [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined) }, ssr: true });
export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (<WagmiProvider config={config}><QueryClientProvider client={qc}><RainbowKitProvider theme={lightTheme({ accentColor: "#0B1B33", accentColorForeground: "#fff", borderRadius: "medium" })} modalSize="compact">{children}</RainbowKitProvider></QueryClientProvider></WagmiProvider>);
}
