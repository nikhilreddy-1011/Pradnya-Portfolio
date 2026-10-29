import type { Metadata } from 'next'

import { FloorPlanViewer } from '@/components/viewers/FloorPlanViewer'
import { ModelStage } from '@/components/viewers/ModelStage'
import { demoModel, demoPlan } from '@/content/demo'

export const metadata: Metadata = {
  title: 'Viewer preview',
  robots: { index: false, follow: false },
}

/**
 * Internal preview of the plan + 3D pipeline using generic demonstration geometry
 * (scripts/make-demo-glb.mjs). Not linked from navigation; excluded from search.
 */
export default function LabPage() {
  return (
    <>
      <section className="pt-[calc(var(--header-h)+var(--space-xl))]">
        <div className="container-site grid-12 gap-y-6">
          <p className="t-meta col-span-4 text-muted sm:col-span-2 lg:col-span-3">Viewer preview</p>
          <div className="col-span-4 sm:col-span-6 lg:col-span-9">
            <h1 className="t-section">Plan → 3D, end to end</h1>
            <p className="t-lead mt-6 text-muted">
              This page uses generic demonstration geometry to show how case studies behave once real AutoCAD plan exports and optimised
              SketchUp models are uploaded in the admin.
            </p>
            <p className="status-tag mt-6 text-terracotta-text">Demonstration geometry — not a portfolio project</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="lab-plan" className="section">
        <div className="container-site">
          <h2 id="lab-plan" className="t-meta mb-6 text-muted">
            01 · Interactive floor plan — select a room, then “View in 3D”
          </h2>
          <FloorPlanViewer plan={demoPlan} has3D />
        </div>
      </section>

      <section id="model" aria-labelledby="lab-model" className="section on-ink">
        <div className="container-site">
          <h2 id="lab-model" className="t-meta mb-6 text-on-ink-muted">
            02 · 3D model — plan, walls, floor, furniture, materials, light
          </h2>
          <ModelStage model={demoModel} projectSlug="lab-demo" fallbackHref="#lab-plan" />
        </div>
      </section>
    </>
  )
}
