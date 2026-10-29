import { createHmac, timingSafeEqual } from 'node:crypto'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Draft preview, as a short handshake between the website (Vercel) and the CMS (Render):
 *
 *   1. Admin clicks "Preview" in the CMS  →  GET <site>/api/preview?slug=…
 *   2. No signature yet                   →  redirect to <cms>/api/preview-auth?slug=…
 *   3. The CMS checks the admin's own login session (cookie stays on the CMS origin) and redirects
 *      back with `exp` + `sig` = HMAC-SHA256(PREVIEW_SECRET, "slug.exp"), valid for 60 seconds.
 *   4. This route verifies the signature and enables Draft Mode for this browser only.
 *
 * Nothing secret travels in a URL: the signature covers only a slug and an expiry, and it can only
 * switch on Draft Mode — drafts are then fetched server-side with CMS_API_KEY.
 */
export const runtime = 'nodejs'

const SLUG = /^[a-z0-9-]{1,80}$/

function validSignature(slug: string, exp: string, sig: string, secret: string) {
  const expiry = Number(exp)
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(expiry) || expiry < now || expiry > now + 120) return false
  const expected = createHmac('sha256', secret).update(`${slug}.${exp}`).digest()
  const given = Buffer.from(sig, 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug') ?? ''
  if (!SLUG.test(slug)) return new Response('Invalid slug', { status: 400 })

  const secret = process.env.PREVIEW_SECRET
  const cmsUrl = (process.env.CMS_URL || '').replace(/\/$/, '')
  if (!secret || !cmsUrl) return new Response('Preview is not configured.', { status: 503 })

  const exp = url.searchParams.get('exp')
  const sig = url.searchParams.get('sig')
  if (!exp || !sig) redirect(`${cmsUrl}/api/preview-auth?slug=${encodeURIComponent(slug)}`)

  if (!validSignature(slug, exp, sig, secret)) return new Response('Preview link expired — open it again from the CMS.', { status: 401 })

  ;(await draftMode()).enable()
  redirect(`/work/${slug}`)
}
