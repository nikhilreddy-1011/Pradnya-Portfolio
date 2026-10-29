import { CREDIBILITY_LABEL } from '@/lib/site'
import type { ProjectCard } from '@/lib/types'

export function StatusTag({ credibility, className = '' }: { credibility: string; className?: string }) {
  return <span className={`status-tag ${className}`}>{CREDIBILITY_LABEL[credibility] ?? credibility}</span>
}

/** Only facts that exist are rendered — no "N/A", no invented values. */
export function MetaList({ project, className = '' }: { project: ProjectCard; className?: string }) {
  const rows: [string, string | undefined][] = [
    ['Type', project.typology ?? project.category?.title],
    ['Area', project.area],
    ['Year', project.year],
    ['Location', project.location],
    ['Tools', project.tools.length ? project.tools.join(' · ') : undefined],
    ['Status', CREDIBILITY_LABEL[project.credibility]],
  ]
  return (
    <dl className={`meta-list ${className}`}>
      {rows
        .filter(([, v]) => Boolean(v))
        .map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  )
}

/** Compact inline metadata:  COMMERCIAL · 1,350 SQ.FT. · 2026 */
export function MetaLine({ project, className = '' }: { project: ProjectCard; className?: string }) {
  const parts = [project.category?.title, project.area, project.year].filter(Boolean)
  return <p className={`t-meta ${className}`}>{parts.join('  ·  ')}</p>
}
