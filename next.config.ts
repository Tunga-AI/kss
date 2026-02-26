import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/a/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/l/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/f/:path*',
        destination: '/staff/:path*',
      },
      {
        source: '/b',
        destination: '/dashboard/business',
      },
      {
        source: '/b/:path*',
        destination: '/dashboard/business/:path*',
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.paystack.com https://*.paystack.co https://www.googletagmanager.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https://firebasestorage.googleapis.com",
              "connect-src 'self' https://api.paystack.co https://standard.paystack.co https://*.paystack.co https://firebasestorage.googleapis.com https://*.googleapis.com wss://*.firebaseio.com https://www.google-analytics.com ws://136.114.153.34:7880 http://136.114.153.34:7880 wss://136.114.153.34:7880 https://136.114.153.34:7880",
              "frame-src 'self' https://js.paystack.co https://checkout.paystack.com https://firebasestorage.googleapis.com https://msommii.firebaseapp.com https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
