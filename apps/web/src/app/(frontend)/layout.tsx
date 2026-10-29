import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Manrope } from 'next/font/google'
import type { ReactNode } from 'react'

import '@/styles/globals.css'

import { Analytics } from '@/components/layout/Analytics'
import { JsonLd } from '@/components/layout/JsonLd'
import { RevealObserver } from '@/components/layout/RevealObserver'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { getProfile, getSettings } from '@/lib/content'
import { personJsonLd, websiteJsonLd } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'

const display = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-instrument',
})

const body = Manrope({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-manrope',
})

export async function generateMetadata(): Promise<Metadata> {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()])
  const title = settings.seoTitle ?? `${profile.name} — Interior Design`
  const description = settings.seoDescription
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${profile.name}` },
    description,
    applicationName: profile.name,
    authors: [{ name: profile.name }],
    creator: profile.name,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: `${profile.name} — Interior Design`,
      title,
      description,
      images: settings.ogImage
        ? [{ url: settings.ogImage.url, alt: settings.ogImage.alt }]
        : [{ url: '/og', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e8' },
    { media: '(prefers-color-scheme: dark)', color: '#161614' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()])
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JS runs — content stays visible without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader name={profile.name} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter profile={profile} />
        <RevealObserver />
        <Analytics />
        <JsonLd data={[personJsonLd(profile), websiteJsonLd(profile.name, settings.seoDescription)]} />
      </body>
    </html>
  )
}
