import type { NextConfig } from "next";
import {
  createNoIndexHeaders,
  createSecurityHeaders,
} from "./lib/security-headers.mjs";

const securityHeaders = createSecurityHeaders({
  development: process.env.NODE_ENV === "development",
});
const noIndexHeaders = createNoIndexHeaders();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      { source: "/admin/:path*", headers: noIndexHeaders },
      { source: "/login", headers: noIndexHeaders },
      { source: "/api/:path*", headers: noIndexHeaders },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
