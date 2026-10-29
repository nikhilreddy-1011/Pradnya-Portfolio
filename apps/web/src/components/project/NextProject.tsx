import Link from 'next/link'

import { ArrowRight } from '@/components/ui/Icons'
import { StatusTag } from '@/components/ui/Meta'
import { Picture } from '@/components/ui/Picture'
import type { ProjectCard } from '@/lib/types'

export function NextProject({ project: p }: { project: ProjectCard }) {
  return (
    <section aria-label="Next project" className="border-t border-[var(--color-line)]">
      <Link href={`/work/${p.slug}`} className="group block">
        <div className="container-site grid-12 items-end gap-y-8 py-[var(--space-xl)]">
          <div className="col-span-4 sm:col-span-8 lg:col-span-6">
            <p className="t-meta text-muted">Next project</p>
            <p className="t-project mt-4 transition-transform duration-700 group-hover:translate-x-2">{p.title}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted">
              {p.typology && <span className="t-meta">{p.typology}</span>}
              <StatusTag credibility={p.credibility} />
            </div>
            <span className="link-arrow mt-8">
              View project <ArrowRight />
            </span>
          </div>
          <div className="col-span-4 sm:col-span-8 lg:col-span-5 lg:col-start-8">
            <div className="frame frame-zoom aspect-[16/10]">
              <Picture img={p.cover} sizes="(min-width: 1024px) 40vw, 100vw" placeholderLabel="Render to be added" />
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
