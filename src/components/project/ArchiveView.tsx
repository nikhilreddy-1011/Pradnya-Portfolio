'use client'

import Link from 'next/link'
import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react'

import { ArrowRight } from '@/components/ui/Icons'
import { StatusTag } from '@/components/ui/Meta'
import { Picture } from '@/components/ui/Picture'
import type { ProjectCard } from '@/lib/types'

type Filter = { key: string; label: string; test: (p: ProjectCard) => boolean }

/** Filters are derived from data (CMS categories + project status), so new categories appear automatically. */
function buildFilters(projects: ProjectCard[]): Filter[] {
  const cats = new Map<string, string>()
  projects.forEach((p) => p.category && cats.set(p.category.slug, p.category.title))
  const status: Filter[] = [
    { key: 'coursework', label: 'Coursework', test: (p) => p.credibility === 'coursework' || p.credibility === 'portfolio-coursework' },
    { key: 'concepts', label: 'Concepts', test: (p) => ['concept', 'portfolio-concept', 'concept-render'].includes(p.credibility) },
    { key: 'design-studies', label: 'Design studies', test: (p) => p.credibility === 'design-study' },
    { key: 'site-studies', label: 'Site studies', test: (p) => p.credibility === 'site-study' },
    { key: 'professional', label: 'Professional', test: (p) => p.credibility === 'professional' },
  ]
  const all: Filter[] = [
    { key: 'all', label: 'All', test: () => true },
    ...[...cats].map(([slug, title]) => ({ key: slug, label: title, test: (p: ProjectCard) => p.category?.slug === slug })),
    ...status,
  ]
  // Hide empty filters — no dead ends.
  return all.filter((f) => f.key === 'all' || projects.some(f.test))
}

export function ArchiveView({ projects }: { projects: ProjectCard[] }) {
  const filters = useMemo(() => buildFilters(projects), [projects])
  const [active, setActive] = useState('all')
  const [view, setView] = useState<'index' | 'grid'>('index')

  // Deep-linkable state: /work?filter=residential&view=grid
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const f = q.get('filter')
    if (f && filters.some((x) => x.key === f)) setActive(f)
    if (q.get('view') === 'grid') setView('grid')
  }, [filters])
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    active === 'all' ? q.delete('filter') : q.set('filter', active)
    view === 'index' ? q.delete('view') : q.set('view', view)
    const s = q.toString()
    window.history.replaceState(null, '', s ? `?${s}` : window.location.pathname)
  }, [active, view])

  const shown = projects.filter((filters.find((f) => f.key === active) ?? filters[0]).test)

  return (
    <section aria-label="Projects" className="section pt-[var(--space-xl)]">
      <div className="container-site">
        <div className="flex flex-col gap-6 border-b border-[var(--color-line)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter projects" className="-mx-1 flex flex-wrap gap-2 px-1">
            {filters.map((f) => (
              <button key={f.key} type="button" className="chip" aria-pressed={active === f.key} onClick={() => setActive(f.key)}>
                {f.label}
                <span className="count tabular">{projects.filter(f.test).length}</span>
              </button>
            ))}
          </div>
          <div role="group" aria-label="Layout" className="flex gap-6">
            {(['index', 'grid'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`t-ui min-h-11 border-b py-2 transition-colors ${view === v ? 'border-current' : 'border-transparent text-muted hover:text-[var(--color-text)]'}`}
              >
                {v === 'index' ? 'Index' : 'Visual'}
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'project' : 'projects'} shown
        </p>

        {shown.length === 0 ? (
          <p className="t-lead py-[var(--space-xl)] text-muted">No projects in this category yet.</p>
        ) : view === 'index' ? (
          <IndexList projects={shown} />
        ) : (
          <GridList projects={shown} />
        )}
      </div>
    </section>
  )
}

/** Architecture-studio index: one row per project, cover preview follows the cursor on desktop. */
function IndexList({ projects }: { projects: ProjectCard[] }) {
  const [hover, setHover] = useState<ProjectCard | null>(null)
  const preview = useRef<HTMLDivElement>(null)
  const canHover = useRef(false)
  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches
  }, [])

  const move = (e: MouseEvent) => {
    if (!canHover.current || !preview.current) return
    preview.current.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 120}px, 0)`
  }

  return (
    <div onMouseMove={move} onMouseLeave={() => setHover(null)}>
      <ul>
        {projects.map((p) => (
          <li key={p.slug} className="border-b border-[var(--color-line)]">
            <Link
              href={`/work/${p.slug}`}
              className="group grid-12 items-center gap-y-3 py-6 transition-colors lg:py-8"
              onMouseEnter={() => setHover(p)}
              onFocus={() => setHover(null)}
            >
              <span className="t-index col-span-1 text-muted tabular">{p.number}</span>
              <span className="col-span-3 sm:col-span-5 lg:col-span-4">
                <span className="t-project block text-[clamp(1.75rem,1.2rem+2vw,3.25rem)] transition-transform duration-500 group-hover:translate-x-2">
                  {p.title}
                </span>
              </span>
              <span className="col-span-4 col-start-1 frame aspect-[16/10] sm:hidden">
                <Picture img={p.cover} sizes="100vw" placeholderLabel="Render to be added" />
              </span>
              <span className="t-meta col-span-2 text-muted sm:col-span-2 lg:col-span-2">{p.category?.title}</span>
              <span className="t-meta col-span-2 text-muted tabular max-lg:hidden lg:col-span-2">{p.area ?? '—'}</span>
              <span className="col-span-2 text-muted sm:col-span-2 lg:col-span-2">
                <StatusTag credibility={p.credibility} />
              </span>
              <span aria-hidden="true" className="col-span-1 hidden justify-self-end lg:block">
                <span className="link-arrow">
                  <ArrowRight />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-30 hidden w-[22rem] transition-opacity duration-300 lg:block"
        style={{ opacity: hover ? 1 : 0 }}
      >
        <div className="frame aspect-[4/3] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]">
          {hover && <Picture img={hover.cover} sizes="352px" placeholderLabel={hover.title} />}
        </div>
      </div>
    </div>
  )
}

function GridList({ projects }: { projects: ProjectCard[] }) {
  return (
    <ul className="mt-[var(--space-lg)] grid grid-cols-1 gap-x-[var(--grid-gap)] gap-y-[var(--space-xl)] sm:grid-cols-2">
      {projects.map((p, i) => (
        <li key={p.slug} className={i % 2 === 1 ? 'sm:mt-[var(--space-xl)]' : ''}>
          <Link href={`/work/${p.slug}`} className="group block">
            <div className="frame frame-zoom aspect-[4/3]">
              <Picture img={p.cover} sizes="(min-width: 640px) 50vw, 100vw" placeholderLabel="Render to be added" />
            </div>
            <div className="mt-5 flex items-baseline gap-4">
              <span className="t-index text-muted tabular">{p.number}</span>
              <StatusTag credibility={p.credibility} className="text-muted" />
            </div>
            <h2 className="t-project mt-3 text-[clamp(1.75rem,1.3rem+1.6vw,3rem)]">{p.title}</h2>
            <p className="t-meta mt-3 text-muted">{[p.category?.title, p.area, p.year].filter(Boolean).join('  ·  ')}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
