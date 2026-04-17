import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_WASIAT_MODULE_ADDRESS:
      process.env.NEXT_PUBLIC_WASIAT_MODULE_ADDRESS,
  },
  experimental: {
    typedRoutes: true,
  },
};

export default config;
