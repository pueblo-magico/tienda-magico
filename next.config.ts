import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

function cmsMediaPatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    {
      protocol: "http",
      hostname: "localhost",
      port: "4000",
      pathname: "/api/media/**",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "4000",
      pathname: "/api/media/**",
    },
  ];

  const candidates = [
    process.env.PAYLOAD_ECOMMERCE_URL,
    process.env.PAYLOAD_CMS_URL,
    process.env.NEXT_PUBLIC_CMS_URL,
    process.env.CMS_MEDIA_ORIGIN,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      const url = new URL(raw);
      const protocol = url.protocol === "http:" ? "http" : "https";
      const pattern: RemotePattern = {
        protocol,
        hostname: url.hostname,
        pathname: "/api/media/**",
      };
      if (url.port) pattern.port = url.port;
      patterns.push(pattern);
    } catch {
      // ignore invalid URLs
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  output: process.env.STANDALONE_OUTPUT === "true" ? "standalone" : undefined,
  images: {
    // Local Payload runs on loopback. Keep private-network fetching blocked
    // in production; remotePatterns still restrict origins and media paths.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    // Do not let an allowed development image redirect to another local service.
    ...(process.env.NODE_ENV === "development" ? { maximumRedirects: 0 } : {}),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      ...cmsMediaPatterns(),
    ],
  },
};

export default withNextIntl(nextConfig);
