import { ArrowDown } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import { Placeholder } from '@/components/ui/Placeholder'
import type { Profile, SiteSettings } from '@/lib/types'

/** Break a headline into ~3 balanced lines for the masked line reveal. "|" forces a break. */
function toLines(text: string, target = 3): string[] {
  if (text.includes('|')) return text.split('|').map((l) => l.trim())
  const words = text.split(/\s+/)
  const per = Math.ceil(text.length / target)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > per && lines.length < target - 1) {
      lines.push(cur)
      cur = w
    } else cur = cur ? `${cur} ${w}` : w
  }
  if (cur) lines.push(cur)
  return lines
}

/**
 * The hero image fills a full-height box (object-fit: cover). On any screen narrower than the
 * render's ≈2:1 shape it is drawn about 2 × the viewport height wide — far more than 100vw on
 * phones — so the browser must fetch a correspondingly wider file.
 */
const HERO_SIZES = '(max-aspect-ratio: 2/1) 200vh, 100vw'

export function Hero({ settings, profile }: { settings: SiteSettings; profile: Profile }) {
  const img = settings.heroImage
  const dark = Boolean(img) // real render → light text on a scrim
  const lines = toLines(settings.heroHeadline)

  return (
    <section
      aria-labelledby="hero-title"
      data-header-overlay={dark ? 'light' : 'dark'}
      className={`relative isolate flex min-h-[640px] flex-col overflow-hidden ${dark ? 'text-on-ink' : ''}`}
      style={{ height: '100svh', maxHeight: '1200px' }}
    >
      {/* The interior is the hero. */}
      <div className="hero-image frame absolute inset-0 -z-10">
        {img ? (
          <Picture img={img} mobile={settings.heroImageMobile} sizes={HERO_SIZES} preload />
        ) : (
          <Placeholder kind="render" corner label="Hero render — to be added" />
        )}
      </div>
      {/* Scrim tuned against real renders: text stays ≥ WCAG contrast, the interior stays bright. */}
      {dark && <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />}

      <div className="container-site mt-auto pb-[clamp(2rem,5vh,4rem)] pt-[calc(var(--header-h)+2rem)]">
        <div className="grid-12 items-end gap-y-10">
          <div className="col-span-4 sm:col-span-8 lg:col-span-8">
            <p className="t-eyebrow fade-in" style={{ ['--delay' as string]: '300ms' }}>
              {settings.heroEyebrow}
            </p>
            <h1 id="hero-title" className="t-hero mt-5 max-w-[13.5ch]">
              <span className="sr-only">
                {profile.name}, {settings.heroEyebrow}.{' '}
              </span>
              {lines.map((line, i) => (
                <span key={i} className="line-mask">
                  <span style={{ ['--delay' as string]: `${450 + i * 110}ms` }}>{line}</span>
                </span>
              ))}
            </h1>
            <a href="#selected-spaces" className="link-arrow fade-in mt-9" style={{ ['--delay' as string]: '1000ms' }}>
              Explore work <ArrowDown />
            </a>
          </div>

          {/* Identity — establishes whose portfolio this is without competing with the interior. */}
          <aside
            aria-label="About the designer"
            className="fade-in col-span-4 flex items-center gap-4 sm:col-span-8 lg:col-span-3 lg:col-start-10 lg:flex-col lg:items-start lg:gap-5"
            style={{ ['--delay' as string]: '900ms' }}
          >
            <div className="frame aspect-[4/5] w-[4.5rem] shrink-0 sm:w-24 lg:w-40 xl:w-44">
              <Picture img={profile.photo} kind="portrait" sizes="(min-width: 1440px) 176px, (min-width: 1024px) 160px, 96px" placeholderLabel="" />
            </div>
            <div>
              <p className="t-brand">{profile.name}</p>
              <p className="t-meta mt-2">{profile.role}</p>
              {(profile.location || profile.statusLine) && (
                <p className={`mt-3 text-[0.8125rem] leading-snug ${dark ? 'text-on-ink-muted' : 'text-muted'}`}>
                  {[profile.location, profile.statusLine].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
