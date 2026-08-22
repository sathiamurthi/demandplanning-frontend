/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    port: 4000
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ],
      },
    ];
  },
  async rewrites() {
    const backendBase = process.env.BACKEND_URL
      || process.env.NEXT_PUBLIC_API_URL
      || `http://localhost:${process.env.API_PORT || "5000"}`;
    return [
      {
        source: "/v1/:path*",
        destination: `${backendBase}/v1/:path*`,
      },
      // Admin panel useCrud calls /api/... — forward ONLY known backend paths to /v1/...
      { source: "/api/tenants/:path*", destination: `${backendBase}/v1/tenants/:path*` },
      { source: "/api/roles/:path*", destination: `${backendBase}/v1/roles/:path*` },
      { source: "/api/users/:path*", destination: `${backendBase}/v1/users/:path*` },
      { source: "/api/auth/:path*", destination: `${backendBase}/v1/auth/:path*` },
    ];
  },
};

module.exports = nextConfig;
