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
 * Two compositions, switched in CSS (.hero in globals.css):
 *  - Cinematic (wide screens): the image fills a full-height box and the text overlays it. On a
 *    screen narrower than the render's ≈2:1 shape it is drawn about 2 × the viewport height wide.
 *  - Stacked (portrait / short screens): the image sits in its own frame at the file's natural
 *    aspect ratio, full width and uncropped; headline, CTA and identity follow underneath.
 * `sizes` mirrors that switch so phones fetch a ~100vw file rather than a 2 × 100vh one.
 */
const HERO_SIZES = '(max-aspect-ratio: 5/4) 100vw, (max-height: 560px) 100vw, (max-aspect-ratio: 2/1) 200vh, 100vw'

export function Hero({ settings, profile }: { settings: SiteSettings; profile: Profile }) {
  const img = settings.heroImage
  const dark = Boolean(img) // real render → light text on a scrim
  const lines = toLines(settings.heroHeadline)

  return (
    <section
      aria-labelledby="hero-title"
      data-header-overlay={dark ? 'light' : 'dark'}
      className={`hero ${dark ? 'hero--dark text-on-ink' : ''}`}
    >
      {/* The interior is the hero. Its frame takes the file's real aspect ratio (no layout shift, no crop). */}
      <div
        className="hero-image frame"
        style={img?.width && img?.height ? { ['--hero-ar' as string]: `${img.width} / ${img.height}` } : undefined}
      >
        {img ? (
          <Picture img={img} mobile={settings.heroImageMobile} sizes={HERO_SIZES} preload />
        ) : (
          <Placeholder kind="render" corner label="Hero render — to be added" />
        )}
      </div>
      {/* Scrim tuned against real renders: text stays ≥ WCAG contrast, the interior stays bright. */}
      {dark && <div aria-hidden="true" className="hero-scrim" />}

      <div className="hero-content container-site">
        <div className="hero-grid grid-12 items-end">
          <div className="col-span-4 sm:col-span-8 lg:col-span-8">
            <p className="t-eyebrow fade-in" style={{ ['--delay' as string]: '300ms' }}>
              {settings.heroEyebrow}
            </p>
            <h1 id="hero-title" className="t-hero mt-4 max-w-[13.5ch] lg:mt-5">
              <span className="sr-only">
                {profile.name}, {settings.heroEyebrow}.{' '}
              </span>
              {lines.map((line, i) => (
                <span key={i} className="line-mask">
                  <span style={{ ['--delay' as string]: `${450 + i * 110}ms` }}>{line}</span>
                </span>
              ))}
            </h1>
            <a href="#selected-spaces" className="link-arrow fade-in mt-7 lg:mt-9" style={{ ['--delay' as string]: '1000ms' }}>
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
