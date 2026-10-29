import Link from 'next/link'

import { ArrowRight } from '@/components/ui/Icons'
import { MetaLine, StatusTag } from '@/components/ui/Meta'
import { Picture } from '@/components/ui/Picture'
import type { ProjectCard } from '@/lib/types'

/**
 * Editorial project compositions — not a card grid. Layouts rotate:
 * full-bleed → split → offset-vertical, so any number of projects keeps its rhythm.
 */
export function SelectedSpaces({ projects }: { projects: ProjectCard[] }) {
  return (
    <section id="selected-spaces" aria-labelledby="selected-title" className="section pb-0">
      <div className="container-site">
        <div className="flex items-end justify-between gap-6 border-b border-[var(--color-line)] pb-6">
          <h2 id="selected-title" className="t-section" data-reveal>
            Selected spaces
          </h2>
          <Link href="/work" className="link-arrow shrink-0" data-reveal>
            All work <ArrowRight />
          </Link>
        </div>
      </div>

      <div className="mt-[var(--space-xl)] space-y-[var(--space-2xl)]">
        {projects.map((p, i) => {
          const layout = (['full', 'split', 'offset'] as const)[i % 3]
          return <Composition key={p.slug} project={p} layout={layout} priority={i === 0} />
        })}
      </div>
    </section>
  )
}

function Title({ p }: { p: ProjectCard }) {
  return (
    <>
      <div className="flex items-baseline gap-4">
        <span className="t-index text-muted tabular">{p.number}</span>
        <StatusTag credibility={p.credibility} className="text-muted" />
      </div>
      <h3 className="t-project mt-4">
        <Link href={`/work/${p.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {p.title}
        </Link>
      </h3>
      {p.typology && <p className="t-lead mt-3">{p.typology}</p>}
      <MetaLine project={p} className="mt-4 text-muted" />
    </>
  )
}

function Composition({ project: p, layout, priority }: { project: ProjectCard; layout: 'full' | 'split' | 'offset'; priority: boolean }) {
  const href = `/work/${p.slug}`
  const image = (aspect: string, sizes: string) => (
    <Link href={href} tabIndex={-1} aria-hidden="true" className="frame frame-zoom block" data-reveal="image" style={{ aspectRatio: aspect }}>
      <Picture img={p.cover} mobile={p.coverMobile} sizes={sizes} preload={priority} placeholderLabel="Project render — to be added" />
    </Link>
  )

  if (layout === 'full') {
    return (
      <article className="group relative">
        <div className="container-site">{image('16 / 9', '(min-width: 1440px) 1340px, 100vw')}</div>
        <div className="container-site grid-12 mt-8 gap-y-6">
          <div className="relative col-span-4 sm:col-span-8 lg:col-span-7" data-reveal>
            <Title p={p} />
          </div>
          <div className="col-span-4 flex flex-col justify-end gap-6 sm:col-span-6 lg:col-span-4 lg:col-start-9" data-reveal style={{ ['--delay' as string]: '120ms' }}>
            <p className="t-body text-muted">{p.summary}</p>
            <span className="link-arrow self-start">
              View project <ArrowRight />
            </span>
          </div>
        </div>
      </article>
    )
  }

  if (layout === 'split') {
    return (
      <article className="group relative">
        <div className="container-site grid-12 items-end gap-y-8">
          <div className="col-span-4 sm:col-span-8 lg:col-span-8">{image('4 / 3', '(min-width: 1024px) 60vw, 100vw')}</div>
          <div className="relative col-span-4 sm:col-span-6 lg:col-span-4" data-reveal>
            <Title p={p} />
            <p className="t-body mt-6 text-muted">{p.summary}</p>
            <span className="link-arrow mt-6">
              View project <ArrowRight />
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group relative">
      <div className="container-site grid-12 gap-y-8">
        <div className="relative col-span-4 sm:col-span-6 lg:col-span-4 lg:pt-[var(--space-xl)]" data-reveal>
          <Title p={p} />
          <p className="t-body mt-6 text-muted">{p.summary}</p>
          <span className="link-arrow mt-6">
            View project <ArrowRight />
          </span>
        </div>
        <div className="col-span-4 sm:col-span-7 sm:col-start-2 lg:col-span-6 lg:col-start-7">{image('4 / 5', '(min-width: 1024px) 45vw, 90vw')}</div>
      </div>
    </article>
  )
}
