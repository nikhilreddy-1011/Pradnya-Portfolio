/**
 * Content adapter — the only place that talks to the CMS.
 * Maps Payload documents (fetched over HTTPS from the CMS service on Render) to the view
 * models in lib/types.ts. The public site never imports Payload or touches the database.
 *
 * With no CMS_URL the site renders from src/content/cv.ts (CV preview mode). If the CMS is
 * unreachable the same content is used as a fallback so the site never shows an error page.
 */
import 'server-only'

import { draftMode } from 'next/headers'
import { cache } from 'react'

import { CmsError, cms, cmsEnabled } from './cms'

import { cvProfile, cvProjects, cvSettings } from '@/content/cv'
import type {
  Category,
  FloorPlan,
  Img,
  Model3D,
  PanoramaSource,
  Profile,
  Project,
  ProjectCard,
  SiteSettings,
  Vec3,
  Video,
} from './types'

export { cmsEnabled }

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>

/** Payload's paginated REST envelope. */
type Paginated = { docs: Doc[] }

/** Log a CMS failure without leaking URLs, keys or response bodies. */
function reportCmsFailure(what: string, e: unknown) {
  const status = e instanceof CmsError ? e.status : 'network'
  console.error(`[cms] ${what} unavailable (${status}) — serving built-in content`)
}

async function isDraft() {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false // called outside a request (e.g. generateStaticParams)
  }
}

/* ── Mappers ─────────────────────────────────────────────────────────────── */

const obj = (v: unknown): Doc | null => (v && typeof v === 'object' ? (v as Doc) : null)

/**
 * Payload returns absolute URLs (Vercel Blob / R2 / Cloudinary in production). If a URL points at
 * this site's own origin it is made relative so next/image can serve it from /public; everything
 * else — including the CMS origin in local development — is left untouched.
 */
const SITE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || '').origin
  } catch {
    return ''
  }
})()
export function localiseUrl(url: string): string {
  if (!SITE_ORIGIN || url.startsWith('/')) return url
  try {
    const u = new URL(url)
    return u.origin === SITE_ORIGIN ? `${u.pathname}${u.search}` : url
  } catch {
    return url
  }
}

export function toImg(value: unknown): Img | null {
  const m = obj(value)
  if (!m?.url) return null
  return {
    url: localiseUrl(m.url),
    alt: m.alt ?? '',
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    focalX: m.focalX ?? undefined,
    focalY: m.focalY ?? undefined,
    caption: m.caption ?? undefined,
    mimeType: m.mimeType ?? undefined,
  }
}

/** Master + optional lighter version → resolution list, smallest first. */
export function panoramaSources(...imgs: (Img | null | undefined)[]): PanoramaSource[] {
  return imgs
    .filter((m): m is Img => Boolean(m?.url))
    .map((m) => ({ kind: 'equirect' as const, url: m.url, width: m.width, height: m.height }))
    .sort((a, b) => (a.width ?? Infinity) - (b.width ?? Infinity))
}

const items = (arr: unknown): string[] =>
  Array.isArray(arr) ? arr.map((r) => (typeof r === 'string' ? r : r?.item)).filter(Boolean) : []

const vec3 = (s?: string | null): Vec3 | undefined => {
  if (!s) return undefined
  const n = s.split(',').map((x) => Number(x.trim()))
  return n.length === 3 && n.every(Number.isFinite) ? (n as Vec3) : undefined
}

export const parsePoints = (s?: string | null): [number, number][] =>
  (s ?? '')
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number) as [number, number])
    .filter((p) => p.length === 2 && p.every(Number.isFinite))

const toCategory = (v: unknown): Category | null => {
  const c = obj(v)
  return c?.slug ? { title: c.title, slug: c.slug } : null
}

function toFloorPlan(v: unknown): FloorPlan | null {
  const f = obj(v)
  const image = toImg(f?.image)
  if (!f || !image) return null
  return {
    id: String(f.id),
    title: f.title ?? 'Floor plan',
    image,
    furnishedImage: toImg(f.furnishedImage),
    note: f.note ?? undefined,
    rooms: (f.rooms ?? [])
      .map((r: Doc) => ({
        name: r.name,
        key: r.key ?? undefined,
        points: parsePoints(r.points),
        dimensions: r.dimensions ?? undefined,
        description: r.description ?? undefined,
      }))
      .filter((r: { points: unknown[] }) => r.points.length >= 3),
  }
}

