import type { ReactNode } from 'react'

/**
 * A case-study chapter. Text chapters use a sticky left rail (index + title);
 * `wide` chapters (plan, 3D, gallery) give the visual the full container width.
 */
export function Chapter({
  id,
  index,
  title,
  intro,
  eyebrow,
  wide = false,
  ink = false,
  children,
}: {
  id: string
  index: string
  title: string
  intro?: string
  /** Small caps line above a wide chapter's title. */
  eyebrow?: string
  wide?: boolean
  ink?: boolean
  children: ReactNode
}) {
  const headingId = `${id}-title`
  return (
    <section id={id} aria-labelledby={headingId} className={`scroll-mt-28 ${ink ? 'on-ink py-[var(--space-2xl)]' : 'py-[var(--space-xl)]'}`}>
      <div className="container-site">
        {wide ? (
          <>
            <div className="grid-12 gap-y-4 border-t border-[var(--color-line)] pt-6">
              <p className="t-meta col-span-4 tabular text-muted sm:col-span-2 lg:col-span-3" data-reveal>
                {index}
              </p>
              <div className="col-span-4 sm:col-span-6 lg:col-span-9">
                {eyebrow && (
                  <p className="t-meta mb-3 text-muted" data-reveal>
                    {eyebrow}
                  </p>
                )}
                <h2 id={headingId} className="t-section" data-reveal>
                  {title}
                </h2>
                {intro && (
                  <p className="t-body mt-4 text-muted" data-reveal>
                    {intro}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-[var(--space-lg)]">{children}</div>
          </>
        ) : (
          <div className="grid-12 gap-y-8 border-t border-[var(--color-line)] pt-6">
            <div className="col-span-4 sm:col-span-8 lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <p className="t-meta tabular text-muted" data-reveal>
                  {index}
                </p>
                <h2 id={headingId} className="t-section mt-4" data-reveal>
                  {title}
                </h2>
              </div>
            </div>
            <div className="col-span-4 sm:col-span-8 lg:col-span-7 lg:col-start-6 lg:pt-10" data-reveal>
              {children}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
