import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
/** @type {import('next').NextConfig} */
export default {
  outputFileTracingRoot: root,
  experimental: { externalDir: true },
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  typescript: { ignoreBuildErrors: false },
  webpack: (config) => { config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] }; const optional = ["@x402/core/client", "@x402/evm", "@x402/evm/exact/client", "@x402/evm/upto/client", "@x402/svm/exact/client"]; // optional wallet-connector extras we never use
    config.resolve.alias = { ...config.resolve.alias, ...Object.fromEntries(optional.map((m) => [m, false])) };
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, crypto: false }; return config; },
};
