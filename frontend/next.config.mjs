/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // InterwovenKit pulls in keplr / cosmos-kit which ship ESM-only;
    // Next 14 handles this but we keep the stub here in case a future
    // package tries to require 'fs' from a client bundle.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    // cosmjs-types ships a strict `exports` map that omits paths
    // @initia imports (e.g. ./cosmos/crypto/secp256k1/keys.js).
    // Disable exports-field enforcement so webpack falls back to plain
    // file resolution under node_modules.
    config.resolve.exportsFields = [];
    return config;
  },
  transpilePackages: ["@initia/interwovenkit-react", "cosmjs-types"],
  experimental: {
    esmExternals: "loose",
  },
};
export default nextConfig;
