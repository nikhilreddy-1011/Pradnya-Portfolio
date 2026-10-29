'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Component, type KeyboardEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Close, Expand, Minus, Plus, Reset } from '@/components/ui/Icons'
import { track } from '@/lib/analytics'
import { formatBytes } from '@/lib/media'
import { PanoramaController } from './panorama/controller'
import { useFullscreen } from './useFullscreen'
import type { PanoramaSource } from '@/lib/types'
import { planPanoramaLoad } from './panorama/sources'
import { getWebGLCaps } from './webgl'

// three.js + R3F are downloaded only when the viewer approaches the viewport.
const loadCanvas = () => import('./PanoramaCanvas')
const PanoramaCanvas = dynamic(loadCanvas, { ssr: false })

/** Catches a failed chunk load or a WebGL crash, so the viewer shows its own retry state. */
class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

type Status = 'idle' | 'loading' | 'decoding' | 'rendering' | 'ready' | 'error' | 'unsupported'
type Source = ImageBitmap | HTMLImageElement

export type Panorama360ViewerProps = {
  /** Available resolutions of the equirectangular (2:1) panorama (e.g. 4K + 8K). */
  sources?: PanoramaSource[]
  /** Shorthand for a single resolution. */
  src?: string
  /** Room name, e.g. "Kitchen" — shown in the viewer label. */
  label?: string
  /** Describes the space for screen readers. */
  alt?: string
  /** Starting direction in degrees: 0 = left edge of the image, 180 = centre. */
  initialYaw?: number
  /** Starting tilt in degrees: 0 = horizon, negative looks down. */
  initialPitch?: number
  enableCursorFollow?: boolean
  enableDrag?: boolean
  enableZoom?: boolean
  /** Analytics context only. */
  projectSlug?: string
}

/* ── Loading helpers ─────────────────────────────────────────────────────── */

// Downloaded panoramas are kept for the session, so switching rooms back and forth never
// re-downloads. (GPU textures are still released on unmount.)
const blobCache = new Map<string, Blob>()

async function fetchWithProgress(url: string, signal: AbortSignal, onProgress: (received: number, total: number) => void) {
  const cached = blobCache.get(url)
  if (cached) return cached
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const encoded = res.headers.get('content-encoding')
  const total = !encoded ? Number(res.headers.get('content-length')) || 0 : 0
  if (!res.body) {
    const blob = await res.blob()
    blobCache.set(url, blob)
    return blob
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  let lastPaint = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    const now = performance.now()
    if (now - lastPaint > 80) {
      lastPaint = now
      onProgress(received, total)
    }
  }
  onProgress(received, total || received)
  const blob = new Blob(chunks as BlobPart[], { type: res.headers.get('content-type') || 'image/jpeg' })
  blobCache.set(url, blob)
  return blob
}

/** Decode off the main thread where possible; cap the size for memory-constrained devices. */
async function decode(blob: Blob, maxDim: number): Promise<Source> {
  if (typeof createImageBitmap === 'function') {
    let bmp = await createImageBitmap(blob)
    if (bmp.width > maxDim) {
      const w = maxDim
      const h = Math.round((maxDim * bmp.height) / bmp.width)
      try {
        const small = await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' })
        if (small.width === w) {
          bmp.close()
          bmp = small
        } else small.close()
      } catch {
        /* resize options unsupported — three.js clamps to the GPU limit itself */
      }
    }
    return bmp
  }
  const url = URL.createObjectURL(blob)
  try {
    const img = new window.Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    // The decoded image stays usable after the object URL is revoked.
    URL.revokeObjectURL(url)
  }
}


type NavigatorExtras = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

/** Phones, small screens, low memory or data-saver → smaller texture budget and pixel ratio. */
function deviceProfile() {
  const n = navigator as NavigatorExtras
  const lowPower = Boolean(n.connection?.saveData || (n.deviceMemory !== undefined && n.deviceMemory <= 2))
  const constrained = lowPower || window.matchMedia('(max-width: 820px)').matches || (n.deviceMemory !== undefined && n.deviceMemory <= 4)
  return { lowPower, constrained }
}

