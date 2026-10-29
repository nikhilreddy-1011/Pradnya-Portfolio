'use client'

import { useEffect, useRef, useState } from 'react'

import { Play } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import { track } from '@/lib/analytics'
import { cloudinaryHls, cloudinaryMp4, cloudinaryPoster } from '@/lib/media'
import type { Video } from '@/lib/types'

type HlsInstance = { destroy: () => void }

/** Safari/iOS play HLS natively; Chrome on macOS claims support but stalls, so detect real Safari. */
const isNativeHlsSafari = () => {
  const ua = navigator.userAgent
  return /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua)
}

/**
 * Poster-first video: nothing but the poster downloads until the visitor presses play.
 * Cloudinary videos stream adaptively (HLS, sp_auto) via a lazily imported hls.js; MP4 fallback.
 */
export function WalkthroughPlayer({ video, projectSlug }: { video: Video; projectSlug: string }) {
  const [state, setState] = useState<'poster' | 'loading' | 'playing' | 'error'>('poster')
  const ref = useRef<HTMLVideoElement>(null)
  const hls = useRef<HlsInstance | null>(null)

  useEffect(() => () => hls.current?.destroy(), [])

  const posterUrl = !video.poster && video.cloudinaryPublicId ? cloudinaryPoster(video.cloudinaryPublicId) : undefined

  const start = async () => {
    setState('loading')
    track('walkthrough_played', { project: projectSlug, video: video.title })
    // Wait a tick so the <video> element is mounted.
    await new Promise((r) => requestAnimationFrame(r))
    const el = ref.current
    if (!el) return
    try {
      if (video.provider === 'cloudinary' && video.cloudinaryPublicId) {
        const hlsUrl = cloudinaryHls(video.cloudinaryPublicId)
        const mp4 = cloudinaryMp4(video.cloudinaryPublicId)
        if (!hlsUrl || !mp4) throw new Error('Cloudinary not configured')
        if (isNativeHlsSafari() && el.canPlayType('application/vnd.apple.mpegurl')) {
          el.src = hlsUrl
        } else {
          const { default: Hls } = await import('hls.js')
          if (Hls.isSupported()) {
            const h = new Hls({ capLevelToPlayerSize: true, startLevel: -1 })
            h.loadSource(hlsUrl)
            h.attachMedia(el)
            h.on(Hls.Events.ERROR, (_e, data) => {
              if (data.fatal) {
                h.destroy()
                el.src = mp4 // progressive fallback
              }
            })
            hls.current = h
          } else {
            el.src = mp4
          }
        }
      } else if (video.fileUrl) {
        el.src = video.fileUrl
      } else throw new Error('No source')
      await el.play()
      setState('playing')
    } catch {
      // Autoplay with sound may be blocked — show native controls rather than failing.
      if (el.src || hls.current) setState('playing')
      else setState('error')
    }
  }

  return (
    <figure>
      <div className="frame relative bg-ink" style={{ aspectRatio: video.aspect.replace('/', ' / ') }}>
        {state !== 'playing' && (
          <div className="absolute inset-0">
            {video.poster ? (
              <Picture img={video.poster} ink sizes="(min-width: 1440px) 1340px, 100vw" />
            ) : posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <Picture img={null} ink sizes="100vw" placeholderLabel="Poster frame — to be added" />
            )}
          </div>
        )}

        {state !== 'poster' && (
          <video
            ref={ref}
            className="absolute inset-0 h-full w-full bg-ink object-contain"
            controls
            playsInline
            preload="none"
            crossOrigin={video.captionsUrl ? 'anonymous' : undefined}
            onError={() => setState('error')}
            onPlaying={() => setState('playing')}
            aria-label={video.title}
          >
            {video.captionsUrl && <track kind="captions" src={video.captionsUrl} srcLang="en" label="English" default />}
          </video>
        )}

        {state === 'poster' && (
          <button type="button" onClick={start} className="group absolute inset-0 grid place-items-center text-on-ink" aria-label={`Play ${video.title}${video.duration ? `, ${video.duration}` : ''}`}>
            <span className="flex items-center gap-4 border border-[rgb(240_235_225/0.6)] bg-[rgb(22_22_20/0.55)] px-6 py-4 backdrop-blur-sm transition-colors duration-300 group-hover:bg-[var(--color-on-ink)] group-hover:text-ink">
              <Play />
              <span className="t-ui">Watch {video.kind === 'flythrough' ? 'flythrough' : 'walkthrough'}</span>
              {video.duration && <span className="t-ui tabular opacity-70">{video.duration}</span>}
            </span>
          </button>
        )}
        {state === 'loading' && (
          <div className="viewer-status pointer-events-none" role="status">
            <p className="t-meta text-on-ink">Preparing walkthrough…</p>
            <div className="progress-line" data-indeterminate="" />
          </div>
        )}
        {state === 'error' && (
          <div className="viewer-status bg-[rgb(22_22_20/0.7)] text-on-ink" role="alert">
            <p className="font-serif text-[1.5rem]">This walkthrough can’t be played right now.</p>
            <a href="#gallery" className="btn btn-light">
              View the renders
            </a>
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex justify-between gap-4">
        <span className="t-meta">{video.title}</span>
        {video.duration && <span className="t-meta tabular text-muted">{video.duration}</span>}
      </figcaption>
    </figure>
  )
}
