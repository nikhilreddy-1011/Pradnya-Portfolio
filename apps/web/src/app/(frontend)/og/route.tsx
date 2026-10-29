import { ImageResponse } from 'next/og'

import { getProfile, getSettings } from '@/lib/content'

const size = { width: 1200, height: 630 }

/**
 * Typographic share card (/og) — the default social image when no OG image is uploaded in
 * Site Settings. Project pages use their own cover render instead.
 */
export const revalidate = 86400

export async function GET() {
  const [p, s] = await Promise.all([getProfile(), getSettings()])
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f5f1e8', color: '#1d1d1b', padding: 72, fontFamily: 'serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, letterSpacing: 2 }}>
          <span>{p.name.toUpperCase()}</span>
          <span style={{ fontFamily: 'sans-serif', fontSize: 18, letterSpacing: 4, color: '#65594c' }}>INTERIOR DESIGN</span>
        </div>
        <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.02, maxWidth: 900 }}>{s.heroHeadline}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'sans-serif', fontSize: 20, letterSpacing: 3, color: '#65594c' }}>
          <div style={{ width: 48, height: 2, background: '#a65f45' }} />
          PLAN · FORM · MATERIAL · SPACE · EXPERIENCE
        </div>
      </div>
    ),
    size,
  )
}
