import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact/ContactForm'
import { JsonLd } from '@/components/layout/JsonLd'
import { Picture } from '@/components/ui/Picture'
import { getProfile, getSettings } from '@/lib/content'
import { breadcrumbJsonLd } from '@/lib/seo'
import { telHref } from '@/lib/site'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const [s, p] = await Promise.all([getSettings(), getProfile()])
  return {
    title: 'Contact',
    description: s.contactText ?? `Contact ${p.name}.`,
    alternates: { canonical: '/contact' },
  }
}

export default async function ContactPage() {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()])
  return (
    <>
      <section className="section pt-[calc(var(--header-h)+var(--space-xl))]">
        <div className="container-site grid-12 gap-y-16">
          <div className="col-span-4 sm:col-span-8 lg:col-span-5">
            <p className="t-meta text-muted fade-in">Contact</p>
            <h1 className="t-hero mt-6 max-w-[11ch]">
              <span className="line-mask">
                <span style={{ ['--delay' as string]: '150ms' }}>{settings.contactHeadline}</span>
              </span>
            </h1>
            {settings.contactText && (
              <p className="t-lead mt-8 text-muted fade-in" style={{ ['--delay' as string]: '350ms' }}>
                {settings.contactText}
              </p>
            )}

            <div className="mt-12 flex items-center gap-5 fade-in" style={{ ['--delay' as string]: '450ms' }}>
              <div className="frame aspect-square w-16 shrink-0 overflow-hidden rounded-full">
                <Picture img={profile.photo} kind="portrait" sizes="64px" placeholderLabel="" />
              </div>
              <div>
                <p className="t-brand">{profile.name}</p>
                <p className="t-meta mt-1 text-muted">
                  {profile.role}
                  {profile.location ? ` · ${profile.location}` : ''}
                </p>
              </div>
            </div>

            <dl className="mt-10 space-y-6 fade-in" style={{ ['--delay' as string]: '550ms' }}>
              {profile.email && (
                <div>
                  <dt className="t-meta text-muted">Email</dt>
                  <dd className="mt-2">
                    <a href={`mailto:${profile.email}`} className="link-underline break-all font-serif text-[clamp(1.25rem,1rem+0.8vw,1.75rem)]">
                      {profile.email}
                    </a>
                  </dd>
                </div>
              )}
              {profile.phone && (
                <div>
                  <dt className="t-meta text-muted">Phone</dt>
                  <dd className="mt-2">
                    <a href={telHref(profile.phone)} className="link-underline font-serif text-[clamp(1.25rem,1rem+0.8vw,1.75rem)]">
                      {profile.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="col-span-4 sm:col-span-8 lg:col-span-6 lg:col-start-7 lg:pt-24">
            <ContactForm projectTypes={settings.projectTypes} fallbackEmail={profile.email} />
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])} />
    </>
  )
}
