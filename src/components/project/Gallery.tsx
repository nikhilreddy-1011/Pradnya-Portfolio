'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Chevron, Close } from '@/components/ui/Icons'
import { RENDER_SIZES } from '@/components/project/gallery-constants'
import { Picture } from '@/components/ui/Picture'
import { objectPosition } from '@/lib/media'
import type { GalleryItem, Img } from '@/lib/types'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const galleryAnchor = (g: GalleryItem, i: number) => g.slug ?? (g.room ? slugify(g.room) : `image-${i + 1}`)

/** Every image keeps its own aspect ratio — nothing in the gallery is cropped. */
const ratioOf = (g: GalleryItem) => (g.image.width && g.image.height ? g.image.width / g.image.height : 4 / 3)

/**
 * Project imagery + accessible lightbox on the native <dialog> (Esc closes, ←/→ and swipe navigate,
 * focus returns to the thumbnail).
 *  - `stack`   — one render per row, full image (large renders, with title + description)
 *  - `masonry` — two columns, natural aspect ratios (detail galleries)
 *  - `hero`    — the hero image itself opens the lightbox (projects with a single render: no duplicate section)
 */
export type HeroTrigger = {
  img: Img
  mobile?: Img | null
  sizes: string
  className: string
  aspectRatio?: string
  width?: string
}

export function Gallery({
  items,
  title,
  variant = 'masonry',
  hero,
}: {
  items: GalleryItem[]
  title: string
  variant?: 'stack' | 'masonry' | 'hero'
  /** `hero` variant: the page's hero image becomes the lightbox trigger (single-render projects). */
  hero?: HeroTrigger
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const [opener, setOpener] = useState<HTMLElement | null>(null)

  const open = (i: number, el: HTMLElement) => {
    setIndex(i)
    setOpener(el)
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()
  const go = useCallback((d: number) => setIndex((i) => (i + d + items.length) % items.length), [items.length])

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    const onClose = () => opener?.focus()
    el.addEventListener('keydown', onKey)
    el.addEventListener('close', onClose)
    return () => {
      el.removeEventListener('keydown', onKey)
      el.removeEventListener('close', onClose)
    }
  }, [go, opener])

  // Swipe on touch devices
  const touchX = useRef<number | null>(null)

  const item = items[index]
  const many = items.length > 1

  const thumb = (g: GalleryItem, i: number, className: string, sizes: string, style?: React.CSSProperties) => (
    <button
      type="button"
      onClick={(e) => open(i, e.currentTarget)}
      className={`frame frame-zoom group block w-full cursor-zoom-in ${className}`}
      style={style}
      aria-label={`Open image ${i + 1} of ${items.length}: ${g.room ?? g.image.alt}`}
    >
      <Picture img={g.image} sizes={sizes} />
    </button>
  )

  return (
    <>
      {variant === 'hero' && hero ? (
        <button
          type="button"
          onClick={(e) => open(0, e.currentTarget)}
          className={`hero-image frame block cursor-zoom-in ${hero.className}`}
          style={{ aspectRatio: hero.aspectRatio, width: hero.width ?? '100%', margin: hero.width ? '0 auto' : undefined }}
          aria-label={`Open full image: ${items[0]?.room ?? title}`}
        >
          <Picture img={hero.img} mobile={hero.mobile} sizes={hero.sizes} preload placeholderLabel="Project render — to be added" />
        </button>
      ) : variant === 'stack' ? (
        <ul className="space-y-[var(--space-xl)]">
          {items.map((g, i) => {
            const r = ratioOf(g)
            const wide = r >= 1.5
            const flip = !wide && i % 2 === 1
            return (
              <li key={g.image.url} id={galleryAnchor(g, i)} className="scroll-mt-28" data-reveal="image">
                <figure className="grid-12 items-end gap-y-5">
                  <div className={wide ? 'col-span-4 sm:col-span-8 lg:col-span-12' : `col-span-4 sm:col-span-8 lg:col-span-7 ${flip ? 'lg:col-start-6' : ''}`}>
                    {thumb(g, i, '', RENDER_SIZES, { aspectRatio: String(r) })}
                  </div>
                  {(g.room || g.caption) && (
                    <figcaption
                      className={
                        wide
                          ? 'col-span-4 sm:col-span-8 lg:col-span-7'
                          : `col-span-4 sm:col-span-8 lg:col-span-4 ${flip ? 'lg:col-start-1 lg:row-start-1' : 'lg:col-start-9'}`
                      }
                    >
                      {g.room && <h3 className="font-serif text-[clamp(1.375rem,1.2rem+0.6vw,1.875rem)] leading-tight">{g.room}</h3>}
                      {g.caption && <p className="mt-3 text-muted">{g.caption}</p>}
                    </figcaption>
                  )}
                </figure>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="gap-[var(--grid-gap)] sm:columns-2">
          {items.map((g, i) => (
            <li key={g.image.url} id={galleryAnchor(g, i)} className="mb-[var(--grid-gap)] break-inside-avoid scroll-mt-28" data-reveal="image">
              <figure>
                {thumb(g, i, '', '(min-width: 640px) 50vw, 100vw', { aspectRatio: String(ratioOf(g)) })}
                {(g.room || g.caption) && (
                  <figcaption className="mt-3">
                    {g.room && <span className="block font-serif text-[1.25rem] leading-snug">{g.room}</span>}
                    {g.caption && <span className="t-meta mt-1 block text-muted">{g.caption}</span>}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={`${title} gallery`}
        onClick={(e) => e.target === e.currentTarget && close()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || !many) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        {item && (
          <div className="grid h-full grid-rows-[auto_1fr_auto]">
            <div className="flex items-center justify-between px-[var(--gutter)] py-4">
              <p className="t-meta tabular text-on-ink-muted" aria-live="polite">
                {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </p>
              <button type="button" onClick={close} className="viewer-btn" aria-label="Close gallery" autoFocus>
                <Close /> Close
              </button>
            </div>
            <div className="relative mx-[var(--gutter)]">
              <Image
                key={item.image.url}
                src={item.image.url}
                alt={item.image.alt}
                fill
                sizes="100vw"
                quality={90}
                className="fade-in object-contain"
                style={{ objectPosition: objectPosition(item.image) }}
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-[var(--gutter)] py-4">
              {many ? (
                <button type="button" className="viewer-btn" onClick={() => go(-1)} aria-label="Previous image">
                  <Chevron dir="left" />
                </button>
              ) : (
                <span className="w-11" aria-hidden="true" />
              )}
              <p className="t-meta text-center text-on-ink-muted">
                {item.room && <span className="block text-[var(--color-on-ink)]">{item.room}</span>}
                {item.caption && <span className="block">{item.caption}</span>}
              </p>
              {many ? (
                <button type="button" className="viewer-btn" onClick={() => go(1)} aria-label="Next image">
                  <Chevron />
                </button>
              ) : (
                <span className="w-11" aria-hidden="true" />
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
