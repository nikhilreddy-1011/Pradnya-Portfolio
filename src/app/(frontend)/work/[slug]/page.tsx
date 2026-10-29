import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/layout/JsonLd'
import { BeforeAfter } from '@/components/project/BeforeAfter'
import { Chapter } from '@/components/project/Chapter'
import { ChapterNav } from '@/components/project/ChapterNav'
import { Gallery } from '@/components/project/Gallery'
import { MaterialStory } from '@/components/project/MaterialStory'
import { NextProject } from '@/components/project/NextProject'
import { ProjectHero } from '@/components/project/ProjectHero'
import { RelatedProjects } from '@/components/project/RelatedProjects'
import { ProjectViewed } from '@/components/project/ProjectViewed'
import { Picture } from '@/components/ui/Picture'
import { FloorPlanViewer } from '@/components/viewers/FloorPlanViewer'
import { ModelStage } from '@/components/viewers/ModelStage'
import { PanoramaRooms } from '@/components/viewers/PanoramaRooms'
import { WalkthroughPlayer } from '@/components/viewers/WalkthroughPlayer'
import { getAllProjects, getProject } from '@/lib/content'
import { paragraphs } from '@/lib/media'
import { breadcrumbJsonLd, projectJsonLd } from '@/lib/seo'

export const revalidate = 3600
export const dynamicParams = true // new projects work before the next deploy

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getAllProjects()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const data = await getProject(slug)
  if (!data) return {}
  const p = data.project
  const image = p.seo.image ?? p.cover
  const title = p.seo.title ?? p.title
  const description = p.seo.description ?? p.summary
  return {
    title,
    description,
    alternates: { canonical: `/work/${p.slug}` },
    robots: p.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: { type: 'article', title, description, images: image ? [{ url: image.url, alt: image.alt }] : [{ url: '/og', width: 1200, height: 630 }] },
  }
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const data = await getProject(slug)
  if (!data) notFound()
  const { project: p, next, related } = data

  // Chapters are rendered only when their content exists — nothing is padded or invented.
  const hasConcept = Boolean(p.conceptStatement || p.concept)
  const hasBrief = Boolean(p.brief || p.programme.length)
  const hasPlanning = Boolean(p.spacePlanning || p.process.length)
  // A single-render project shows its full render in the hero (which opens the lightbox) — no repeated section.
  const heroIsRender = Boolean(p.cover && p.gallery.length === 1 && p.gallery[0].image.url === p.cover.url)
  const visuals = heroIsRender ? [] : p.gallery.filter((g) => g.layout === 'full')
  const gallery = heroIsRender ? [] : p.gallery.filter((g) => g.layout !== 'full')

  const visualsLabel = visuals.length === 1 ? 'Main render' : 'Renders'

  const chapters = [
    hasConcept && { id: 'concept', label: 'Concept' },
    hasBrief && { id: 'brief', label: 'Brief' },
    hasPlanning && { id: 'planning', label: 'Planning' },
    p.designDetails.length > 0 && { id: 'details', label: 'Details' },
    p.floorPlans.length > 0 && { id: 'plan', label: 'Floor plan' },
    p.panoramas.length > 0 && { id: 'space-360', label: '360°' },
    p.models.length > 0 && { id: 'model', label: '3D' },
    p.videos.length > 0 && { id: 'walkthrough', label: 'Walkthrough' },
    (p.materials.length > 0 || p.palette.length > 0) && { id: 'materials', label: 'Materials' },
    visuals.length > 0 && { id: 'visualisation', label: visualsLabel },
    (gallery.length > 0 || p.beforeAfter.length > 0) && { id: 'gallery', label: 'Gallery' },
  ].filter(Boolean) as { id: string; label: string }[]
  const n = (id: string) => String(chapters.findIndex((c) => c.id === id) + 1).padStart(2, '0')

  return (
    <article>
      <ProjectHero project={p} />
      <ChapterNav chapters={chapters} title={p.title} />

      {hasConcept && (
        <Chapter id="concept" index={n('concept')} title="The concept">
          {p.conceptStatement && <p className="t-statement t-italic max-w-[22ch]">{p.conceptStatement}</p>}
          {p.concept && (
            <div className="t-lead prose-flow mt-8">
              {paragraphs(p.concept).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          )}
        </Chapter>
      )}

      {hasBrief && (
        <Chapter id="brief" index={n('brief')} title="The brief">
          {p.brief && (
            <div className="t-lead prose-flow">
              {paragraphs(p.brief).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          )}
          {p.programme.length > 0 && (
            <div className="mt-10">
              <p className="t-meta text-muted">Programme</p>
              <ol className="mt-4 grid grid-cols-1 sm:grid-cols-2">
                {p.programme.map((item, i) => (
                  <li key={item} className="flex items-baseline gap-4 border-t border-[var(--color-line)] py-4 sm:pr-8">
                    <span className="t-meta tabular text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-serif text-[clamp(1.25rem,1.1rem+0.5vw,1.625rem)]">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Chapter>
      )}

      {hasPlanning && (
        <Chapter id="planning" index={n('planning')} title="Space planning">
          {p.spacePlanning && (
            <div className="t-lead prose-flow">
              {paragraphs(p.spacePlanning).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          )}
          {p.process.length > 0 && (
            <ol className="mt-10 space-y-0">
              {p.process.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[3rem_1fr] border-t border-[var(--color-line)] py-5">
                  <span className="t-meta tabular text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    {s.text && <p className="mt-1 text-muted">{s.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Chapter>
      )}

      {p.designDetails.length > 0 && (
        <Chapter id="details" index={n('details')} title="Design details">
          <ol className="grid grid-cols-1 gap-x-[var(--grid-gap)] sm:grid-cols-2">
            {p.designDetails.map((d, i) => (
              <li key={d.title} className="border-t border-[var(--color-line)] py-6 sm:pr-6">
                {d.image && (
                  <div className="frame mb-5 aspect-[4/3]">
                    <Picture img={d.image} sizes="(min-width: 1024px) 30vw, 100vw" />
                  </div>
                )}
                <span className="t-meta tabular text-muted">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 font-serif text-[clamp(1.375rem,1.2rem+0.6vw,1.875rem)] leading-tight">{d.title}</h3>
                {d.text && <p className="mt-3 text-muted">{d.text}</p>}
              </li>
            ))}
          </ol>
        </Chapter>
      )}

      {p.floorPlans.length > 0 && (
        <Chapter id="plan" index={n('plan')} title="Floor plan" wide intro="Pan, zoom and select a room. Where a 3D view exists, jump straight into it.">
          {p.floorPlans.map((plan) => (
            <FloorPlanViewer key={plan.id} plan={plan} has3D={p.models.length > 0} />
          ))}
        </Chapter>
      )}

      {p.panoramas.length > 0 && (
        <Chapter
          id="space-360"
          index={n('space-360')}
          eyebrow="360° space"
          title={p.panoramas.length === 1 && p.panoramas[0].label ? `Step inside the ${p.panoramas[0].label.toLowerCase()}` : 'Step inside'}
          intro={p.panoramas.length === 1 ? p.panoramas[0].description : undefined}
          wide
          ink
        >
          <PanoramaRooms panoramas={p.panoramas} projectSlug={p.slug} />
        </Chapter>
      )}

      {p.models.length > 0 && (
        <Chapter
          id="model"
          index={n('model')}
          eyebrow={p.models[0].kind ? 'Interactive 3D model' : undefined}
          title={p.models[0].kind ? p.models[0].title : '3D model'}
          wide
          ink
          intro={p.models[0].description ?? (p.models[0].kind ? undefined : 'Watch the plan become a space, then orbit, zoom and explore.')}
        >
          <ModelStage model={p.models[0]} projectSlug={p.slug} fallbackHref={gallery.length ? '#gallery' : visuals.length ? '#visualisation' : '#main'} />
        </Chapter>
      )}

      {p.videos.length > 0 && (
        <Chapter id="walkthrough" index={n('walkthrough')} title="Walkthrough" wide ink>
          <div className="space-y-[var(--space-xl)]">
            {p.videos.map((v) => (
              <WalkthroughPlayer key={v.id} video={v} projectSlug={p.slug} />
            ))}
          </div>
        </Chapter>
      )}

      {(p.materials.length > 0 || p.palette.length > 0) && (
        <Chapter id="materials" index={n('materials')} title="Material & colour" wide>
          <MaterialStory materials={p.materials} palette={p.palette} />
        </Chapter>
      )}

      {visuals.length > 0 && (
        <Chapter id="visualisation" index={n('visualisation')} title={visualsLabel} wide>
          <Gallery items={visuals} title={p.title} variant="stack" />
        </Chapter>
      )}

      {(gallery.length > 0 || p.beforeAfter.length > 0) && (
        <Chapter id="gallery" index={n('gallery')} title="Gallery" wide>
          {gallery.length > 0 && <Gallery items={gallery} title={p.title} variant="masonry" />}
          {p.beforeAfter.map((ba, i) => (
            <BeforeAfter key={i} before={ba.before} after={ba.after} caption={ba.caption} />
          ))}
        </Chapter>
      )}

      <RelatedProjects projects={related} />
      {next && <NextProject project={next} />}

      <ProjectViewed slug={p.slug} />
      <JsonLd
        data={[
          projectJsonLd(p),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Work', path: '/work' },
            { name: p.title, path: `/work/${p.slug}` },
          ]),
        ]}
      />
    </article>
  )
}
