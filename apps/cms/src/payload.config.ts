import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { createHmac } from 'node:crypto'
import path from 'path'
import { buildConfig, type Endpoint, type Plugin } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './cms/collections/Categories'
import { Documents } from './cms/collections/Documents'
import { FloorPlans } from './cms/collections/FloorPlans'
import { Inquiries } from './cms/collections/Inquiries'
import { Materials } from './cms/collections/Materials'
import { Media } from './cms/collections/Media'
import { Models } from './cms/collections/Models'
import { Projects } from './cms/collections/Projects'
import { Users } from './cms/collections/Users'
import { Videos } from './cms/collections/Videos'
import { Profile } from './cms/globals/Profile'
import { SiteSettings } from './cms/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProd = process.env.NODE_ENV === 'production'
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
const trim = (v?: string) => (v || '').replace(/\/$/, '')

/** Public origin of THIS service (Render sets RENDER_EXTERNAL_URL automatically). */
const CMS_URL = trim(process.env.CMS_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL) || 'http://localhost:3001'
/** Public origin of the website (Vercel) — CORS, CSRF and the preview hand-off. */
const WEB_URL = trim(process.env.WEB_URL)

/**
 * File storage: R2/S3 if configured, else Vercel Blob. Uploads go directly from the admin's browser
 * to storage (clientUploads), so large renders and GLB files never pass through the CMS server.
 * Production never falls back to local disk — Render's filesystem is wiped on every deploy.
 */
const uploadSlugs = ['media', 'documents', 'models'] as const
const storagePlugins: Plugin[] = []

if (process.env.S3_BUCKET) {
  const publicBase = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')
  storagePlugins.push(
    s3Storage({
      bucket: process.env.S3_BUCKET,
      clientUploads: true,
      config: {
        endpoint: process.env.S3_ENDPOINT || undefined,
        region: process.env.S3_REGION || 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
      collections: Object.fromEntries(
        uploadSlugs.map((slug) => [
          slug,
          {
            prefix: slug,
            disablePayloadAccessControl: true as const,
            generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
              `${publicBase}/${prefix ? `${prefix}/` : ''}${filename}`,
          },
        ]),
      ),
    }),
  )
} else if (process.env.BLOB_READ_WRITE_TOKEN) {
  storagePlugins.push(
    vercelBlobStorage({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
      collections: Object.fromEntries(
        uploadSlugs.map((slug) => [slug, { prefix: slug, disablePayloadAccessControl: true as const }]),
      ),
    }),
  )
} else if (isProd && !isBuild && process.env.ALLOW_LOCAL_UPLOADS !== '1') {
  throw new Error(
    'No media storage configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) or S3_BUCKET — production must not store uploads on the local disk.',
  )
}

/**
 * Database: MongoDB Atlas via @payloadcms/db-mongodb. (PostgreSQL support was removed; the old
 * Postgres migrations are archived in /legacy.) Documents and media *metadata* only — every
 * image/panorama/GLB field references a Media record whose file lives in storage.
 */
const db = mongooseAdapter({
  url: process.env.DATABASE_URL || false,
  connectOptions: { serverSelectionTimeoutMS: 15_000 },
})

const SLUG = /^[a-z0-9-]{1,80}$/

/**
 * Step 3 of the draft-preview hand-off (see apps/web/src/app/(frontend)/api/preview/route.ts).
 * Runs on the CMS origin, so the admin's own login cookie identifies them. If they are signed in as
 * staff, we send them back to the website with a 60-second HMAC over (slug, expiry) — no secret and
 * no session ever appears in a URL, and the signature can only switch on Draft Mode.
 */
const previewAuth: Endpoint = {
  path: '/preview-auth',
  method: 'get',
  handler: async (req) => {
    const url = new URL(req.url ?? '', CMS_URL)
    const slug = url.searchParams.get('slug') ?? ''
    const secret = process.env.PREVIEW_SECRET
    if (!SLUG.test(slug)) return new Response('Invalid slug', { status: 400 })
    if (!secret || !WEB_URL) return new Response('Preview is not configured.', { status: 503 })

    const role = (req.user as { role?: string } | null)?.role
    if (!req.user || role === 'service') {
      const back = `/api/preview-auth?slug=${encodeURIComponent(slug)}`
      return Response.redirect(`${CMS_URL}/admin/login?redirect=${encodeURIComponent(back)}`, 302)
    }

    const exp = Math.floor(Date.now() / 1000) + 60
    const sig = createHmac('sha256', secret).update(`${slug}.${exp}`).digest('hex')
    return Response.redirect(`${WEB_URL}/api/preview?slug=${encodeURIComponent(slug)}&exp=${exp}&sig=${sig}`, 302)
  },
}

/** Unauthenticated liveness probe for Render's health check. Reveals nothing but the adapter name. */
const health: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => Response.json({ ok: true, database: req.payload.db.name }),
}

export default buildConfig({
  serverURL: CMS_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Pradnya Salunkhe — Admin' },
    components: {
      graphics: {
        Logo: '@/components/admin/Brand#Logo',
        Icon: '@/components/admin/Brand#Icon',
      },
    },
  },
  collections: [Projects, Categories, Media, FloorPlans, Models, Videos, Materials, Documents, Inquiries, Users],
  globals: [Profile, SiteSettings],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db,
  sharp,
  cors: WEB_URL ? [WEB_URL] : [],
  csrf: [CMS_URL, ...(WEB_URL ? [WEB_URL] : [])],
  endpoints: [health, previewAuth],
  upload: { limits: { fileSize: 100_000_000 } },
  graphQL: { disable: true },
  plugins: storagePlugins,
  onInit: async (payload) => {
    payload.logger.info(`[cms] database adapter: ${payload.db.name}; storage: ${process.env.S3_BUCKET ? 's3' : process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-disk (dev)'}`)
  },
})
