import type { NextConfig } from "next";

const IS_PROD = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  ...(IS_PROD
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  distDir: ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Restrict to known origins — do not allow all HTTPS hosts
    remotePatterns: [
      { protocol: "http",  hostname: "localhost",           port: "5000" },
      { protocol: "https", hostname: "efixmate.com" },
      { protocol: "https", hostname: "cdn.efixmate.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },  // Firebase Storage
    ],
    minimumCacheTTL: 60,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      { source: '/terms', destination: '/terms-and-conditions', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/about', destination: '/about-us', permanent: true },
      { source: '/contact', destination: '/contact-us', permanent: true },
      { source: '/partner', destination: '/technician/login', permanent: false },
      { source: '/join-as-partner', destination: '/technician/login', permanent: true },
      { source: '/services/:slug+', destination: '/services', permanent: false },
    ];
  },

  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000")
      .replace(/\/$/, "")
      .replace(/\/api$/, ""); // Robust: handle older env vars that might have /api

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
      // Express serves files under `/uploads` (same server as API). Proxy them so
      // absolute URLs like `https://efixmate.com/uploads/...` work in <img> tags,
      // not only `https://efixmate.com/api/uploads/...`.
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

};

export default nextConfig;
