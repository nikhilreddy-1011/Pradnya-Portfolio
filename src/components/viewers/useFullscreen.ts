'use client'

import { type RefObject, useCallback, useEffect, useState } from 'react'

/**
 * Element fullscreen with a CSS fallback for browsers without the Fullscreen API on
 * arbitrary elements (iPhone Safari). Esc exits either way.
 *
 * The fallback is React state (`isPseudo`), which the viewer adds to its className as
 * `is-pseudo-full`. (Adding the class to the DOM directly does not work: the next render
 * rewrites className and silently removes it.)
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isNative, setIsNative] = useState(false)
  const [isPseudo, setIsPseudo] = useState(false)

  useEffect(() => {
    const onChange = () => setIsNative(document.fullscreenElement === ref.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [ref])

  // Lock page scroll while the CSS fallback covers the screen.
  useEffect(() => {
    if (!isPseudo) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsPseudo(false)
    document.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [isPseudo])

  const toggle = useCallback(async () => {
    const el = ref.current
    if (!el) return
    if (document.fullscreenElement) return void (await document.exitFullscreen())
    if (isPseudo) return setIsPseudo(false)
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen()
        return
      } catch {
        /* fall through to CSS fullscreen */
      }
    }
    setIsPseudo(true)
  }, [ref, isPseudo])

  return { isFull: isNative || isPseudo, isPseudo, toggle }
}
