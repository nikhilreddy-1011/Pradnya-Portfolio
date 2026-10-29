import Link from 'next/link'

import { StatusTag } from '@/components/ui/Meta'
import { Picture } from '@/components/ui/Picture'
import type { ProjectCard } from '@/lib/types'

/** Up to three other projects — same category first. Rendered only when there is something to show. */
export function RelatedProjects({ projects }: { projects: ProjectCard[] }) {
  if (projects.length === 0) return null
  return (
    <section aria-labelledby="related-title" className="border-t border-[var(--color-line)] py-[var(--space-xl)]">
      <div className="container-site">
        <h2 id="related-title" className="t-meta text-muted">
          Related projects
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-3">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`} className="group block">
                <div className="frame frame-zoom aspect-[4/3]">
                  <Picture img={p.cover} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 33vw, 100vw" placeholderLabel="Render to be added" />
                </div>
                <p className="mt-4 font-serif text-[clamp(1.25rem,1.1rem+0.4vw,1.5rem)] leading-snug">{p.title}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 text-muted">
                  {p.typology && <span className="t-meta">{p.typology}</span>}
                  <StatusTag credibility={p.credibility} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
