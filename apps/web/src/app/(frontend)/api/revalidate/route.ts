import { timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Called by the CMS (Render) after content is published, changed or deleted, so the statically
 * generated pages refresh immediately instead of waiting for the hourly revalidation.
 * Authenticated with a shared secret in the Authorization header (REVALIDATE_SECRET).
 */
export const runtime = 'nodejs'

function authorised(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const header = req.headers.get('authorization') ?? ''
  if (!secret || !header.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice(7))
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function POST(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  revalidateTag('cms', 'max')
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, at: new Date().toISOString() })
}
