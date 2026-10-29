import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Allow next/image to optimise files from whichever storage is configured.
const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
]
if (process.env.S3_PUBLIC_URL) {
  try {
    const u = new URL(process.env.S3_PUBLIC_URL)
    remotePatterns.push({ protocol: u.protocol.replace(':', '') as 'https', hostname: u.hostname })
  } catch {
    /* ignore malformed env */
  }
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [96, 160, 256, 384],
    // Next 16 only serves the qualities listed here (default: 75). Picture uses 80/82 and the lightbox 90.
    qualities: [75, 80, 82, 90],
    remotePatterns,
    localPatterns: [
      { pathname: '/api/media/file/**' },
      { pathname: '/placeholders/**' },
      { pathname: '/demo/**' },
      { pathname: '/profile/**' },
      { pathname: '/panoramas/**' },
      { pathname: '/projects/**' },
    ],
    // SVG floor plans are rendered with <img>, never inlined, so scripts cannot run.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/decoders/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
