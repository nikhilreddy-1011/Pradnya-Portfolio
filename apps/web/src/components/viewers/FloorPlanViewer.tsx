'use client'

import { type KeyboardEvent, type PointerEvent, type WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ArrowRight, Close, Expand, Layers, Minus, Plus, Reset } from '@/components/ui/Icons'
import type { FloorPlan, Room } from '@/lib/types'
import { useFullscreen } from './useFullscreen'

const MIN = 1
const MAX = 6

type View = { s: number; x: number; y: number } // scale + translation (px) of the plan layer

const centroid = (pts: [number, number][]) => {
  // Area-weighted polygon centroid — keeps labels inside L-shaped rooms better than a bbox centre.
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % pts.length]
    const f = x0 * y1 - x1 * y0
    a += f
    cx += (x0 + x1) * f
    cy += (y0 + y1) * f
  }
  if (Math.abs(a) < 1e-6) return pts[0]
  return [cx / (3 * a), cy / (3 * a)] as [number, number]
}

const bbox = (pts: [number, number][]) => {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

/**
 * Interactive 2D floor plan.
 * Mouse: drag to pan, Ctrl/⌘ + wheel (or trackpad pinch) to zoom · Touch: pinch to zoom, drag to pan when zoomed
 * Keyboard: arrows pan, + / − zoom, 0 resets · Rooms are mirrored as buttons for screen readers.
 */
export function FloorPlanViewer({ plan, has3D = false, compact = false }: { plan: FloorPlan; has3D?: boolean; compact?: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const { isFull, isPseudo, toggle: toggleFull } = useFullscreen(frame)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 })
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [labels, setLabels] = useState(true)
  const [furnished, setFurnished] = useState(Boolean(plan.furnishedImage))
  const [hint, setHint] = useState(false)
  const [animate, setAnimate] = useState(false)

  const aspect = plan.image.width && plan.image.height ? plan.image.width / plan.image.height : 16 / 10
  const img = furnished && plan.furnishedImage ? plan.furnishedImage : plan.image

  // Size of the plan at scale 1 ("contain" inside the frame)
  const base = useMemo(() => {
    if (!box.w || !box.h) return { w: 0, h: 0, ox: 0, oy: 0 }
    const pad = compact ? 16 : 32
    const w = Math.min(box.w - pad * 2, (box.h - pad * 2) * aspect)
    const h = w / aspect
    return { w, h, ox: (box.w - w) / 2, oy: (box.h - h) / 2 }
  }, [box, aspect, compact])

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clamp = useCallback(
    (v: View): View => {
      const s = Math.min(MAX, Math.max(MIN, v.s))
      // Keep at least a third of the plan inside the frame.
      const mx = base.w * 0.33
      const my = base.h * 0.33
      return {
        s,
        x: Math.min(mx, Math.max(base.w * (1 - s) - mx, v.x)),
        y: Math.min(my, Math.max(base.h * (1 - s) - my, v.y)),
      }
    },
    [base],
  )

  /** Zoom by factor k around a point (px, relative to frame). */
  const zoomAt = useCallback(
    (k: number, px: number, py: number, smooth = false) => {
      setAnimate(smooth)
      setView((v) => {
        const s = Math.min(MAX, Math.max(MIN, v.s * k))
        const r = s / v.s
        // point under cursor stays fixed
        const cx = px - base.ox
        const cy = py - base.oy
        return clamp({ s, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r })
      })
    },
    [base, clamp],
  )

  const reset = () => {
    setAnimate(true)
    setView({ s: 1, x: 0, y: 0 })
  }

  const focusRoom = useCallback(
    (i: number) => {
      setSelected(i)
      const r = plan.rooms[i]
      if (!r || !base.w) return
      const b = bbox(r.points)
      const rw = ((b.x1 - b.x0) / 100) * base.w
      const rh = ((b.y1 - b.y0) / 100) * base.h
      const s = Math.min(3, Math.max(1.2, Math.min((base.w * 0.7) / rw, (base.h * 0.7) / rh)))
      const cx = ((b.x0 + b.x1) / 200) * base.w
      const cy = ((b.y0 + b.y1) / 200) * base.h
      setAnimate(true)
      setView(clamp({ s, x: base.w / 2 - cx * s, y: base.h / 2 - cy * s }))
    },
    [plan.rooms, base, clamp],
  )

  /* ── Pointer: pan + pinch ─────────────────────────────────────────────── */
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const last = useRef<{ x: number; y: number; d: number } | null>(null)
  const moved = useRef(0)

  const rel = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    pointers.current.set(e.pointerId, rel(e))
    moved.current = 0
    last.current = null
    setAnimate(false)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, rel(e))
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      // Single-finger touch at scale 1 is left to the page (vertical scroll) via touch-action.
      if (e.pointerType === 'touch' && view.s === 1) return
      const p = pts[0]
      if (last.current) {
        const dx = p.x - last.current.x
        const dy = p.y - last.current.y
        moved.current += Math.abs(dx) + Math.abs(dy)
        // Capture only once it is really a drag, so simple clicks still reach the rooms.
        if (moved.current > 4 && !frame.current?.hasPointerCapture(e.pointerId)) frame.current?.setPointerCapture(e.pointerId)
        setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }))
      }
      last.current = { ...p, d: 0 }
    } else if (pts.length === 2) {
      const [a, b] = pts
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (last.current && last.current.d) {
        const k = d / last.current.d
        const dx = mid.x - last.current.x
        const dy = mid.y - last.current.y
        zoomAt(k, mid.x, mid.y)
        setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }))
      }
      moved.current += 10
      last.current = { ...mid, d }
    }
  }
  const onPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    last.current = null
  }

  const onWheel = (e: WheelEvent) => {
    // Don't hijack page scrolling: zoom needs Ctrl/⌘ (trackpad pinch sends ctrlKey) or fullscreen.
    if (!(e.ctrlKey || e.metaKey || isFull)) {
      setHint(true)
      return
    }
    e.preventDefault()
    const p = rel(e)
    zoomAt(Math.exp(-e.deltaY * 0.0022), p.x, p.y)
  }
  useEffect(() => {
    if (!hint) return
    const t = setTimeout(() => setHint(false), 1400)
    return () => clearTimeout(t)
  }, [hint])

  // React's onWheel is passive; attach a non-passive listener so preventDefault works.
  const wheelRef = useRef(onWheel)
  wheelRef.current = onWheel
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const h = (e: globalThis.WheelEvent) => wheelRef.current(e as unknown as WheelEvent)
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  }, [])

  const onKeyDown = (e: KeyboardEvent) => {
    const step = 48
    const k: Record<string, () => void> = {
      ArrowLeft: () => setView((v) => clamp({ ...v, x: v.x + step })),
      ArrowRight: () => setView((v) => clamp({ ...v, x: v.x - step })),
      ArrowUp: () => setView((v) => clamp({ ...v, y: v.y + step })),
      ArrowDown: () => setView((v) => clamp({ ...v, y: v.y - step })),
      '+': () => zoomAt(1.25, box.w / 2, box.h / 2, true),
      '=': () => zoomAt(1.25, box.w / 2, box.h / 2, true),
      '-': () => zoomAt(0.8, box.w / 2, box.h / 2, true),
      '0': reset,
      Escape: () => setSelected(null),
    }
    if (k[e.key]) {
      e.preventDefault()
      setAnimate(true)
      k[e.key]()
    }
  }

  const go3D = (room: Room) => {
    window.dispatchEvent(new CustomEvent('ps:focus-room', { detail: { key: room.key } }))
  }

  const room = selected !== null ? plan.rooms[selected] : null

  return (
    <div>
      <div
        ref={frame}
        tabIndex={0}
        role="application"
        aria-roledescription="interactive floor plan"
        aria-label={`${plan.title}. Use arrow keys to pan, plus and minus to zoom, 0 to reset.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`viewer select-none bg-paper text-[var(--color-text)] ${isPseudo ? 'is-pseudo-full' : ''} ${isFull ? '' : compact ? 'aspect-[4/3]' : 'aspect-square sm:aspect-[16/11] lg:aspect-[16/9]'}`}
        style={{
          touchAction: view.s > 1 ? 'none' : 'pan-y',
          cursor: view.s > 1 ? 'grab' : 'default',
          border: '1px solid var(--color-line)',
          background: 'var(--color-paper)',
        }}
      >
        {/* Plan layer */}
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: base.w,
            height: base.h,
            transform: `translate3d(${base.ox + view.x}px, ${base.oy + view.y}px, 0) scale(${view.s})`,
            transition: animate ? 'transform 600ms var(--ease-out)' : 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt || plan.title} draggable={false} className="pointer-events-none h-full w-full object-contain" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {plan.rooms.map((r, i) => (
              <polygon
                key={i}
                points={r.points.map((p) => p.join(',')).join(' ')}
                vectorEffect="non-scaling-stroke"
                onClick={() => moved.current < 6 && focusRoom(i)}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                style={{
                  cursor: 'pointer',
                  fill: selected === i ? 'rgb(166 95 69 / 0.2)' : hovered === i ? 'rgb(166 95 69 / 0.1)' : 'transparent',
                  stroke: selected === i ? 'var(--color-terracotta)' : 'transparent',
                  strokeWidth: 2,
                  transition: 'fill 250ms, stroke 250ms',
                }}
              />
            ))}
          </svg>
          {labels &&
            plan.rooms.map((r, i) => {
              const [x, y] = centroid(r.points)
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  className="pointer-events-none absolute whitespace-nowrap text-center"
                  style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) scale(${1 / view.s})`, transition: animate ? 'transform 600ms var(--ease-out)' : 'none' }}
                >
                  <span className={`t-ui block px-1.5 py-1 ${selected === i ? 'bg-terracotta text-paper' : 'bg-[rgb(250_250_247/0.85)]'}`}>{r.name}</span>
                  {r.dimensions && <span className="mt-0.5 block text-[0.6875rem] tabular text-muted">{r.dimensions}</span>}
                </span>
              )
            })}
        </div>

        {/* Controls */}
        <div className="viewer-bar right-3 top-3" role="toolbar" aria-label="Floor plan controls">
          <button type="button" className="viewer-btn" onClick={() => zoomAt(1.4, box.w / 2, box.h / 2, true)} aria-label="Zoom in">
            <Plus />
          </button>
          <button type="button" className="viewer-btn" onClick={() => zoomAt(1 / 1.4, box.w / 2, box.h / 2, true)} aria-label="Zoom out">
            <Minus />
          </button>
          <button type="button" className="viewer-btn" onClick={reset} aria-label="Reset view">
            <Reset />
          </button>
          <button type="button" className="viewer-btn" onClick={toggleFull} aria-label={isFull ? 'Exit fullscreen' : 'Fullscreen'} aria-pressed={isFull}>
            <Expand />
          </button>
        </div>
        <div className="viewer-bar bottom-3 left-3" role="toolbar" aria-label="Plan layers">
          <button type="button" className="viewer-btn" aria-pressed={labels} onClick={() => setLabels((v) => !v)}>
            Labels
          </button>
          {plan.furnishedImage && (
            <button type="button" className="viewer-btn" aria-pressed={furnished} onClick={() => setFurnished((v) => !v)}>
              <Layers /> Furnished
            </button>
          )}
        </div>

        {hint && (
          <p className="t-ui pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-[rgb(22_22_20/0.85)] px-4 py-3 text-on-ink fade-in">
            Hold Ctrl / ⌘ and scroll to zoom
          </p>
        )}

        {/* Selected room panel */}
        {room && (
          <div className="viewer-panel bottom-16 right-3 fade-in sm:bottom-3" role="region" aria-live="polite" aria-label="Selected room">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="t-meta text-muted">Room</p>
                <p className="mt-1 font-serif text-[1.75rem] leading-none">{room.name}</p>
              </div>
              <button type="button" className="-m-2 p-2" onClick={() => setSelected(null)} aria-label="Close room details">
                <Close />
              </button>
            </div>
            {room.dimensions && <p className="t-meta mt-3 tabular">{room.dimensions}</p>}
            {room.description && <p className="mt-3 text-[0.9375rem] text-muted">{room.description}</p>}
            {has3D && room.key && (
              <button type="button" className="link-arrow mt-4" onClick={() => go3D(room)}>
                View in 3D <ArrowRight />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Accessible room list (also a quick picker on phones) */}
      {plan.rooms.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Rooms">
          {plan.rooms.map((r, i) => (
            <button key={i} type="button" className="chip" aria-pressed={selected === i} onClick={() => focusRoom(i)}>
              {r.name}
            </button>
          ))}
          {plan.note && <p className="t-meta ml-auto text-muted">{plan.note}</p>}
        </div>
      )}
    </div>
  )
}
