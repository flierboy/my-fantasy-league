import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cleaner production responses
  poweredByHeader: false,

  // Avatars currently use plain <img>; enable next/image for Supabase Storage later:
  // images: { remotePatterns: [{ protocol: "https", hostname: "YOUR_REF.supabase.co", pathname: "/storage/v1/object/public/**" }] },
};

export default nextConfig;
