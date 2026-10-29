import type { Profile, SiteSettings } from '@/lib/types'

const SPINE = ['Plan', 'Form', 'Material', 'Space', 'Experience']

/** The narrative spine of the whole site, set as an editorial index line. */
export function IndexLine({ settings, profile }: { settings: SiteSettings; profile: Profile }) {
  return (
    <section aria-label="Approach" className="section-tight border-b border-[var(--color-line)]">
      <div className="container-site">
        <p className="t-statement t-italic flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[clamp(1.5rem,1.1rem+1.6vw,2.75rem)]" data-reveal>
          {SPINE.map((w, i) => (
            <span key={w} className="inline-flex items-baseline gap-4">
              <span>{w}</span>
              {i < SPINE.length - 1 && (
                <span aria-hidden="true" className="text-terracotta not-italic">
                  →
                </span>
              )}
            </span>
          ))}
        </p>
        <div className="grid-12 mt-[var(--space-lg)] gap-y-6">
          {settings.introText && (
            <p className="t-lead col-span-4 sm:col-span-6 lg:col-span-6 lg:col-start-7" data-reveal>
              {settings.introText}
            </p>
          )}
          {profile.availability && (
            <p className="col-span-4 sm:col-span-6 lg:col-span-6 lg:col-start-7" data-reveal style={{ ['--delay' as string]: '120ms' }}>
              <span className="status-tag text-terracotta-text">{profile.availability}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
