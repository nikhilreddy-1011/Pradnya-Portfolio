'use client'

import { useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

/**
 * Admin-only: uploads large walkthrough videos straight from the browser to Cloudinary
 * using the official Upload Widget (chunked + resumable). The request is signed by
 * /api/cloudinary/sign, which checks the admin session — the API secret never leaves the server.
 */
declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        cb: (error: unknown, result: { event: string; info: { public_id: string; duration?: number } }) => void,
      ) => { open: () => void }
    }
  }
}

const WIDGET_SRC = 'https://upload-widget.cloudinary.com/latest/global/all.js'

export function CloudinaryUploadField() {
  const { setValue, value } = useField<string>({ path: 'cloudinaryPublicId' })
  const { setValue: setDuration } = useField<string>({ path: 'duration' })
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<string>('')
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  useEffect(() => {
    if (!cloudName) return
    if (window.cloudinary) return setReady(true)
    const s = document.createElement('script')
    s.src = WIDGET_SRC
    s.async = true
    s.onload = () => setReady(true)
    s.onerror = () => setStatus('Could not load the Cloudinary uploader. Check your connection.')
    document.body.appendChild(s)
  }, [cloudName])

  const open = useCallback(async () => {
    if (!window.cloudinary || !cloudName) return
    // Confirms the admin session and returns the (public) API key + optional signed preset.
    const cfgRes = await fetch('/api/cloudinary/sign', { credentials: 'include' })
    if (!cfgRes.ok) {
      setStatus('Not authorised to upload. Please log in again.')
      return
    }
    const cfg = (await cfgRes.json()) as { apiKey: string; uploadPreset?: string }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        apiKey: cfg.apiKey,
        ...(cfg.uploadPreset ? { uploadPreset: cfg.uploadPreset } : {}),
        uploadSignature: async (cb: (signature: string) => void, params: Record<string, unknown>) => {
          const res = await fetch('/api/cloudinary/sign', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params }),
          })
          if (!res.ok) {
            setStatus('Not authorised to upload. Please log in again.')
            return
          }
          const data = (await res.json()) as { signature: string }
          cb(data.signature)
        },
        resourceType: 'video',
        folder: 'portfolio/walkthroughs',
        sources: ['local'],
        multiple: false,
        maxFileSize: 2_000_000_000,
        clientAllowedFormats: ['mp4', 'mov', 'webm', 'm4v'],
        chunkSize: 20_000_000,
      },
      (error, result) => {
        if (error) {
          setStatus('Upload failed. Please try again.')
          return
        }
        if (result?.event === 'success') {
          setValue(result.info.public_id)
          if (result.info.duration) {
            const d = Math.round(result.info.duration)
            setDuration(`${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`)
          }
          setStatus('Uploaded. Save the document to keep it.')
        }
      },
    )
    widget.open()
  }, [cloudName, setValue, setDuration])

  if (!cloudName) {
    return (
      <p style={{ margin: '0 0 1.5rem', opacity: 0.75 }}>
        Cloudinary is not configured (set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET).
        You can still paste an existing public ID below.
      </p>
    )
  }

  return (
    <div style={{ margin: '0 0 1.5rem' }}>
      <button type="button" className="btn btn--style-secondary btn--size-medium" disabled={!ready} onClick={open}>
        {value ? 'Replace video on Cloudinary' : 'Upload video to Cloudinary'}
      </button>
      <p style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
        Large files upload in 20 MB chunks and resume if the connection drops. {status}
      </p>
    </div>
  )
}
