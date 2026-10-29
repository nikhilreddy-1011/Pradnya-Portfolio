import type { Metadata } from 'next'

import { ArchiveView } from '@/components/project/ArchiveView'
import { JsonLd } from '@/components/layout/JsonLd'
import { getListedProjects } from '@/lib/content'
import { breadcrumbJsonLd } from '@/lib/seo'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Work',
  description: 'Project archive — residential and commercial interior design concepts, each labelled with its status.',
  alternates: { canonical: '/work' },
}

export default async function WorkPage() {
  const projects = await getListedProjects()
  return (
    <>
      <section className="pt-[calc(var(--header-h)+var(--space-xl))]">
        <div className="container-site grid-12 gap-y-6">
          <p className="t-meta col-span-4 text-muted sm:col-span-2 lg:col-span-3">Archive</p>
          <div className="col-span-4 sm:col-span-6 lg:col-span-9">
            <h1 className="t-hero">Work</h1>
            <p className="t-lead mt-6 text-muted">
              Every project is labelled with what it is — coursework, concept or professional work — so the archive reads honestly as it grows.
            </p>
          </div>
        </div>
      </section>
      <ArchiveView projects={projects} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work' }])} />
    </>
  )
}
