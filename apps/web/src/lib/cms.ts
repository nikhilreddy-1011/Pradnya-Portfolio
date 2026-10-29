import 'server-only'

/**
 * Minimal, server-only client for the Payload REST API hosted on Render.
 *
 *  - Public reads are unauthenticated: Payload's own access control returns published content only.
 *  - Drafts and inquiry creation use a least-privilege "service" API key (CMS_API_KEY). It is read
 *    from the server environment only and never reaches the browser.
 *  - Errors carry the HTTP status and path — never the response body, URL or credentials.
 */

const CMS_URL = (process.env.CMS_URL || '').replace(/\/$/, '')

export const cmsEnabled = Boolean(CMS_URL)

export class CmsError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
  ) {
    super(`CMS request failed (${status}) ${path.split('?')[0]}`)
    this.name = 'CmsError'
  }
}

type Options = {
  method?: 'GET' | 'POST'
  body?: unknown
  /** Draft preview: authenticated and never cached. */
  draft?: boolean
  /** Authenticated server-to-server call (e.g. creating an inquiry). */
  auth?: boolean
}

const TIMEOUT_MS = 20_000 // generous: a sleeping Render instance can take a while to wake up

export async function cms<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  if (!CMS_URL) throw new CmsError(0, path)
  const method = opts.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.draft || opts.auth) {
    const key = process.env.CMS_API_KEY
    if (!key) throw new CmsError(0, path)
    headers.Authorization = `users API-Key ${key}`
  }

  const uncached = method !== 'GET' || opts.draft || opts.auth
  const attempts = method === 'GET' ? 2 : 1
  let lastStatus = 0
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${CMS_URL}${path}`, {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        ...(uncached ? { cache: 'no-store' as const } : { next: { revalidate: 3600, tags: ['cms'] } }),
      })
      if (res.ok) return (await res.json()) as T
      lastStatus = res.status
      if (res.status < 500) break // 4xx will not improve on retry
    } catch {
      lastStatus = 0
    }
  }
  throw new CmsError(lastStatus, path)
}
