'use client'

import { useState } from 'react'

import type { Panorama } from '@/lib/types'
import { Panorama360Viewer } from './Panorama360Viewer'

/**
 * The project's 360° views. One room → just the viewer; several → a quiet room switcher.
 * Switching rooms remounts the viewer, which releases the previous room's GPU texture
 * (the downloaded file stays cached, so switching back is instant).
 */
export function PanoramaRooms({ panoramas, projectSlug }: { panoramas: Panorama[]; projectSlug: string }) {
  const [index, setIndex] = useState(0)
  const p = panoramas[index] ?? panoramas[0]
  if (!p) return null
  return (
    <div>
      {panoramas.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Choose a room">
          {panoramas.map((q, i) => (
            <button key={q.id} type="button" className="chip border-[var(--color-ink-line)]" aria-pressed={i === index} onClick={() => setIndex(i)}>
              {q.label}
            </button>
          ))}
        </div>
      )}
      <Panorama360Viewer
        key={p.id}
        sources={p.sources}
        alt={p.image.alt}
        label={p.label}
        initialYaw={p.initialYaw}
        initialPitch={p.initialPitch}
        projectSlug={projectSlug}
      />
    </div>
  )
}
