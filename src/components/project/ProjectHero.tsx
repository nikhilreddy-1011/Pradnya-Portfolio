import Link from 'next/link'

import { MetaList, StatusTag } from '@/components/ui/Meta'
import { Picture } from '@/components/ui/Picture'
import { Gallery } from '@/components/project/Gallery'
import { RENDER_SIZES } from '@/components/project/gallery-constants'
import type { Project } from '@/lib/types'

/**
 * Hero framing follows the render's own proportions so nothing important is cropped:
 *  - standard landscape (≈1.55–2.05:1) keeps the cinematic 16:9 crop (focal point + mobile crop),
 *  - ultra-wide (>2.05:1) is shown uncropped on tablet/desktop and as a focal-point square on phones,
 *  - near-square / portrait-leaning renders (<1.55:1) are shown whole at every size, centred.
 * Covers without known dimensions fall back to the standard crop.
 * Exception: when the hero is the project's only render (it opens the lightbox) and there is no dedicated
 * mobile crop, a landscape render is shown whole at every size.
 */
function HeroImage({ project: p }: { project: Project }) {
  const w = p.cover?.width
  const h = p.cover?.height
  const ratio = w && h ? w / h : 16 / 9
  // Single-render projects: the hero IS the full render, so it opens the lightbox (no repeated section below).
  const zoomItems = p.cover && p.gallery.length === 1 && p.gallery[0].image.url === p.cover.url ? p.gallery : null

  let cls: string
  let sizes: string
  let aspectRatio: string | undefined
  let width: string | undefined
  let style: React.CSSProperties | undefined
  if (zoomItems && !p.coverMobile && ratio >= 1.55 && ratio <= 2.05) {
    // The hero is the one and only render and has no dedicated mobile crop: show all of it at every size
    // (a portrait/cinematic crop would cut away the very content the render exists to show).
    cls = ''
    aspectRatio = String(ratio)
    sizes = '(min-width: 1440px) 1520px, 100vw'
  } else if (ratio >= 1.55 && ratio <= 2.05) {
    cls = 'aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/9]'
    sizes = '(max-width: 639px) 230vw, (max-width: 1023px) 130vw, (min-width: 1440px) 1520px, 115vw'
  } else if (ratio > 2.05) {
    cls = 'aspect-square sm:[aspect-ratio:var(--r)]'
    style = { ['--r' as string]: String(ratio) }
    sizes = `(max-width: 639px) ${Math.round(100 * ratio)}vw, ${RENDER_SIZES}`
  } else {
    cls = ''
    aspectRatio = String(ratio)
    width = `min(100%, calc(78svh * ${ratio}))`
    sizes = RENDER_SIZES
  }

  if (zoomItems && p.cover) {
    // `--r` (ultra-wide) is applied through a wrapper-free custom property on the button itself.
    return (
      <div style={style}>
        <Gallery variant="hero" items={zoomItems} title={p.title} hero={{ img: p.cover, mobile: p.coverMobile, sizes, className: cls, aspectRatio, width }} />
      </div>
    )
  }
  return (
    <div className={`hero-image frame ${cls} ${width ? 'mx-auto' : ''}`} style={{ ...style, aspectRatio, width }}>
      <Picture img={p.cover} mobile={p.coverMobile} sizes={sizes} preload placeholderLabel="Project render — to be added" />
    </div>
  )
}

export function ProjectHero({ project: p }: { project: Project }) {
  return (
    <header className="pt-[calc(var(--header-h)+var(--space-lg))]">
      <div className="container-site">
        <nav aria-label="Breadcrumb" className="t-meta text-muted fade-in">
          <Link href="/work" className="link-underline">
            Work
          </Link>
          <span aria-hidden="true" className="mx-3">
            /
          </span>
          <span aria-current="page">{p.title}</span>
        </nav>

        <div className="grid-12 mt-[var(--space-lg)] gap-y-8">
          <div className="col-span-4 sm:col-span-8 lg:col-span-8">
            <p className="t-eyebrow flex flex-wrap items-center gap-x-4 gap-y-2 fade-in" style={{ ['--delay' as string]: '100ms' }}>
              <span className="tabular">{p.number}</span>
              {p.category && <span>{p.category.title} interior</span>}
              <StatusTag credibility={p.credibility} className="text-terracotta-text" />
            </p>
            <h1 className="t-project mt-5">
              <span className="line-mask">
                <span style={{ ['--delay' as string]: '200ms' }}>{p.title}</span>
              </span>
            </h1>
            {p.typology && (
              <p className="t-lead mt-4 fade-in" style={{ ['--delay' as string]: '350ms' }}>
                {p.typology}
              </p>
            )}
          </div>
          <p className="t-body col-span-4 self-end text-muted fade-in sm:col-span-6 lg:col-span-4" style={{ ['--delay' as string]: '450ms' }}>
            {p.summary}
          </p>
        </div>

        <MetaList project={p} className="mt-[var(--space-lg)] fade-in" />
      </div>

      <div className="container-site mt-[var(--space-lg)]">
        <HeroImage project={p} />
      </div>
    </header>
  )
}
