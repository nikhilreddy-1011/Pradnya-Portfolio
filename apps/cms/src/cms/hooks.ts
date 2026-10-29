import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/**
 * Tell the website (Vercel) that content changed so its static pages refresh immediately.
 * Fire-and-forget: a slow or sleeping website must never block or fail saving in the admin.
 * Skipped during seeding / CLI scripts and when WEB_URL / REVALIDATE_SECRET are not set.
 */
function notifyWebsite(context: Record<string, unknown> | undefined) {
  if (context?.disableRevalidate) return
  const site = (process.env.WEB_URL || '').replace(/\/$/, '')
  const secret = process.env.REVALIDATE_SECRET
  if (!site || !secret) return
  fetch(`${site}/api/revalidate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(8000),
  }).catch(() => {
    /* non-fatal: pages still refresh hourly */
  })
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  // Autosaved drafts are invisible to the public site — only publish / unpublish events matter.
  const draftOnly = doc?._status === 'draft' && previousDoc?._status !== 'published'
  if (!draftOnly) notifyWebsite(req.context)
  return doc
}
export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  notifyWebsite(req.context)
  return doc
}
export const revalidateGlobal: GlobalAfterChangeHook = async ({ doc, req }) => {
  notifyWebsite(req.context)
  return doc
}

export const slugify = (input: string) =>
  input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
