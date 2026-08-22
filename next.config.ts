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
    return {
      fallback: [
        {
          source: "/v1/:path*",
          destination: `${backendBase}/v1/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${backendBase}/v1/:path*`,
        },
      ]
    };
  },
};

module.exports = nextConfig;
