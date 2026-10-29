import type { Img } from './types'

export const objectPosition = (img?: Img | null) =>
  `${img?.focalX ?? 50}% ${img?.focalY ?? 50}%`

export const isSvg = (img?: Img | null) =>
  Boolean(img && (img.mimeType === 'image/svg+xml' || img.url.toLowerCase().endsWith('.svg')))

export const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1e6) return `${Math.max(1, Math.round(bytes / 1e3))} KB`
  return `${(bytes / 1e6).toFixed(bytes < 1e7 ? 1 : 0)} MB`
}

/* ── Cloudinary video delivery ───────────────────────────────────────────── */
const cloud = () => process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

/** Adaptive bitrate HLS — Cloudinary picks the quality ladder (sp_auto). */
export const cloudinaryHls = (publicId: string) =>
  cloud() ? `https://res.cloudinary.com/${cloud()}/video/upload/sp_auto/${publicId}.m3u8` : undefined

/** Progressive fallback: best format + quality for the device, capped at 1920 wide. */
export const cloudinaryMp4 = (publicId: string) =>
  cloud() ? `https://res.cloudinary.com/${cloud()}/video/upload/f_auto:video,q_auto,w_1920,c_limit/${publicId}` : undefined

/** Poster frame straight from the video (used only if no poster image is set). */
export const cloudinaryPoster = (publicId: string) =>
  cloud() ? `https://res.cloudinary.com/${cloud()}/video/upload/so_2,f_auto,q_auto,w_1600/${publicId}.jpg` : undefined

/** Split a CMS textarea into paragraphs on blank lines. */
export const paragraphs = (text?: string) =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
