import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/content'

/** Draft preview — only for a logged-in admin session (no shared secrets in URLs). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug') ?? ''
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response('Invalid slug', { status: 400 })

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Log in to /admin to preview drafts.', { status: 401 })

  ;(await draftMode()).enable()
  redirect(`/work/${slug}`)
}
