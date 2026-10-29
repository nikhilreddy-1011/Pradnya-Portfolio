import Link from 'next/link'

import { ArrowRight } from '@/components/ui/Icons'

export default function NotFound() {
  return (
    <section className="section flex min-h-[80svh] items-end pt-[calc(var(--header-h)+var(--space-xl))]">
      <div className="container-site">
        <p className="t-meta text-muted">404</p>
        <h1 className="t-hero mt-6 max-w-[14ch]">This room isn’t on the plan.</h1>
        <div className="mt-10 flex flex-wrap gap-6">
          <Link href="/work" className="link-arrow">
            See the work <ArrowRight />
          </Link>
          <Link href="/" className="link-arrow">
            Back home <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}
