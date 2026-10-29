import type { MetadataRoute } from 'next'

import { getListedProjects } from '@/lib/content'
import { absoluteUrl } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getListedProjects()
  const now = new Date()
  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/work'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    ...projects.map((p) => ({ url: absoluteUrl(`/work/${p.slug}`), lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
  ]
}
