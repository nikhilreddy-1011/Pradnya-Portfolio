/**
 * Seeds the CMS with CV-derived content. Nothing is duplicated (records are matched by slug / name)
 * and uploaded media is never touched.
 *
 *   npm run seed
 *
 * SAFETY: if the database already holds projects the script stops without changing anything, so it
 * can never overwrite text you have edited in the admin. Set SEED_FORCE=1 to deliberately re-apply
 * the CV content (existing records with the same slug/name are then overwritten).
 *
 * Optionally creates the first admin if SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD are set
 * (otherwise create it at /admin on first visit).
 */
import { getPayload } from 'payload'

import config from '../payload.config'
import { cvCategories, cvMaterials, cvProfile, cvProjects, cvSettings } from './data/cv'

const payload = await getPayload({ config })
const context = { disableRevalidate: true }

const existing = await payload.count({ collection: 'projects' })
if (existing.totalDocs > 0 && process.env.SEED_FORCE !== '1') {
  payload.logger.warn(`Database already has ${existing.totalDocs} project(s) — nothing seeded. Set SEED_FORCE=1 to overwrite them with the CV content.`)
  process.exit(0)
}

const list = (arr: string[]) => arr.map((item) => ({ item }))

async function upsert(collection: 'categories' | 'materials' | 'projects', field: string, value: string, data: Record<string, unknown>) {
  const found = await payload.find({ collection, where: { [field]: { equals: value } }, limit: 1, draft: true, depth: 0 })
  if (found.docs[0]) {
    return payload.update({ collection, id: found.docs[0].id, data, context, draft: false } as never)
  }
  return payload.create({ collection, data, context } as never)
}

// 1. Admin user (optional)
if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
  const users = await payload.find({ collection: 'users', limit: 1 })
  if (users.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, name: 'Admin', role: 'admin' } as never,
    })
    payload.logger.info('Created admin user')
  }
}

// 2. Categories
const categoryIds: Record<string, string | number> = {}
for (const c of cvCategories) {
  const doc = (await upsert('categories', 'slug', c.slug, c)) as { id: string | number }
  categoryIds[c.slug] = doc.id
}

// 3. Material library
const materialIds: Record<string, string | number> = {}
for (const m of cvMaterials) {
  const doc = (await upsert('materials', 'name', m.name, m)) as { id: string | number }
  materialIds[m.name] = doc.id
}

// 4. Projects (published — they are real coursework, clearly labelled)
for (const [i, p] of cvProjects.entries()) {
  await upsert('projects', 'slug', p.slug, {
    title: p.title,
    slug: p.slug,
    featured: p.featured,
    order: (i + 1) * 10,
    category: p.category ? categoryIds[p.category.slug] : undefined,
    credibility: p.credibility,
    typology: p.typology,
    area: p.area,
    year: p.year,
    location: p.location,
    summary: p.summary,
    tools: p.tools,
    conceptStatement: p.conceptStatement,
    concept: p.concept,
    brief: p.brief,
    programme: list(p.programme),
    spacePlanning: p.spacePlanning,
    designDetails: p.designDetails.map(({ title, text }) => ({ title, text })),
    materials: p.materials
      .filter((m) => materialIds[m.name])
      .map((m) => ({ material: materialIds[m.name], application: m.application, room: m.room })),
    _status: 'published',
  })
}

// 5. Globals
await payload.updateGlobal({
  slug: 'profile',
  context,
  data: {
    name: cvProfile.name,
    role: cvProfile.role,
    statusLine: cvProfile.statusLine,
    availability: cvProfile.availability,
    location: cvProfile.location,
    email: cvProfile.email,
    phone: cvProfile.phone,
    aboutHeadline: cvProfile.aboutHeadline,
    aboutIntro: cvProfile.aboutIntro,
    aboutBody: cvProfile.aboutBody,
    transferable: cvProfile.transferable,
    strengths: list(cvProfile.strengths),
    achievements: list(cvProfile.achievements),
    languages: list(cvProfile.languages),
    skillGroups: cvProfile.skillGroups.map((g) => ({ title: g.title, items: list(g.items) })),
    education: cvProfile.education,
    experience: cvProfile.experience,
    siteVisits: {
      count: cvProfile.siteVisits.count,
      title: cvProfile.siteVisits.title,
      text: cvProfile.siteVisits.text,
      points: list(cvProfile.siteVisits.points),
    },
  } as never,
})

await payload.updateGlobal({
  slug: 'site-settings',
  context,
  data: {
    heroEyebrow: cvSettings.heroEyebrow,
    heroHeadline: cvSettings.heroHeadline,
    introText: cvSettings.introText,
    processIntro: cvSettings.processIntro,
    processSteps: cvSettings.processSteps,
    contactHeadline: cvSettings.contactHeadline,
    contactText: cvSettings.contactText,
    projectTypes: list(cvSettings.projectTypes),
    seoTitle: cvSettings.seoTitle,
    seoDescription: cvSettings.seoDescription,
  } as never,
})

payload.logger.info('Seed complete — CV content loaded. Upload the portrait, renders and plans in /admin.')
process.exit(0)
