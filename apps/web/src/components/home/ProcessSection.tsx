import type { SiteSettings } from '@/lib/types'

/** Framed as a portfolio framework, not a claimed professional methodology. */
export function ProcessSection({ settings }: { settings: SiteSettings }) {
  if (!settings.processSteps.length) return null
  return (
    <section id="process" aria-labelledby="process-title" className="section">
      <div className="container-site">
        <div className="grid-12 gap-y-6">
          <p className="t-meta col-span-4 text-muted sm:col-span-2 lg:col-span-3" data-reveal>
            Process
          </p>
          <div className="col-span-4 sm:col-span-6 lg:col-span-9">
            <h2 id="process-title" className="t-section" data-reveal>
              The design process
            </h2>
            {settings.processIntro && (
              <p className="t-lead mt-6 text-muted" data-reveal>
                {settings.processIntro}
              </p>
            )}
          </div>
        </div>

        <ol className="mt-[var(--space-xl)] grid grid-cols-1 gap-x-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {settings.processSteps.map((s, i) => (
            <li
              key={s.title}
              className="group relative border-t border-[var(--color-line)] pb-10 pt-5"
              data-reveal
              style={{ ['--delay' as string]: `${i * 70}ms` }}
            >
              <span
                aria-hidden="true"
                className="absolute -top-px left-0 h-px w-8 bg-terracotta transition-[width] duration-700 group-hover:w-full"
              />
              <p className="t-meta tabular text-muted">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-6 font-serif text-[clamp(1.5rem,1.3rem+0.6vw,1.875rem)] leading-tight">{s.title}</h3>
              {s.caption && <p className="t-meta mt-2 text-terracotta-text">{s.caption}</p>}
              {s.text && <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{s.text}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
