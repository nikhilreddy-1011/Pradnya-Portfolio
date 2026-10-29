import Link from 'next/link'

import { NAV, telHref } from '@/lib/site'
import type { Profile } from '@/lib/types'

export function SiteFooter({ profile }: { profile: Profile }) {
  const year = new Date().getFullYear()
  return (
    <footer className="on-ink">
      <div className="container-site grid-12 gap-y-12 border-t border-[var(--color-ink-line)] pb-10 pt-[var(--space-xl)]">
        <div className="col-span-4 sm:col-span-8 lg:col-span-5">
          <p className="t-brand">{profile.name}</p>
          <p className="mt-4 text-[0.9375rem] text-on-ink-muted">
            {profile.role}
            {profile.location && (
              <>
                <br />
                {profile.location}
              </>
            )}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-3">
          <p className="t-meta text-on-ink-muted">Contact</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem]">
            {profile.email && (
              <li>
                <a className="link-underline break-all" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
              </li>
            )}
            {profile.phone && (
              <li>
                <a className="link-underline" href={telHref(profile.phone)}>
                  {profile.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-2">
          <p className="t-meta text-on-ink-muted">Index</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link className="link-underline" href={n.href}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {profile.socialLinks.length > 0 && (
          <div className="col-span-4 sm:col-span-4 lg:col-span-2">
            <p className="t-meta text-on-ink-muted">Elsewhere</p>
            <ul className="mt-4 space-y-2 text-[0.9375rem]">
              {profile.socialLinks.map((l) => (
                <li key={l.url}>
                  <a className="link-underline" href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="col-span-4 flex flex-col justify-between gap-3 border-t border-[var(--color-ink-line)] pt-6 text-[0.8125rem] text-on-ink-muted sm:col-span-8 sm:flex-row lg:col-span-12">
          <p>
            © {year} {profile.name}
          </p>
          <p>Portfolio projects are coursework unless marked otherwise.</p>
        </div>
      </div>
    </footer>
  )
}
