'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics'

export function ProjectViewed({ slug }: { slug: string }) {
  useEffect(() => track('project_opened', { project: slug }), [slug])
  return null
}
