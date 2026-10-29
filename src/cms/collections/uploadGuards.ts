import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Server-side guard for uploads: extension allow-list + size limit.
 * Runs for regular uploads (req.file) and client-side direct uploads (data.filename/filesize).
 */
export const guardUpload =
  (opts: { extensions: string[]; maxBytes: number; label: string }): CollectionBeforeValidateHook =>
  ({ req, data }) => {
    const name = (req.file?.name ?? (data?.filename as string | undefined) ?? '').toLowerCase()
    const size = req.file?.size ?? (data?.filesize as number | undefined)
    if (name) {
      const ext = name.slice(name.lastIndexOf('.') + 1)
      if (!opts.extensions.includes(ext)) {
        throw new APIError(`${opts.label}: .${ext} files are not allowed. Use ${opts.extensions.map((e) => '.' + e).join(', ')}.`, 400)
      }
    }
    if (typeof size === 'number' && size > opts.maxBytes) {
      throw new APIError(`${opts.label}: file is ${(size / 1e6).toFixed(1)} MB — the limit is ${opts.maxBytes / 1e6} MB.`, 400)
    }
    return data
  }
