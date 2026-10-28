/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/contracts'],

  // Allow LAN + ngrok access in dev (for PWA testing on phone)
  // allowedDevOrigins: [
  //   '192.168.68.52',
  //   'localhost',
  //   '127.0.0.1',
  //   'billowy-unsatisfied-phyliss.ngrok-free.dev',
  // ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

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