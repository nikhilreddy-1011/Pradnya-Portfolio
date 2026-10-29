'use client'

import { useEffect, useState } from 'react'

/** Sticky chapter index. Highlights the chapter in view; scrolls horizontally on small screens. */
export function ChapterNav({ chapters, title }: { chapters: { id: string; label: string }[]; title: string }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [chapters])

  if (chapters.length < 3) return null
  return (
    <nav
      aria-label={`${title} — chapters`}
      className="sticky top-[3.75rem] z-30 mt-[var(--space-xl)] border-y border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-background)_92%,transparent)] backdrop-blur-md"
    >
      <div className="container-site flex items-center gap-8">
        <p className="t-meta hidden shrink-0 text-muted xl:block">{title}</p>
        <ul className="-mx-2 flex flex-1 gap-1 overflow-x-auto px-2 [scrollbar-width:none] xl:justify-end">
          {chapters.map((c) => (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                aria-current={active === c.id ? 'true' : undefined}
                className={`t-ui inline-flex min-h-12 items-center border-b px-3 transition-colors ${
                  active === c.id ? 'border-terracotta text-[var(--color-text)]' : 'border-transparent text-muted hover:text-[var(--color-text)]'
                }`}
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