function toModel(v: unknown): Model3D | null {
  const m = obj(v)
  if (!m?.url) return null
  const lite = obj(m.lite)
  return {
    id: String(m.id),
    title: m.title ?? '3D model',
    url: m.url,
    filesize: m.filesize ?? undefined,
    poster: toImg(m.poster),
    lite: lite?.url ? { url: lite.url, filesize: lite.filesize ?? undefined } : null,
    buildSequence: m.buildSequence !== false,
    cameraPosition: vec3(m.cameraPosition),
    cameraTarget: vec3(m.cameraTarget),
    views: (m.views ?? []).map((w: Doc) => ({ key: w.key, label: w.label, position: vec3(w.position), target: vec3(w.target) })),
    hotspots: (m.hotspots ?? []).map((h: Doc) => ({ label: h.label, title: h.title, text: h.text ?? undefined, position: vec3(h.position) })),
  }
}

function toVideo(v: unknown): Video | null {
  const d = obj(v)
  if (!d) return null
  const fileUrl = obj(d.file)?.url as string | undefined
  if (d.provider === 'cloudinary' ? !d.cloudinaryPublicId : !fileUrl) return null
  return {
    id: String(d.id),
    title: d.title,
    kind: d.kind ?? 'walkthrough',
    provider: d.provider,
    cloudinaryPublicId: d.cloudinaryPublicId ?? undefined,
    fileUrl,
    poster: toImg(d.poster),
    captionsUrl: obj(d.captions)?.url ?? undefined,
    duration: d.duration ?? undefined,
    aspect: d.aspect ?? '16/9',
  }
}

export function toProject(d: Doc, index: number): Project {
  const floorPlans = (d.floorPlans ?? []).map(toFloorPlan).filter(Boolean) as FloorPlan[]
  const models = (d.models ?? []).map(toModel).filter(Boolean) as Model3D[]
  const videos = (d.videos ?? []).map(toVideo).filter(Boolean) as Video[]
  return {
    slug: d.slug,
    number: String(index + 1).padStart(2, '0'),
    title: d.title,
    typology: d.typology ?? undefined,
    category: toCategory(d.category),
    credibility: d.credibility ?? 'portfolio',
    area: d.area ?? undefined,
    year: d.year ?? undefined,
    location: d.location ?? undefined,
    summary: d.summary ?? '',
    tools: Array.isArray(d.tools) ? d.tools : [],
    cover: toImg(d.coverImage),
    coverMobile: toImg(d.coverImageMobile),
    featured: Boolean(d.featured),
    hasPlan: floorPlans.length > 0,
    hasModel: models.length > 0,
    hasVideo: videos.length > 0,
    conceptStatement: d.conceptStatement ?? undefined,
    concept: d.concept ?? undefined,
    brief: d.brief ?? undefined,
    programme: items(d.programme),
    spacePlanning: d.spacePlanning ?? undefined,
    process: (d.process ?? []).map((p: Doc) => ({ title: p.title, text: p.text ?? undefined })),
    designDetails: (d.designDetails ?? []).map((p: Doc) => ({ title: p.title, text: p.text ?? undefined, image: toImg(p.image) })),
    materials: (d.materials ?? [])
      .map((row: Doc) => {
        const m = obj(row.material)
        if (!m) return null
        return {
          name: m.name,
          texture: toImg(m.texture),
          tone: m.tone ?? undefined,
          description: m.description ?? undefined,
          application: row.application ?? undefined,
          room: row.room ?? undefined,
        }
      })
      .filter(Boolean),
    palette: (d.palette ?? []).map((p: Doc) => ({ name: p.name, hex: p.hex })),
    gallery: (d.gallery ?? [])
      .map((g: Doc) => {
        const image = toImg(g.image)
        return image ? { image, caption: g.caption ?? undefined, room: g.room ?? undefined, slug: undefined, layout: g.layout ?? 'half' } : null
      })
      .filter(Boolean),
    beforeAfter: (d.beforeAfter ?? [])
      .map((b: Doc) => {
        const before = toImg(b.before)
        const after = toImg(b.after)
        return before && after ? { before, after, caption: b.caption ?? undefined } : null
      })
      .filter(Boolean),
    floorPlans,
    panoramas: (d.panorama360 ?? [])
      .map((row: Doc, i: number) => {
        const image = toImg(row.image)
        if (!image) return null
        const standard = toImg(row.imageStandard)
        return {
          id: String(row.id ?? i),
          label: row.label ?? '',
          description: row.description ?? undefined,
          image,
          sources: panoramaSources(image, standard),
          initialYaw: typeof row.initialYaw === 'number' ? row.initialYaw : 180,
          initialPitch: typeof row.initialPitch === 'number' ? row.initialPitch : 0,
        }
      })
      .filter(Boolean),
    models,
    videos,
    seo: {
      title: d.seo?.title ?? undefined,
      description: d.seo?.description ?? undefined,
      image: toImg(d.seo?.image),
      noindex: Boolean(d.seo?.noindex),
    },
    updatedAt: d.updatedAt,
  }
}

