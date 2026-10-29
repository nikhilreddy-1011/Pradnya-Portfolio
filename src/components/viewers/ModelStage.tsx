'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Chevron, Close, Cube, Expand, Layers, Minus, Orbit, Play, Plus, Reset } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import { track } from '@/lib/analytics'
import { formatBytes } from '@/lib/media'
import type { Model3D } from '@/lib/types'
import type { SceneInfo, ViewRequest } from './ModelCanvas'
import { useFullscreen } from './useFullscreen'
import { hasWebGL } from './webgl'

// three.js + R3F are only downloaded when the visitor asks for the model.
const ModelCanvas = dynamic(() => import('./ModelCanvas'), { ssr: false })

type Status = 'idle' | 'downloading' | 'preparing' | 'ready' | 'error' | 'unsupported'

type NavigatorExtras = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } }
function isLowPower() {
  const n = navigator as NavigatorExtras
  return Boolean(
    n.connection?.saveData ||
      /(^|-)2g$/.test(n.connection?.effectiveType ?? '') ||
      (n.deviceMemory !== undefined && n.deviceMemory <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2),
  )
}

/**
 * The 3D experience wrapper: poster first, load on intent, real byte progress,
 * capability checks and graceful fallbacks. Listens for "View in 3D" from the floor plan.
 */
