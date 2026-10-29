import Script from 'next/script'

/**
 * Cookieless analytics — only loads when configured. Custom events go through lib/analytics.ts.
 * Tracked: project_opened, viewer_3d_opened, walkthrough_played, contact_started, contact_submitted.
 */
export function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC
  if (plausible)
    return <Script defer data-domain={plausible} src="https://plausible.io/js/script.tagged-events.js" strategy="afterInteractive" />
  if (umamiId && umamiSrc) return <Script defer data-website-id={umamiId} src={umamiSrc} strategy="afterInteractive" />
  return null
}
