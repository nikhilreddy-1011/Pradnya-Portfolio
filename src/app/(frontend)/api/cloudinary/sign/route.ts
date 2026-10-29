import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/content'

export const runtime = 'nodejs'

async function requireAdmin(req: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  return user
}

/** Public config for the upload widget — only after the admin session is verified. */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!process.env.CLOUDINARY_API_KEY) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 503 })
  return NextResponse.json({ apiKey: process.env.CLOUDINARY_API_KEY, uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined })
}

/**
 * Signs upload parameters (Cloudinary signature = SHA-1 of the sorted params + API secret).
 * The secret never leaves the server; uploads are restricted to the portfolio folder.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const secret = process.env.CLOUDINARY_API_SECRET
  if (!secret) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 503 })

  const { params } = (await req.json().catch(() => ({}))) as { params?: Record<string, unknown> }
  if (!params || typeof params !== 'object') return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const folder = String(params.folder ?? '')
  if (!folder.startsWith('portfolio/')) return NextResponse.json({ error: 'Uploads must go to the portfolio folder' }, { status: 400 })

  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '' && !['file', 'cloud_name', 'resource_type', 'api_key'].includes(k))
    .sort()
    .map((k) => `${k}=${Array.isArray(params[k]) ? (params[k] as unknown[]).join(',') : String(params[k])}`)
    .join('&')
  const signature = createHash('sha1').update(toSign + secret).digest('hex')
  return NextResponse.json({ signature })
}
