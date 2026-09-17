import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // Raised from the default 1MB so requests carrying photo uploads
      // (see app/actions/photos.ts) don't get rejected.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