export function ModelStage({ model, projectSlug, fallbackHref = '#gallery' }: { model: Model3D; projectSlug: string; fallbackHref?: string }) {
  const frame = useRef<HTMLDivElement>(null)
  const { isFull, isPseudo, toggle: toggleFull } = useFullscreen(frame)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<{ received: number; total: number } | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [stage, setStage] = useState('')
  const [info, setInfo] = useState<SceneInfo>({ hasFurniture: false, hasCeiling: false, stages: [] })
  const [furniture, setFurniture] = useState(true)
  const [ceiling, setCeiling] = useState(false)
  const [hotspots, setHotspots] = useState(true)
  const [active, setActive] = useState<number | null>(null)
  const [view, setView] = useState<ViewRequest | null>(null)
  const [replay, setReplay] = useState(0)
  const [engaged, setEngaged] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [env, setEnv] = useState({ lowPower: false, reduced: false, small: false })
  const pendingView = useRef<string | null>(null)
  const objectUrl = useRef<string | null>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {
    setEnv({
      lowPower: isLowPower(),
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      small: window.matchMedia('(max-width: 767px)').matches,
    })
    return () => {
      abort.current?.abort()
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    }
  }, [])

  const isObject = model.kind === 'object'
  const turntable = isObject || model.kind === 'room' // gets auto-rotate + rotate/zoom buttons
  const step = (key: string) => {
    setAutoRotate(false)
    setView({ key, n: Date.now() })
  }
  const useLite = Boolean(model.lite && (env.lowPower || env.small))
  const file = useLite && model.lite ? model.lite : { url: model.url, filesize: model.filesize }

  const load = useCallback(async () => {
    if (status === 'downloading' || status === 'preparing' || status === 'ready') return
    if (!hasWebGL()) return setStatus('unsupported')
    track('viewer_3d_opened', { project: projectSlug })
    setStatus('downloading')
    setProgress(null)

    // Multi-file .gltf can't be loaded from a blob — let the loader fetch it directly.
    if (/\.gltf(\?|#|$)/i.test(file.url)) {
      setSrc(file.url)
      setStatus('preparing')
      return
    }
    try {
      abort.current = new AbortController()
      const res = await fetch(file.url, { signal: abort.current.signal })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      // Decoded byte count is what the stream yields, so prefer the known file size;
      // only trust Content-Length when the response isn't compressed.
      const encoded = res.headers.get('content-encoding')
      const total = file.filesize || (!encoded ? Number(res.headers.get('content-length')) || 0 : 0)
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
        if (now - lastPaint > 100) {
          lastPaint = now
          setProgress({ received, total })
        }
      }
      setProgress({ received, total: total || received })
      const url = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'model/gltf-binary' }))
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = url
      setSrc(url)
      setStatus('preparing')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('error')
    }
  }, [status, file.url, file.filesize, projectSlug])

  // "View in 3D" from the floor plan
  useEffect(() => {
    const onFocus = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key
      frame.current?.scrollIntoView({ behavior: env.reduced ? 'auto' : 'smooth', block: 'center' })
      if (!key) return
      if (status === 'ready') setView({ key, n: Date.now() })
      else {
        pendingView.current = key
        void load()
      }
    }
    window.addEventListener('ps:focus-room', onFocus)
    return () => window.removeEventListener('ps:focus-room', onFocus)
  }, [status, load, env.reduced])

  const onReady = useCallback(() => {
    setStatus('ready')
    if (pendingView.current) {
      const key = pendingView.current
      pendingView.current = null
      setTimeout(() => setView({ key, n: Date.now() }), 400)
    }
  }, [])
  const onError = useCallback(() => setStatus('error'), [])

  const pct = progress && progress.total ? Math.min(1, progress.received / progress.total) : null
  const hotspot = active !== null ? model.hotspots[active] : null
  const ready = status === 'ready'

  return (
    <div>
      <div
        ref={frame}
        className={`viewer ${isPseudo ? 'is-pseudo-full' : ''} ${
          isFull ? '' : isObject ? 'aspect-[4/5] sm:aspect-[4/3] lg:aspect-[16/10]' : 'aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/9]'
        }`}
        onPointerDown={(e) => {
          setEngaged(true)
          // The visitor has taken hold of the model — never fight them. (Toolbar buttons manage the state themselves.)
          if (!(e.target as HTMLElement).closest('.viewer-bar')) setAutoRotate(false)
        }}
        onPointerLeave={() => setEngaged(false)}
      >
        {/* Poster — visible until the scene is ready, and the fallback forever if 3D can't run. */}
        <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 0 : 1, pointerEvents: ready ? 'none' : undefined }}>
          <Picture img={model.poster} ink sizes="100vw" placeholderLabel="Model poster — to be added" />
          <div aria-hidden="true" className="absolute inset-0 bg-[rgb(16_16_14/0.45)]" />
        </div>

        {src && status !== 'error' && (
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
            <ModelCanvas
              src={src}
              model={model}
              furniture={furniture}
              ceiling={ceiling}
              showHotspots={hotspots && ready && !stage}
              activeHotspot={active}
              onHotspot={setActive}
              view={view}
              replay={replay}
              animate={!env.reduced && !env.lowPower}
              zoomEnabled={engaged || isFull}
              autoRotate={autoRotate}
              shadows={!env.lowPower && !env.small}
              onReady={onReady}
              onError={onError}
              onStage={setStage}
              onInfo={setInfo}
            />
          </div>
        )}

        {/* Status overlays */}
        {status === 'idle' && (
          <div className="viewer-status">
            <p className="t-meta text-on-ink-muted">Interactive 3D · {model.title}</p>
            <button type="button" className="btn btn-light" onClick={() => void load()}>
              <Cube /> Explore in 3D
              {file.filesize ? <span className="opacity-70">· {formatBytes(file.filesize)}</span> : null}
            </button>
            <p className="max-w-xs text-[0.8125rem] text-on-ink-muted">
              {env.lowPower
                ? `This device may find 3D demanding. The render above shows the same ${isObject ? 'piece' : 'space'}.`
                : isObject
                  ? 'Drag to rotate · pinch or scroll to zoom'
                  : 'Drag to orbit · pinch or scroll to zoom · two fingers or right-drag to pan'}
            </p>
          </div>
        )}
        {status === 'downloading' && (
          <div className="viewer-status" role="status" aria-live="polite">
            <p className="t-meta">Loading model…</p>
            <div className="progress-line" data-indeterminate={pct === null ? '' : undefined} style={{ ['--p' as string]: pct ?? 0 }} />
            <p className="tabular text-[0.8125rem] text-on-ink-muted">
              {progress && progress.total ? `${formatBytes(progress.received)} of ${formatBytes(progress.total)}` : progress ? formatBytes(progress.received) : ' '}
            </p>
          </div>
        )}
        {status === 'preparing' && (
          <div className="viewer-status" role="status" aria-live="polite">
            <p className="t-meta">{turntable ? 'Preparing 3D view…' : 'Preparing spatial view…'}</p>
            <div className="progress-line" data-indeterminate="" />
          </div>
        )}
        {(status === 'error' || status === 'unsupported') && (
          <div className="viewer-status" role="alert">
            <p className="max-w-sm font-serif text-[1.5rem] leading-snug">
              {status === 'unsupported' ? 'Interactive 3D is unavailable on this device.' : 'The 3D model could not be loaded.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={fallbackHref} className="btn btn-light">
                {turntable ? 'View the project render' : 'View the project renders'}
              </a>
              {status === 'error' && (
                <button type="button" className="btn btn-light" onClick={() => setStatus('idle')}>
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Build stage caption — the plan becoming a space */}
        {ready && stage && (
          <div className="pointer-events-none absolute left-4 top-4 z-10 text-charcoal sm:left-6 sm:top-6" aria-live="polite">
            <p className="t-meta text-[#65594c]">Building the space</p>
            <p key={stage} className="fade-in mt-2 font-serif text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] leading-none">
              {stage}
            </p>
            <ol className="mt-4 flex gap-1.5" aria-hidden="true">
              {info.stages.map((s, i) => (
                <li
                  key={s}
                  className="h-px w-6 transition-colors duration-500"
                  style={{ background: i <= info.stages.indexOf(stage) ? 'var(--color-charcoal)' : 'rgb(29 29 27 / 0.2)' }}
                />
              ))}
            </ol>
          </div>
        )}

        {/* Controls — quiet, grouped, never covering the centre of the scene */}
        {ready && (
          <>
            <div className="viewer-bar right-3 top-3" role="toolbar" aria-label="3D controls">
              {turntable && (
                <button
                  type="button"
                  className="viewer-btn"
                  aria-pressed={autoRotate}
                  onClick={() => setAutoRotate((v) => !v)}
                  aria-label={autoRotate ? 'Stop auto-rotate' : 'Start auto-rotate'}
                >
                  <Orbit /> <span className="max-sm:hidden">Auto-rotate</span>
                </button>
              )}
              <button type="button" className="viewer-btn" onClick={() => step('__home')} aria-label="Reset camera">
                <Reset /> <span className="max-sm:hidden">Reset</span>
              </button>
              {model.buildSequence && (
                <button type="button" className="viewer-btn" onClick={() => setReplay((n) => n + 1)} aria-label="Replay build sequence">
                  <Play /> <span className="max-sm:hidden">Build</span>
                </button>
              )}
              <button type="button" className="viewer-btn" onClick={toggleFull} aria-pressed={isFull} aria-label={isFull ? 'Exit fullscreen' : 'Fullscreen'}>
                <Expand />
              </button>
            </div>
            {turntable && (
              <div className={`viewer-bar bottom-3 ${isObject ? 'left-3' : 'right-3'}`} role="toolbar" aria-label="Rotate and zoom">
                <button type="button" className="viewer-btn" onClick={() => step('__rot_l')} aria-label="Rotate left">
                  <Chevron dir="left" />
                </button>
                <button type="button" className="viewer-btn" onClick={() => step('__rot_r')} aria-label="Rotate right">
                  <Chevron />
                </button>
                <button type="button" className="viewer-btn" onClick={() => step('__zoom_out')} aria-label="Zoom out">
                  <Minus />
                </button>
                <button type="button" className="viewer-btn" onClick={() => step('__zoom_in')} aria-label="Zoom in">
                  <Plus />
                </button>
              </div>
            )}
            {(info.hasFurniture || info.hasCeiling || model.hotspots.length > 0) && (
              <div className="viewer-bar bottom-3 left-3" role="toolbar" aria-label="Layers">
                {info.hasFurniture && (
                  <button type="button" className="viewer-btn" aria-pressed={furniture} onClick={() => setFurniture((v) => !v)}>
                    <Layers /> Furniture
                  </button>
                )}
                {info.hasCeiling && (
                  <button type="button" className="viewer-btn" aria-pressed={ceiling} onClick={() => setCeiling((v) => !v)}>
                    Ceiling
                  </button>
                )}
                {model.hotspots.length > 0 && (
                  <button type="button" className="viewer-btn" aria-pressed={hotspots} onClick={() => setHotspots((v) => !v)}>
                    Points
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Hotspot information panel */}
        {hotspot && ready && (
          <div className="viewer-panel bottom-16 right-3 fade-in sm:bottom-3" role="region" aria-live="polite" aria-label="Point of interest">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="t-meta text-muted">
                  {String((active ?? 0) + 1).padStart(2, '0')} · {hotspot.label}
                </p>
                <p className="mt-1 font-serif text-[1.625rem] leading-tight">{hotspot.title}</p>
              </div>
              <button type="button" className="-m-2 p-2" onClick={() => setActive(null)} aria-label="Close">
                <Close />
              </button>
            </div>
            {hotspot.text && <p className="mt-3 text-[0.9375rem] text-muted">{hotspot.text}</p>}
          </div>
        )}
      </div>

      {/* Room views + points of interest as plain buttons (keyboard / screen-reader path into the scene) */}
      {(model.views.length > 0 || model.hotspots.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {model.views.map((v) => (
            <button
              key={v.key}
              type="button"
              className="chip border-[var(--color-ink-line)]"
              onClick={() => {
                setAutoRotate(false)
                if (ready) setView({ key: v.key, n: Date.now() })
                else window.dispatchEvent(new CustomEvent('ps:focus-room', { detail: { key: v.key } }))
              }}
            >
              {v.label}
            </button>
          ))}
          {model.hotspots.map((h, i) => (
            <button
              key={`h${i}`}
              type="button"
              className="chip border-[var(--color-ink-line)]"
              aria-pressed={active === i}
              disabled={!ready}
              onClick={() => setActive(active === i ? null : i)}
            >
              <span className="tabular opacity-60">{String(i + 1).padStart(2, '0')}</span> {h.label}
            </button>
          ))}
        </div>
      )}
      {turntable && (model.dimensions || model.note) && (
        <p className="mt-4 max-w-[62ch] text-[0.8125rem] leading-relaxed text-on-ink-muted">
          {model.dimensions && <span className="tabular mr-3 text-[var(--color-on-ink)]">{model.dimensions}</span>}
          {model.note}
        </p>
      )}
      {useLite && <p className="t-meta mt-3 text-on-ink-muted">Showing the lighter model for this device.</p>}
    </div>
  )
}
