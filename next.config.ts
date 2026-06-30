/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    port: 4000
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
      {
        // Admin panel useCrud calls /api/tenants/... — forward to backend /v1/tenants/...
        source: "/api/:path*",
        destination: `${backendBase}/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
