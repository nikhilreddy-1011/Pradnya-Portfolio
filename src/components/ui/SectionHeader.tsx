import type { ReactNode } from 'react'

export function SectionHeader({
  index,
  eyebrow,
  title,
  children,
  id,
  className = '',
}: {
  index?: string
  eyebrow?: string
  title: ReactNode
  children?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <header className={`grid-12 gap-y-6 ${className}`}>
      <div className="col-span-4 sm:col-span-2 lg:col-span-3">
        {(index || eyebrow) && (
          <p className="t-meta text-muted" data-reveal>
            {index && <span className="tabular mr-3">{index}</span>}
            {eyebrow}
          </p>
        )}
      </div>
      <div className="col-span-4 sm:col-span-6 lg:col-span-9">
        <h2 id={id} className="t-section" data-reveal>
          {title}
        </h2>
        {children && (
          <div className="t-lead text-muted mt-6" data-reveal style={{ ['--delay' as string]: '120ms' }}>
            {children}
          </div>
        )}
      </div>
    </header>
  )
}
