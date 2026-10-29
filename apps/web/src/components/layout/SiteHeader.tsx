'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { NAV } from '@/lib/site'

/**
 * Transparent over a full-bleed hero (pages opt in with data-header-overlay="light|dark"),
 * then settles into a compact ivory bar with a hairline once the visitor scrolls.
 */
export function SiteHeader({ name }: { name: string }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [overlay, setOverlay] = useState<null | 'light' | 'dark'>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-header-overlay]')
    setOverlay((el?.dataset.headerOverlay as 'light' | 'dark' | undefined) ?? null)
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile drawer: Esc closes, focus moves in and back, page scroll locked.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuRef.current?.querySelector<HTMLElement>('a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab' && menuRef.current) {
        const f = menuRef.current.querySelectorAll<HTMLElement>('a,button')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      buttonRef.current?.focus()
    }
  }, [open])

  const transparent = overlay !== null && !scrolled && !open
  const light = transparent && overlay === 'light'
  const isActive = (href: string) => (href === '/work' ? pathname.startsWith('/work') : pathname === href)

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color,height] duration-500"
        style={{
          height: scrolled ? '3.75rem' : 'var(--header-h)',
          backgroundColor: transparent ? 'transparent' : 'color-mix(in srgb, var(--color-background) 94%, transparent)',
          color: light ? 'var(--color-on-ink)' : 'var(--color-text)',
          borderBottom: `1px solid ${transparent ? 'transparent' : 'var(--color-line)'}`,
          backdropFilter: transparent ? undefined : 'saturate(1.2) blur(10px)',
          WebkitBackdropFilter: transparent ? undefined : 'saturate(1.2) blur(10px)',
        }}
      >
        <div className="container-site flex h-full items-center justify-between gap-6">
          <Link href="/" className="t-brand" aria-label={`${name} — home`}>
            {name}
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="t-ui relative py-2 opacity-90 transition-opacity hover:opacity-100"
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 h-px origin-left bg-current transition-transform duration-500"
                      style={{ transform: `scaleX(${isActive(item.href) ? 1 : 0})` }}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={buttonRef}
            type="button"
            className="t-ui -mr-2 inline-flex min-h-11 items-center gap-3 px-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
            <span aria-hidden="true" className="relative block h-2.5 w-5">
              <span className="absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300" style={{ transform: open ? 'translateY(5px) rotate(45deg)' : undefined }} />
              <span className="absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300" style={{ transform: open ? 'translateY(-4px) rotate(-45deg)' : undefined }} />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile / tablet drawer */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className="fixed inset-0 z-40 bg-ivory pt-[var(--header-h)] lg:hidden"
      >
        <nav aria-label="Mobile" className="container-site flex h-full flex-col justify-between pb-10 pt-8">
          <ul className="space-y-2">
            {NAV.map((item, i) => (
              <li key={item.href} className="fade-in" style={{ ['--delay' as string]: `${i * 60}ms` }}>
                <Link href={item.href} className="t-section block py-2" onClick={() => setOpen(false)} aria-current={isActive(item.href) ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="t-meta text-muted">{name} — Interior Design</p>
        </nav>
      </div>
    </>
  )
}
