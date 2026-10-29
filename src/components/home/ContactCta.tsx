import Link from 'next/link'

import { ArrowRight } from '@/components/ui/Icons'
import { telHref } from '@/lib/site'
import type { Profile, SiteSettings } from '@/lib/types'

export function ContactCta({ settings, profile }: { settings: SiteSettings; profile: Profile }) {
  return (
    <section aria-labelledby="contact-cta-title" className="on-ink section">
      <div className="container-site grid-12 gap-y-10">
        <div className="col-span-4 sm:col-span-8 lg:col-span-7">
          <p className="t-meta text-on-ink-muted" data-reveal>
            Contact
          </p>
          <h2 id="contact-cta-title" className="t-hero mt-6 max-w-[12ch]" data-reveal>
            {settings.contactHeadline}
          </h2>
        </div>
        <div className="col-span-4 flex flex-col justify-end gap-8 sm:col-span-6 lg:col-span-4 lg:col-start-9">
          {settings.contactText && (
            <p className="t-body text-on-ink-muted" data-reveal>
              {settings.contactText}
            </p>
          )}
          <div className="space-y-3" data-reveal>
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="link-underline block break-all font-serif text-[clamp(1.25rem,1rem+0.8vw,1.75rem)]">
                {profile.email}
              </a>
            )}
            {profile.phone && (
              <a href={telHref(profile.phone)} className="link-underline block font-serif text-[clamp(1.25rem,1rem+0.8vw,1.75rem)]">
                {profile.phone}
              </a>
            )}
          </div>
          <Link href="/contact" className="btn self-start" data-reveal>
            Send an inquiry <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}
