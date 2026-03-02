import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // googleapis is 194MB — exclude it from the serverless function bundle
  // so Vercel treats it as an external (installed) package, not inlined JS.
  serverExternalPackages: ["googleapis"],
};

export default nextConfig;
