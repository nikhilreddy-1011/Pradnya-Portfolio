/**
 * View models consumed by the public site. The CMS adapter (lib/content.ts) maps Payload
 * documents into these shapes, so UI components never depend on CMS internals.
 */

export type Img = {
  url: string
  alt: string
  width?: number
  height?: number
  focalX?: number // 0–100
  focalY?: number // 0–100
  caption?: string
  mimeType?: string
}

export type Credibility =
  | 'portfolio-coursework'
  | 'portfolio'
  | 'coursework'
  | 'concept'
  | 'site-study'
  | 'professional'
  | 'design-study'
  | 'portfolio-concept'
  | 'concept-render'

export type Category = { title: string; slug: string }

export type ProjectCard = {
  slug: string
  number: string // "01"
  title: string
  typology?: string
  category: Category | null
  credibility: Credibility
  area?: string
  year?: string
  location?: string
  summary: string
  tools: string[]
  cover: Img | null
  coverMobile: Img | null
  featured: boolean
  hasPlan: boolean
  hasModel: boolean
  hasVideo: boolean
}

export type Room = {
  name: string
  key?: string
  points: [number, number][] // percentages 0–100
  dimensions?: string
  description?: string
}

export type FloorPlan = {
  id: string
  title: string
  image: Img
  furnishedImage: Img | null
  note?: string
  rooms: Room[]
}

export type Vec3 = [number, number, number]

export type Model3D = {
  id: string
  title: string
  url: string
  filesize?: number
  poster: Img | null
  lite: { url: string; filesize?: number } | null
  buildSequence: boolean
  cameraPosition?: Vec3
  cameraTarget?: Vec3
  views: { key: string; label: string; position?: Vec3; target?: Vec3 }[]
  hotspots: { label: string; title: string; text?: string; position?: Vec3 }[]
  /** True for the generic demonstration model used in /lab. */
  demo?: boolean
}

export type Video = {
  id: string
  title: string
  kind: string
  provider: 'cloudinary' | 'file'
  cloudinaryPublicId?: string
  fileUrl?: string
  poster: Img | null
  captionsUrl?: string
  duration?: string
  aspect: string // "16/9"
}

export type MaterialUse = {
  name: string
  texture: Img | null
  tone?: string
  description?: string
  application?: string
  room?: string
}

/**
 * One resolution of an equirectangular (2:1) panorama. The viewer picks the largest source the
 * device can hold (GPU max texture size, memory, screen). `kind` leaves room for a future tiled /
 * multi-resolution format (e.g. cube-face tiles for > 8K masters) without changing callers.
 */
export type PanoramaSource = { kind: 'equirect'; url: string; width?: number; height?: number }

/** A 360° view of one room. Never used as a cover image — covers are ordinary renders. */
export type Panorama = {
  id: string
  label: string
  /** Optional one-line intro shown under the section title (e.g. what to look at). */
  description?: string
  /** The master image (alt text, dimensions). */
  image: Img
  /** All available resolutions, smallest first (always includes the master). */
  sources: PanoramaSource[]
  /** Degrees: 0 = left edge of the image, 180 = centre. */
  initialYaw: number
  /** Degrees: 0 = horizon, negative looks down. */
  initialPitch: number
}

export type GalleryItem = {
  image: Img
  /** Short description shown under the title. */
  caption?: string
  /** Professional display name of the image/space (shown as the title). Never a filename. */
  room?: string
  /** Optional stable anchor (e.g. /work/tv-units-media-walls#slatted-wood-tv-wall-floating-console). Defaults to a slug of `room`. */
  slug?: string
  layout: 'full' | 'half' | 'tall'
}

export type Project = ProjectCard & {
  conceptStatement?: string
  concept?: string
  brief?: string
  programme: string[]
  spacePlanning?: string
  process: { title: string; text?: string }[]
  designDetails: { title: string; text?: string; image: Img | null }[]
  materials: MaterialUse[]
  palette: { name: string; hex: string }[]
  gallery: GalleryItem[]
  beforeAfter: { before: Img; after: Img; caption?: string }[]
  floorPlans: FloorPlan[]
  panoramas: Panorama[]
  models: Model3D[]
  videos: Video[]
  seo:{ title?: string; description?: string; image: Img | null; noindex: boolean }
  updatedAt?: string
}

export type Profile = {
  name: string
  role: string
  statusLine?: string
  availability?: string
  photo: Img | null
  location?: string
  email?: string
  phone?: string
  cvUrl?: string
  socialLinks: { label: string; url: string }[]
  aboutHeadline?: string
  aboutIntro?: string
  aboutBody?: string
  transferable: { title: string; text?: string }[]
  strengths: string[]
  achievements: string[]
  languages: string[]
  skillGroups: { title: string; items: string[] }[]
  education: { title: string; institution?: string; year?: string; status?: string; isDesign?: boolean }[]
  experience: { role: string; organisation: string; start: string; end?: string; summary?: string }[]
  siteVisits: { count?: number; title?: string; text?: string; points: string[]; images: Img[] }
}

export type SiteSettings = {
  heroEyebrow: string
  heroHeadline: string
  heroImage: Img | null
  heroImageMobile: Img | null
  introText?: string
  processIntro?: string
  processSteps: { title: string; caption?: string; text?: string }[]
  contactHeadline: string
  contactText?: string
  projectTypes: string[]
  seoTitle?: string
  seoDescription?: string
  ogImage: Img | null
}
