'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * One IntersectionObserver for every [data-reveal] element on the page — no animation library.
 * Elements get data-in once, so nothing re-animates on scroll back.
 */
export function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.add('js', 'reveal-ready')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])'))
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.setAttribute('data-in', ''))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])
  return null
}
