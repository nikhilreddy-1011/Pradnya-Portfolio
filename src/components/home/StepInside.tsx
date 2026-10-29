import Link from 'next/link'

import { ArrowRight } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import type { Project } from '@/lib/types'

/**
 * Appears only when a featured project has a real 3D model. The homepage never loads WebGL —
 * it shows the model's poster and hands off to the case study.
 */
export function StepInside({ project }: { project: Project | undefined }) {
  const model = project?.models[0]
  if (!project || !model) return null
  return (
    <section aria-labelledby="step-inside-title" className="on-ink">
      <Link href={`/work/${project.slug}#model`} className="group relative block">
        <div className="frame frame-zoom aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
          <Picture img={model.poster ?? project.cover} ink sizes="100vw" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[rgb(16_16_14/0.75)] via-transparent to-transparent" />
        </div>
        <div className="container-site absolute inset-x-0 bottom-0 pb-[var(--space-lg)]">
          <p className="t-meta text-on-ink-muted">Interactive 3D · {project.title}</p>
          <h2 id="step-inside-title" className="t-section mt-4">
            Step inside
          </h2>
          <span className="link-arrow mt-6">
            Explore the model <ArrowRight />
          </span>
        </div>
      </Link>
    </section>
  )
}