/* ── Component ───────────────────────────────────────────────────────────── */

/**
 * Interactive 360° view of an equirectangular panorama.
 * Cursor-follow look-around, drag with a short glide, wheel / pinch / button zoom,
 * keyboard control, animated reset and fullscreen. Loads when it nears the viewport,
 * draws frames only while the camera moves, and pauses when scrolled away.
 */
export function Panorama360Viewer({
  sources,
  src,
  label,
  alt,
  initialYaw = 180,
  initialPitch = 0,
  enableCursorFollow = true,
  enableDrag = true,
  enableZoom = true,
  projectSlug,
}: Panorama360ViewerProps) {
  const frame = useRef<HTMLDivElement>(null)
  const { isFull, isPseudo, toggle: toggleFull } = useFullscreen(frame)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<{ received: number; total: number } | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [interacted, setInteracted] = useState(false)
  const [wheelHint, setWheelHint] = useState(false)
  const [env, setEnv] = useState({ touch: false, maxDpr: 1.5 })
  const [attempt, setAttempt] = useState(0)
  const [near, setNear] = useState(false)
  const engaged = useRef(false)
  const fullRef = useRef(false)
  fullRef.current = isFull
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const list = useMemo<PanoramaSource[]>(
    () => (sources?.length ? sources : src ? [{ kind: 'equirect', url: src }] : []),
    [sources, src],
  )
  const listKey = list.map((s) => s.url).join('|')
  // Smallest file: used for the blurred loading backdrop and the no-WebGL fallback.
  const smallest = useMemo(() => [...list].sort((a, b) => (a.width ?? Infinity) - (b.width ?? Infinity))[0], [list])

  const controller = useMemo(
    () =>
      new PanoramaController({
        initialYaw,
        initialPitch,
        cursorFollow: enableCursorFollow,
        drag: enableDrag,
        zoom: enableZoom,
        reducedMotion: false,
      }),
    // A new image or starting view is a new viewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listKey, initialYaw, initialPitch],
  )

  useEffect(() => {
    controller.onInteract = () => setInteracted(true)
  }, [controller])

  // Environment: reduced motion, touch, pixel-ratio budget.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(hover: none)').matches
    const { lowPower, constrained } = deviceProfile()
    controller.setOptions({ reducedMotion: reduced, cursorFollow: enableCursorFollow && !touch, drag: enableDrag, zoom: enableZoom })
    // Rendering is on demand (only while the view moves), so desktops can afford a sharp 2× canvas
    // for a high-resolution master; phones stay at 1.5×, low-power devices at 1×.
    const dpr = window.devicePixelRatio || 1
    setEnv({ touch, maxDpr: lowPower ? 1 : Math.min(constrained ? 1.5 : 2, dpr) })
  }, [controller, enableCursorFollow, enableDrag, enableZoom])

  // Load when the viewer approaches the viewport (and only once).
  useEffect(() => {
    const el = frame.current
    if (!el || near) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        setNear(true)
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  useEffect(() => {
    if (!near) return
    const caps = getWebGLCaps()
    if (!caps.supported || !list.length) return setStatus('unsupported')
    const plan = planPanoramaLoad(list, caps.maxTextureSize, deviceProfile().constrained)
    const ac = new AbortController()
    let decoded: Source | null = null
    setStatus('loading')
    loadCanvas().catch(() => setStatus('error')) // fetch the WebGL chunk in parallel with the image
    ;(async () => {
      try {
        // The original file goes to the GPU — never a thumbnail or an optimiser-transformed copy.
        const blob = await fetchWithProgress(plan.source.url, ac.signal, (received, total) => setProgress({ received, total }))
        if (ac.signal.aborted) return
        setStatus('decoding')
        decoded = await decode(blob, plan.maxDim)
        if (ac.signal.aborted) {
          if ('close' in decoded) decoded.close()
          return
        }
        controller.setTextureWidth(decoded.width)
        setSource(decoded)
        setStatus('rendering')
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('error')
      }
    })()
    return () => ac.abort()
    // `list` is represented by listKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, listKey, attempt])

  // Release the decoded bitmap when the viewer goes away.
  useEffect(() => () => {
    if (source && 'close' in source) source.close()
  }, [source])

  // Pause animation while scrolled out of view.
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => controller.setPaused(!e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [controller])

  // Wheel zoom — only once the visitor has engaged with the view (or ctrl/⌘ + scroll, trackpad
  // pinch, fullscreen). Otherwise the page scrolls normally and a hint explains how to zoom.
  useEffect(() => {
    const el = frame.current
    if (!el || !enableZoom) return
    const onWheel = (e: WheelEvent) => {
      if (status !== 'ready') return
      if (engaged.current || fullRef.current || e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY
        controller.wheel(e.ctrlKey ? px * 4 : px) // trackpad pinch reports small deltas
        return
      }
      setWheelHint(true)
      clearTimeout(hintTimer.current)
      hintTimer.current = setTimeout(() => setWheelHint(false), 1800)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [controller, enableZoom, status])

  useEffect(() => () => clearTimeout(hintTimer.current), [])

  /* Pointer input — coordinates relative to the viewer */
  const local = (e: PointerEvent) => {
    const r = frame.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const overUI = (e: PointerEvent) => Boolean((e.target as HTMLElement).closest('[data-pano-ui]'))

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (status !== 'ready' || overUI(e)) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    engaged.current = true
    frame.current?.focus({ preventScroll: true })
    const [x, y] = local(e)
    controller.pointerDown(e.pointerId, x, y, e.pointerType)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (status !== 'ready') return
    if (overUI(e) && !controller.isDragging) return // over the controls: cursor-follow simply pauses
    const [x, y] = local(e)
    controller.pointerMove(e.pointerId, x, y, e.pointerType)
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => controller.pointerUp(e.pointerId)
  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const [x, y] = local(e)
    controller.pointerEnter(x, y)
  }
  const onPointerLeave = () => {
    controller.pointerLeave()
    engaged.current = false
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (status !== 'ready' || e.target !== e.currentTarget) return
    const map: Record<string, () => void> = {
      ArrowLeft: () => controller.turn(-15, 0),
      ArrowRight: () => controller.turn(15, 0),
      ArrowUp: () => controller.turn(0, 8),
      ArrowDown: () => controller.turn(0, -8),
      '+': () => controller.zoomBy(1.25),
      '=': () => controller.zoomBy(1.25),
      '-': () => controller.zoomBy(0.8),
      '0': () => controller.reset(),
      Home: () => controller.reset(),
    }
    const fn = map[e.key]
    if (!fn) return
    e.preventDefault()
    setInteracted(true)
    fn()
  }

  const onReady = useCallback(() => {
    setStatus('ready')
    track('viewer_360_ready', { project: projectSlug ?? '', room: label ?? '' })
  }, [projectSlug, label])
  const onError = useCallback(() => {
    setSource(null)
    setStatus('error')
  }, [])

  const ready = status === 'ready'
  const pct = progress && progress.total ? Math.min(1, progress.received / progress.total) : null
  const name = label ? `${label} — 360° view` : '360° view'
  const helpId = useId()
  const posterPos = `${((((initialYaw % 360) + 360) % 360) / 360) * 100}% 50%`

  return (
    <div>
      <div
        ref={frame}
        className={`viewer pano select-none ${isPseudo ? 'is-pseudo-full' : ''} ${isFull ? '' : 'h-[min(125vw,72svh)] sm:h-[min(58vw,calc(100svh-7rem))]'} ${
          ready ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        role="application"
        aria-roledescription="360° viewer"
        aria-label={alt ? `${name}. ${alt}` : name}
        aria-describedby={helpId}
        tabIndex={ready ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => ready && e.preventDefault()}
      >
        {/* Loading backdrop: a tiny, blurred version of the panorama itself (a few KB). */}
        <div aria-hidden="true" className="pano-backdrop" style={{ opacity: ready ? 0 : 1 }}>
          {smallest && near && <Image src={smallest.url} alt="" fill sizes="96px" className="pano-backdrop-img" style={{ objectPosition: posterPos }} />}
        </div>

        {source && status !== 'error' && (
          <div className="absolute inset-0 transition-opacity duration-[900ms] ease-out" style={{ opacity: ready ? 1 : 0 }}>
            <CanvasBoundary key={attempt} onError={onError}>
              <PanoramaCanvas source={source} controller={controller} maxDpr={env.maxDpr} onReady={onReady} onError={onError} />
            </CanvasBoundary>
          </div>
        )}

        {/* Status */}
        {(status === 'idle' || status === 'loading' || status === 'decoding' || status === 'rendering') && (
          <div className="viewer-status" role="status" aria-live="polite">
            <p className="t-meta text-on-ink-muted">Explore the space</p>
            <p className="font-serif text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] leading-none">Loading 360° view…</p>
            <div className="progress-line" data-indeterminate={pct === null || status !== 'loading' ? '' : undefined} style={{ ['--p' as string]: pct ?? 0 }} />
            <p className="tabular text-[0.8125rem] text-on-ink-muted">
              {status === 'loading' && progress
                ? progress.total
                  ? `${formatBytes(progress.received)} of ${formatBytes(progress.total)}`
                  : formatBytes(progress.received)
                : ' '}
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="viewer-status" role="alert">
            <p className="max-w-sm font-serif text-[1.5rem] leading-snug">The 360° view could not be loaded.</p>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                setProgress(null)
                setAttempt((n) => n + 1)
              }}
            >
              Try again
            </button>
          </div>
        )}
        {status === 'unsupported' && (
          <>
            {smallest && <Image src={smallest.url} alt={alt || name} fill sizes="100vw" className="object-contain" />}
            <div className="absolute inset-x-0 bottom-0 z-[4] p-4 text-center">
              <p className="t-meta text-on-ink-muted">Interactive 360° isn’t available on this device — this is the full panorama, unwrapped.</p>
            </div>
          </>
        )}

        {/* Label + first-use hint */}
        {ready && (
          <div className="pointer-events-none absolute left-4 top-4 z-[5] sm:left-6 sm:top-5">
            <p className="t-meta pano-shadow">360° view{label ? ` · ${label}` : ''}</p>
            <p
              className="pano-shadow mt-1.5 text-[0.8125rem] text-on-ink transition-opacity duration-700"
              style={{ opacity: interacted ? 0 : 1 }}
              aria-hidden="true"
            >
              Drag to explore
            </p>
          </div>
        )}

        {wheelHint && ready && (
          <p className="pano-toast fade-in" role="status">
            Click the view first to zoom with scroll — or use + −
          </p>
        )}

        {/* Controls — small, grouped, bottom-right */}
        {ready && (
          <div className="viewer-bar bottom-3 right-3 sm:bottom-4 sm:right-4" role="toolbar" aria-label="360° view controls" data-pano-ui>
            {enableZoom && (
              <>
                <button type="button" className="viewer-btn" onClick={() => controller.zoomBy(0.8)} aria-label="Zoom out">
                  <Minus />
                </button>
                <button type="button" className="viewer-btn" onClick={() => controller.zoomBy(1.25)} aria-label="Zoom in">
                  <Plus />
                </button>
              </>
            )}
            <button type="button" className="viewer-btn" onClick={() => controller.reset()} aria-label="Reset view">
              <Reset /> <span className="max-sm:hidden">Reset</span>
            </button>
            <button type="button" className="viewer-btn" onClick={toggleFull} aria-pressed={isFull} aria-label={isFull ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFull ? <Close /> : <Expand />} <span className="max-sm:hidden">{isFull ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        )}
      </div>

      <p id={helpId} className="t-meta mt-4 text-on-ink-muted">
        {env.touch ? 'Drag to explore · Pinch to zoom' : 'Drag to explore · Move your cursor to look around'}
        <span className="sr-only"> Arrow keys turn the view, plus and minus zoom, 0 resets.</span>
      </p>
    </div>
  )
}
