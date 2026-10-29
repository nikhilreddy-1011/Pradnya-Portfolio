import Link from 'next/link'

import { ArrowRight } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import type { Profile } from '@/lib/types'

export function AboutTeaser({ profile }: { profile: Profile }) {
  return (
    <section aria-labelledby="about-teaser-title" className="section bg-paper">
      <div className="container-site grid-12 items-center gap-y-12">
        <div className="col-span-4 sm:col-span-5 lg:col-span-5">
          <div className="frame aspect-[4/5]" data-reveal="image">
            <Picture img={profile.photo} kind="portrait" sizes="(min-width: 1024px) 38vw, (min-width: 640px) 60vw, 100vw" />
          </div>
        </div>
        <div className="col-span-4 sm:col-span-8 lg:col-span-6 lg:col-start-7">
          <p className="t-meta text-muted" data-reveal>
            About
          </p>
          <h2 id="about-teaser-title" className="t-section mt-6" data-reveal>
            {profile.aboutHeadline ?? 'About'}
          </h2>
          {profile.aboutIntro && (
            <p className="t-lead mt-8" data-reveal>
              {profile.aboutIntro}
            </p>
          )}
          {profile.transferable.length > 0 && (
            <ul className="mt-10 grid grid-cols-1 gap-x-8 sm:grid-cols-2" data-reveal>
              {profile.transferable.slice(0, 4).map((t) => (
                <li key={t.title} className="border-t border-[var(--color-line)] py-4">
                  <span className="t-meta">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/about" className="link-arrow mt-10" data-reveal>
            More about {profile.name.split(' ')[0]} <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}
