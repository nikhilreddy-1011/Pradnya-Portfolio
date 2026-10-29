import type { Metadata } from 'next'
import Link from 'next/link'

import { Journey } from '@/components/about/Journey'
import { SiteVisits } from '@/components/home/SiteVisits'
import { JsonLd } from '@/components/layout/JsonLd'
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import { getProfile } from '@/lib/content'
import { paragraphs } from '@/lib/media'
import { breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile()
  return {
    title: 'About',
    description: p.aboutIntro,
    alternates: { canonical: '/about' },
    ...(p.photo ? { openGraph: { images: [{ url: p.photo.url, alt: p.photo.alt }] } } : {}),
  }
}

export default async function AboutPage() {
  const p = await getProfile()
  const first = p.name.split(' ')[0]

  return (
    <>
      {/* Intro */}
      <section className="pt-[calc(var(--header-h)+var(--space-xl))]">
        <div className="container-site grid-12 gap-y-12">
          <div className="col-span-4 sm:col-span-8 lg:col-span-6">
            <p className="t-meta text-muted fade-in">About</p>
            <h1 className="t-hero mt-6">
              <span className="line-mask">
                <span style={{ ['--delay' as string]: '150ms' }}>{p.aboutHeadline ?? p.name}</span>
              </span>
            </h1>
            {p.aboutIntro && (
              <p className="t-lead mt-10 fade-in" style={{ ['--delay' as string]: '400ms' }}>
                {p.aboutIntro}
              </p>
            )}
            <dl className="meta-list mt-12 fade-in lg:grid-cols-2" style={{ ['--delay' as string]: '550ms' }}>
              <div>
                <dt>Name</dt>
                <dd>{p.name}</dd>
              </div>
              {p.location && (
                <div>
                  <dt>Based in</dt>
                  <dd>{p.location}</dd>
                </div>
              )}
              {p.statusLine && (
                <div>
                  <dt>Now</dt>
                  <dd>{p.statusLine}</dd>
                </div>
              )}
              {p.languages.length > 0 && (
                <div>
                  <dt>Languages</dt>
                  <dd>{p.languages.join(', ')}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="col-span-4 sm:col-span-6 sm:col-start-2 lg:col-span-5 lg:col-start-8">
            <div className="hero-image frame aspect-[4/5]">
              <Picture img={p.photo} kind="portrait" preload sizes="(min-width: 1024px) 40vw, (min-width: 640px) 75vw, 100vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      {p.aboutBody && (
        <section className="section">
          <div className="container-site grid-12">
            <div className="t-lead prose-flow col-span-4 sm:col-span-8 lg:col-span-7 lg:col-start-6" data-reveal>
              {paragraphs(p.aboutBody).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Transferable strengths */}
      {p.transferable.length > 0 && (
        <section aria-labelledby="discipline-title" className="section bg-paper">
          <div className="container-site">
            <div className="grid-12 gap-y-6">
              <p className="t-meta col-span-4 text-muted sm:col-span-2 lg:col-span-3" data-reveal>
                Carried forward
              </p>
              <div className="col-span-4 sm:col-span-6 lg:col-span-9">
                <h2 id="discipline-title" className="t-section" data-reveal>
                  Discipline, carried into design.
                </h2>
                <p className="t-lead mt-6 text-muted" data-reveal>
                  Eight-plus years in banking and credit management built the habits design work depends on.
                </p>
              </div>
            </div>
            <ol className="mt-[var(--space-xl)] grid grid-cols-1 gap-x-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-3">
              {p.transferable.map((t, i) => (
                <li key={t.title} className="border-t border-[var(--color-line)] pb-10 pt-5" data-reveal style={{ ['--delay' as string]: `${(i % 3) * 80}ms` }}>
                  <span className="t-meta tabular text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-5 font-serif text-[clamp(1.5rem,1.3rem+0.6vw,2rem)] leading-tight">{t.title}</h3>
                  {t.text && <p className="mt-3 text-muted">{t.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Skills */}
      {p.skillGroups.length > 0 && (
        <section aria-labelledby="skills-title" className="section">
          <div className="container-site">
            <div className="grid-12 gap-y-6">
              <p className="t-meta col-span-4 text-muted sm:col-span-2 lg:col-span-3" data-reveal>
                Skills
              </p>
              <h2 id="skills-title" className="t-section col-span-4 sm:col-span-6 lg:col-span-9" data-reveal>
                Tools and focus
              </h2>
            </div>
            <div className="mt-[var(--space-xl)] grid grid-cols-1 gap-x-[var(--grid-gap)] gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {p.skillGroups.map((g) => (
                <div key={g.title} data-reveal>
                  <h3 className="t-meta border-b border-[var(--color-line)] pb-4 text-muted">{g.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {g.items.map((s) => (
                      <li key={s} className="font-serif text-[clamp(1.25rem,1.15rem+0.4vw,1.5rem)] leading-snug">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journey */}
      <section aria-labelledby="journey-title" className="section pt-0">
        <div className="container-site">
          <div className="grid-12 gap-y-6 pb-[var(--space-lg)]">
            <p className="t-meta col-span-4 text-muted sm:col-span-2 lg:col-span-3" data-reveal>
              Journey
            </p>
            <h2 id="journey-title" className="t-section col-span-4 sm:col-span-6 lg:col-span-9" data-reveal>
              From credit to space
            </h2>
          </div>
          <Journey profile={p} />
        </div>
      </section>

      {/* Recognition + strengths */}
      {(p.achievements.length > 0 || p.strengths.length > 0) && (
        <section className="section bg-paper">
          <div className="container-site grid-12 gap-y-12">
            {p.achievements.length > 0 && (
              <div className="col-span-4 sm:col-span-4 lg:col-span-5" data-reveal>
                <h2 className="t-meta text-muted">Recognition</h2>
                <ul className="mt-6 space-y-3">
                  {p.achievements.map((a) => (
                    <li key={a} className="font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2.25rem)] leading-tight">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.strengths.length > 0 && (
              <div className="col-span-4 sm:col-span-4 lg:col-span-6 lg:col-start-7" data-reveal>
                <h2 className="t-meta text-muted">Strengths</h2>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {p.strengths.map((s) => (
                    <li key={s} className="chip pointer-events-none">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <SiteVisits profile={p} />

      <section className="section on-ink">
        <div className="container-site flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="t-section max-w-[16ch]" data-reveal>
            {p.availability ?? `Work with ${first}`}
          </h2>
          <div className="flex flex-wrap gap-3" data-reveal>
            <Link href="/contact" className="btn">
              Get in touch <ArrowRight />
            </Link>
            {p.cvUrl && (
              <a href={p.cvUrl} className="btn" target="_blank" rel="noopener noreferrer">
                Download CV <ArrowUpRight />
              </a>
            )}
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
    </>
  )
}
