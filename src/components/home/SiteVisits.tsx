import { Picture } from '@/components/ui/Picture'
import type { Profile } from '@/lib/types'

/** Practical exposure — framed as learning, never as independently executed projects. */
export function SiteVisits({ profile }: { profile: Profile }) {
  const v = profile.siteVisits
  if (!v?.count && !v?.text) return null
  return (
    <section aria-labelledby="site-visits-title" className="section">
      <div className="container-site grid-12 gap-y-10">
        <div className="col-span-4 sm:col-span-8 lg:col-span-4">
          <p className="t-meta text-muted" data-reveal>
            On-site learning
          </p>
          {v.count ? (
            <p className="mt-6 font-serif text-[clamp(6rem,4rem+8vw,12rem)] leading-[0.8]" data-reveal aria-hidden="true">
              {v.count}
            </p>
          ) : null}
        </div>
        <div className="col-span-4 sm:col-span-8 lg:col-span-7 lg:col-start-6 lg:self-end">
          <h2 id="site-visits-title" className="t-section" data-reveal>
            {v.count ? <span className="sr-only">{v.count} </span> : null}
            {v.title ?? 'Site visits'}
          </h2>
          {v.text && (
            <p className="t-lead mt-6 text-muted" data-reveal>
              {v.text}
            </p>
          )}
          {v.points.length > 0 && (
            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3" data-reveal>
              {v.points.map((pt, i) => (
                <li key={pt} className="border-t border-[var(--color-line)] py-4 sm:pr-6">
                  <span className="t-meta tabular text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-2 text-[1.0625rem] font-medium">{pt}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {v.images.length > 0 && (
          <div className="col-span-4 grid grid-cols-2 gap-[var(--grid-gap)] sm:col-span-8 lg:col-span-12 lg:grid-cols-4">
            {v.images.map((img, i) => (
              <div key={i} className="frame aspect-[4/3]" data-reveal="image">
                <Picture img={img} sizes="(min-width: 1024px) 25vw, 50vw" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