export const toCard = (p: Project): ProjectCard => ({
  slug: p.slug,
  number: p.number,
  title: p.title,
  typology: p.typology,
  category: p.category,
  credibility: p.credibility,
  area: p.area,
  year: p.year,
  location: p.location,
  summary: p.summary,
  tools: p.tools,
  cover: p.cover,
  coverMobile: p.coverMobile,
  featured: p.featured,
  hasPlan: p.hasPlan,
  hasModel: p.hasModel,
  hasVideo: p.hasVideo,
})

/* ── Queries ─────────────────────────────────────────────────────────────── */

/** All projects visible to the current request (published, or drafts in preview mode). */
export const getAllProjects = cache(async (): Promise<Project[]> => {
  if (!cmsEnabled) return cvProjects
  const draft = await isDraft()
  const query = new URLSearchParams({ depth: '2', limit: '200', sort: 'order,createdAt' })
  if (draft) query.set('draft', 'true')
  else query.set('where[_status][equals]', 'published')
  try {
    const res = await cms<Paginated>(`/api/projects?${query}`, { draft })
    return res.docs.map((d, i) => toProject(d, i))
  } catch (e) {
    reportCmsFailure('projects', e)
    return cvProjects
  }
})

/** Projects shown in lists (archive, home, sitemap) — unlisted (noindex) ones are excluded. */
export async function getListedProjects(): Promise<ProjectCard[]> {
  return (await getAllProjects()).filter((p) => !p.seo.noindex).map(toCard)
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = (await getAllProjects()).filter((p) => !p.seo.noindex)
  const featured = all.filter((p) => p.featured)
  return featured.length ? featured : all.slice(0, 3)
}

/** Same-category projects first, then the rest — never the project itself. */
function relatedTo(listed: Project[], current: Project, max = 3): ProjectCard[] {
  const others = listed.filter((p) => p.slug !== current.slug)
  const same = others.filter((p) => p.category?.slug && p.category.slug === current.category?.slug)
  const rest = others.filter((p) => !same.includes(p))
  // Rotate so the list starts after the current project — a stable, varied "related" set.
  const start = listed.findIndex((p) => p.slug === current.slug)
  const order = (xs: Project[]) => [...xs].sort((a, b) => ((listed.indexOf(a) - start + listed.length) % listed.length) - ((listed.indexOf(b) - start + listed.length) % listed.length))
  return [...order(same), ...order(rest)].slice(0, max).map(toCard)
}

export async function getProject(slug: string) {
  const all = await getAllProjects()
  const index = all.findIndex((p) => p.slug === slug)
  if (index === -1) return null
  const listed = all.filter((p) => !p.seo.noindex)
  const pos = listed.findIndex((p) => p.slug === slug)
  const next = listed.length > 1 ? listed[(pos + 1) % listed.length] : null
  return { project: all[index], next: next && next.slug !== slug ? toCard(next) : null, related: relatedTo(listed, all[index]) }
}

