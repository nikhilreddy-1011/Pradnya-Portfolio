import type { UploadFieldSingleValidation } from 'payload'

/**
 * Normalise a relationship value to its ID. Works for MongoDB (24-hex string or a bson ObjectId —
 * note ObjectId has its own `.id` byte buffer, so it must be checked before the generic `.id`),
 * numeric IDs, and populated documents ({ id, … }).
 */
export function idOf(v: unknown): string | number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'string' || typeof v === 'number') return v
  if (typeof v === 'object') {
    const o = v as { toHexString?: () => string; id?: unknown }
    if (typeof o.toHexString === 'function') return o.toHexString()
    if (typeof o.id === 'string' || typeof o.id === 'number') return o.id
  }
  return null
}

type MediaDoc = { width?: number | null; height?: number | null; kind?: string | null } | null

/** A 360° image must be 2:1 (equirectangular) or it will look stretched in the viewer. */
export const panorama2to1 =
  (required: boolean): UploadFieldSingleValidation =>
  async (value, { req }) => {
    const id = idOf(value)
    if (id === null) return required ? 'Choose the 360° image.' : true
    try {
      const m = (await req.payload.findByID({ collection: 'media', id, depth: 0 })) as MediaDoc
      if (m?.width && m?.height && Math.abs(m.width / m.height - 2) > 0.02) {
        return `A 360° image must be 2:1 (width exactly twice the height). This one is ${m.width} × ${m.height}.`
      }
    } catch {
      /* media not readable here — don't block saving */
    }
    return true
  }

/**
 * Covers are ordinary renders. A 360° panorama (Media kind "panorama", or an image this project
 * already uses in `panorama360`) is rejected — shown flat it is curved and fisheye-looking.
 */
export const notAPanorama: UploadFieldSingleValidation = async (value, { req, data }) => {
  const id = idOf(value)
  if (id === null) return true
  const rows = (data as { panorama360?: { image?: unknown; imageStandard?: unknown }[] } | undefined)?.panorama360 ?? []
  if (rows.some((r) => String(idOf(r.image)) === String(id) || String(idOf(r.imageStandard)) === String(id))) {
    return 'This image is one of the project’s 360° views. Choose an ordinary (non-panoramic) render for the cover.'
  }
  try {
    const m = (await req.payload.findByID({ collection: 'media', id, depth: 0 })) as MediaDoc
    if (m?.kind === 'panorama') return 'This image is marked as a 360° panorama. Choose an ordinary (non-panoramic) render for the cover.'
  } catch {
    /* media not readable here — don't block saving */
  }
  return true
}
