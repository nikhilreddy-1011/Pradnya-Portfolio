import { absoluteUrl, CREDIBILITY_LABEL, SITE_URL } from './site'
import type { Profile, Project } from './types'

export function personJsonLd(profile: Profile) {
  const knowsAbout = profile.skillGroups.filter((g) => !/professional/i.test(g.title)).flatMap((g) => g.items)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: profile.name,
    jobTitle: profile.role,
    url: SITE_URL,
    ...(profile.photo ? { image: profile.photo.url } : {}),
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    ...(profile.location
      ? { address: { '@type': 'PostalAddress', addressLocality: profile.location.split(',')[0].trim(), addressRegion: profile.location.split(',')[1]?.trim(), addressCountry: 'IN' } }
      : {}),
    knowsAbout,
    knowsLanguage: profile.languages,
    ...(profile.socialLinks.length ? { sameAs: profile.socialLinks.map((l) => l.url) } : {}),
  }
}

export function websiteJsonLd(name: string, description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: `${name} — Interior Design`,
    description,
    author: { '@id': `${SITE_URL}/#person` },
    inLanguage: 'en-IN',
  }
}

export function projectJsonLd(p: Project) {
  // Absolute, de-duplicated image URLs (the cover is usually also a gallery item).
  const images = [...new Set([p.cover, ...p.gallery.map((g) => g.image)].filter(Boolean).map((i) => (/^https?:\/\//.test(i!.url) ? i!.url : absoluteUrl(i!.url))))]
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    url: absoluteUrl(`/work/${p.slug}`),
    description: p.seo.description ?? p.summary,
    genre: p.typology ?? p.category?.title,
    creativeWorkStatus: CREDIBILITY_LABEL[p.credibility],
    keywords: [p.category?.title, ...p.tools, 'interior design'].filter(Boolean).join(', '),
    ...(images.length ? { image: images } : {}),
    ...(p.year ? { dateCreated: p.year } : {}),
    ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
    creator: { '@id': `${SITE_URL}/#person` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  }
}
