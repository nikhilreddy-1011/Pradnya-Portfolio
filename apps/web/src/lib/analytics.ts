type Props = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void
    umami?: { track: (event: string, data?: Props) => void }
  }
}

/** Fire-and-forget, privacy-friendly event. No-ops when analytics isn't configured. */
export function track(event: string, props?: Props) {
  if (typeof window === 'undefined') return
  try {
    window.plausible?.(event, props ? { props } : undefined)
    window.umami?.track(event, props)
  } catch {
    /* never let analytics break the page */
  }
}
