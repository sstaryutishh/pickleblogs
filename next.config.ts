import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The blog is a separate zone: every dependency stays inside /blog/*.
  // Framer needs only two rewrites and continues to own the public homepage.
  assetPrefix: "/blog",
  images: { unoptimized: true },
  poweredByHeader: false,
  trailingSlash: false,
  async redirects() {
    return [
      { source: "/blog/page/1", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
