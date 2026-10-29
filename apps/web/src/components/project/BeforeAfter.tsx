'use client'

import { useId, useState } from 'react'

import { Picture } from '@/components/ui/Picture'
import type { Img } from '@/lib/types'

/** Before / after comparison — for real projects with genuine existing-space photographs only. */
export function BeforeAfter({ before, after, caption }: { before: Img; after: Img; caption?: string }) {
  const [pos, setPos] = useState(50)
  const id = useId()
  return (
    <figure className="mt-[var(--space-xl)]">
      <div className="frame relative aspect-[16/10] select-none">
        <Picture img={after} sizes="100vw" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Picture img={before} sizes="100vw" />
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 w-px bg-[var(--color-paper)]" style={{ left: `${pos}%` }}>
          <span className="t-ui absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-[var(--color-paper)] px-3 py-2 text-[var(--color-text)]">
            ← Before · After →
          </span>
        </div>
        <label htmlFor={id} className="sr-only">
          Reveal before and after
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      {caption && <figcaption className="t-meta mt-3 text-muted">{caption}</figcaption>}
    </figure>
  )
}
