/** @type {import('next').NextConfig} */
const nextConfig = {
  // API 서버 프록시 (개발 환경)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.inkecho.kr',
      },
    ],
  },
}

module.exports = nextConfig
