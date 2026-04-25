/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // InterwovenKit pulls in keplr / cosmos-kit which ship ESM-only;
    // Next 14 handles this but we keep the stub here in case a future
    // package tries to require 'fs' from a client bundle.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    return config;
  },
  transpilePackages: ["@initia/interwovenkit-react"],
};
export default nextConfig;
