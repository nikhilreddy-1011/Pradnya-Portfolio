import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Hostname of a configured origin (S3/R2 public bucket, CMS) so next/image may optimise its files. */
function remoteFrom(value: string | undefined) {
  if (!value) return null
  try {
    const u = new URL(value)
    return { protocol: u.protocol.replace(':', '') as 'http' | 'https', hostname: u.hostname, ...(u.port ? { port: u.port } : {}) }
  } catch {
    return null // ignore malformed env
  }
}

// Uploaded media lives in Vercel Blob (or R2/S3, Cloudinary). The CMS origin is allowed too so
// files served directly by the CMS (local-disk uploads in development) still work.
const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
]
for (const origin of [process.env.S3_PUBLIC_URL, process.env.CMS_URL]) {
  const pattern = remoteFrom(origin)
  if (pattern) remotePatterns.push(pattern)
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default nextConfig