export async function getCategories(): Promise<Category[]> {
  const projects = await getListedProjects()
  const seen = new Map<string, Category>()
  for (const p of projects) if (p.category && !seen.has(p.category.slug)) seen.set(p.category.slug, p.category)
  return [...seen.values()]
}

export const getProfile = cache(async (): Promise<Profile> => {
  if (!cmsEnabled) return cvProfile
  let g: Doc
  try {
    g = await cms<Doc>('/api/globals/profile?depth=1')
  } catch (e) {
    reportCmsFailure('profile', e)
    return cvProfile
  }
  return {
    name: g.name || cvProfile.name,
    role: g.role || cvProfile.role,
    statusLine: g.statusLine ?? undefined,
    availability: g.availability ?? undefined,
    photo: toImg(g.photo),
    location: g.location ?? undefined,
    email: g.email ?? undefined,
    phone: g.phone ?? undefined,
    cvUrl: obj(g.cv)?.url ?? undefined,
    socialLinks: (g.socialLinks ?? []).filter((l: Doc) => l.url && l.label),
    aboutHeadline: g.aboutHeadline ?? undefined,
    aboutIntro: g.aboutIntro ?? undefined,
    aboutBody: g.aboutBody ?? undefined,
    transferable: (g.transferable ?? []).map((t: Doc) => ({ title: t.title, text: t.text ?? undefined })),
    strengths: items(g.strengths),
    achievements: items(g.achievements),
    languages: items(g.languages),
    skillGroups: (g.skillGroups ?? []).map((s: Doc) => ({ title: s.title, items: items(s.items) })),
    education: (g.education ?? []).map((e: Doc) => ({
      title: e.title,
      institution: e.institution ?? undefined,
      year: e.year ?? undefined,
      status: e.status ?? undefined,
      isDesign: Boolean(e.isDesign),
    })),
    experience: (g.experience ?? []).map((e: Doc) => ({
      role: e.role,
      organisation: e.organisation,
      start: e.start,
      end: e.end ?? undefined,
      summary: e.summary ?? undefined,
    })),
    siteVisits: {
      count: g.siteVisits?.count ?? undefined,
      title: g.siteVisits?.title ?? undefined,
      text: g.siteVisits?.text ?? undefined,
      points: items(g.siteVisits?.points),
      images: (g.siteVisits?.images ?? []).map((r: Doc) => toImg(r.image)).filter(Boolean),
    },
  }
})

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!cmsEnabled) return cvSettings
  let g: Doc
  try {
    g = await cms<Doc>('/api/globals/site-settings?depth=1')
  } catch (e) {
    reportCmsFailure('site settings', e)
    return cvSettings
  }
  return {
    heroEyebrow: g.heroEyebrow || cvSettings.heroEyebrow,
    heroHeadline: g.heroHeadline || cvSettings.heroHeadline,
    heroImage: toImg(g.heroImage),
    heroImageMobile: toImg(g.heroImageMobile),
    introText: g.introText ?? undefined,
    processIntro: g.processIntro ?? undefined,
    processSteps: (g.processSteps ?? []).map((s: Doc) => ({ title: s.title, caption: s.caption ?? undefined, text: s.text ?? undefined })),
    contactHeadline: g.contactHeadline || cvSettings.contactHeadline,
    contactText: g.contactText ?? undefined,
    projectTypes: items(g.projectTypes).length ? items(g.projectTypes) : cvSettings.projectTypes,
    seoTitle: g.seoTitle ?? undefined,
    seoDescription: g.seoDescription ?? undefined,
    ogImage: toImg(g.ogImage),
  }
})

/**
 * Used by /api/contact to store inquiries. Public visitors cannot create inquiries in the CMS;
 * this server-side call authenticates with a least-privilege "service" API key.
 */
export async function saveInquiry(data: { name: string; email: string; phone?: string; projectType?: string; message: string; page?: string; userAgent?: string }) {
  if (!cmsEnabled) return false
  await cms('/api/inquiries', {
    method: 'POST',
    auth: true,
    body: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      projectType: data.projectType,
      message: data.message,
      status: 'new',
      meta: { page: data.page, userAgent: data.userAgent },
    },
  })
  return true
}
