/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_SERVER_URL + '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 