/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/contracts'],

  // Allow LAN + ngrok access in dev (for PWA testing on phone)
  allowedDevOrigins: [
    '192.168.68.52',
    'localhost',
    '127.0.0.1',
    'billowy-unsatisfied-phyliss.ngrok-free.dev',
  ],

  async rewrites() {
    if (!process.env.API_PROXY_URL) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_PROXY_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;