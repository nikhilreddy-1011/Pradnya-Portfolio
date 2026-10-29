export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

export const NAV = [
  { href: '/work', label: 'Work' },
  { href: '/#process', label: 'Process' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export const CREDIBILITY_LABEL: Record<string, string> = {
  'portfolio-coursework': 'Portfolio Project / Coursework',
  portfolio: 'Portfolio Project',
  coursework: 'Coursework',
  concept: 'Concept',
  'site-study': 'Site Study',
  professional: 'Professional Project',
  'design-study': 'Design Study',
  'portfolio-concept': 'Portfolio Concept',
  'concept-render': 'Concept Render',
}

export const telHref = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)
