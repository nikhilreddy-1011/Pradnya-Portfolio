import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig, type Plugin } from 'payload'
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

/**
 * File storage: R2/S3 if configured, else Vercel Blob if configured, else local disk (dev).
 * Uploads go directly from the admin's browser to storage (clientUploads), so large renders
 * and GLB files never pass through the 4.5 MB serverless request limit.
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
}

/**
 * Database: MongoDB Atlas via @payloadcms/db-mongodb.
 * Documents and media *metadata* only — every image/panorama/GLB field is a reference (ObjectId)
 * to a Media record whose file lives in storage (Vercel Blob / R2 / local disk in dev).
 * No DATABASE_URL → no connection (the public site runs in CV-preview mode).
 *
 * Legacy: the previous PostgreSQL adapter is used ONLY for an explicit postgres:// URL. It is kept
 * solely until MongoDB is verified end-to-end on Atlas, then removed (migration plan, final step).
 */
function database() {
  const url = process.env.DATABASE_URL || ''
  if (/^postgres(ql)?:\/\//.test(url)) {
    return postgresAdapter({ pool: { connectionString: url }, push: process.env.NODE_ENV !== 'production' })
  }
  return mongooseAdapter({ url: url || false })
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
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
  db: database(),
  sharp,
  upload: { limits: { fileSize: 100_000_000 } },
  graphQL: { disable: true },
  plugins: storagePlugins,
})
