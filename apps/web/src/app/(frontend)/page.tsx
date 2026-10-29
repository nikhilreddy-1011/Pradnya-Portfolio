import { AboutTeaser } from '@/components/home/AboutTeaser'
import { ContactCta } from '@/components/home/ContactCta'
import { Hero } from '@/components/home/Hero'
import { IndexLine } from '@/components/home/IndexLine'
import { ProcessSection } from '@/components/home/ProcessSection'
import { SelectedSpaces } from '@/components/home/SelectedSpaces'
import { SiteVisits } from '@/components/home/SiteVisits'
import { StepInside } from '@/components/home/StepInside'
import { getFeaturedProjects, getProfile, getSettings, toCard } from '@/lib/content'

export const revalidate = 3600 // safety net; publishing in /admin revalidates instantly

export default async function HomePage() {
  const [settings, profile, featured] = await Promise.all([getSettings(), getProfile(), getFeaturedProjects()])
  const withModel = featured.find((p) => p.models.length > 0)

  return (
    <>
      <Hero settings={settings} profile={profile} />
      <IndexLine settings={settings} profile={profile} />
      <SelectedSpaces projects={featured.map(toCard)} />
      {withModel && <div className="h-[var(--space-2xl)]" aria-hidden="true" />}
      <StepInside project={withModel} />
      <ProcessSection settings={settings} />
      <AboutTeaser profile={profile} />
      <SiteVisits profile={profile} />
      <ContactCta settings={settings} profile={profile} />
    </>
  )
}
