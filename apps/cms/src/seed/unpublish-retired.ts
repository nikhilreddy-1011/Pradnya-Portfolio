/**
 * Unpublishes projects that were retired from the public portfolio, through Payload (so access
 * control, versions and the "content changed" webhook all behave normally). Nothing is deleted:
 * the records stay in the admin as drafts, and their media is left untouched.
 *
 *   npm run unpublish:retired            # uses DATABASE_URL from .env (point it at Atlas)
 *
 * Safe to re-run — projects that are already drafts (or missing) are skipped.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const RETIRED_SLUGS = ['3bhk-residence', 'residential-interior']

const payload = await getPayload({ config })

for (const slug of RETIRED_SLUGS) {
  const found = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
  const doc = found.docs[0] as { id: string | number; title?: string; _status?: string } | undefined
  if (!doc) {
    payload.logger.info(`[unpublish] "${slug}": no such project — skipped`)
    continue
  }
  const published = await payload.find({ collection: 'projects', where: { slug: { equals: slug }, _status: { equals: 'published' } }, limit: 1, depth: 0 })
  if (published.docs.length === 0) {
    payload.logger.info(`[unpublish] "${slug}" (id ${doc.id}): already not published — skipped`)
    continue
  }
  await payload.update({ collection: 'projects', id: doc.id, data: { _status: 'draft' } as never })
  payload.logger.info(`[unpublish] "${slug}" (id ${doc.id}): unpublished — now a draft, hidden from the public site`)
}

// The About text used to say "…a French-inspired café and two residential interiors…" — i.e. it named
// the two retired projects. Fix that exact phrase in the stored profile (only if it is still there).
const OLD_PHRASE = '— a French-inspired café and two residential interiors —'
const NEW_PHRASE = '— including a French-inspired café —'
const profile = (await payload.findGlobal({ slug: 'profile', depth: 0 })) as { aboutBody?: string | null }
if (profile.aboutBody?.includes(OLD_PHRASE)) {
  await payload.updateGlobal({ slug: 'profile', data: { aboutBody: profile.aboutBody.replace(OLD_PHRASE, NEW_PHRASE) } as never })
  payload.logger.info('[unpublish] profile About text: removed the mention of the two retired projects')
} else {
  payload.logger.info('[unpublish] profile About text: no mention found — skipped')
}

// Let the fire-and-forget website-refresh webhook finish before the process exits.
await new Promise((resolve) => setTimeout(resolve, 4000))
process.exit(0)
