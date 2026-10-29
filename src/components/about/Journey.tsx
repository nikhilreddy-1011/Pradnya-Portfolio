import type { Profile } from '@/lib/types'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const parse = (s?: string) => {
  if (!s) return null
  const y = Number(s.match(/\d{4}/)?.[0])
  const m = MONTHS.indexOf(s.slice(0, 3).toLowerCase())
  return Number.isFinite(y) ? y * 12 + Math.max(0, m) : null
}
const year = (s?: string) => s?.match(/\d{4}/)?.[0]

type Entry = { key: number; years: string; title: string; org?: string; dates?: string; text?: string; design?: boolean; current?: boolean }

/** Career + education as one editorial timeline, in CV order of time. Dates are shown exactly as supplied. */
export function Journey({ profile }: { profile: Profile }) {
  const entries: Entry[] = [
    ...profile.education.map((e) => ({
      key: (parse(e.year) ?? 0) - 0.5, // a qualification year sorts just before roles starting that year
      years: e.year ?? '',
      title: e.title,
      org: e.institution,
      text: e.status,
      design: e.isDesign,
      current: Boolean(e.isDesign && e.status && /pursu|progress/i.test(e.status)),
    })),
    ...profile.experience.map((x) => {
      const y0 = year(x.start)
      const y1 = x.end ? year(x.end) : 'Present'
      return {
        key: parse(x.start) ?? 0,
        years: y0 === y1 ? `${y0}` : `${y0}–${y1}`,
        title: x.role,
        org: x.organisation,
        dates: `${x.start} – ${x.end ?? 'Present'}`,
        text: x.summary,
        current: !x.end,
      }
    }),
  ].sort((a, b) => a.key - b.key)

  return (
    <ol className="relative">
      {entries.map((e, i) => (
        <li key={i} className="grid-12 gap-y-2 border-t border-[var(--color-line)] py-7" data-reveal>
          <p className={`col-span-4 font-serif text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] leading-none tabular sm:col-span-2 lg:col-span-3 ${e.design ? 'text-terracotta-text' : ''}`}>
            {e.years}
          </p>
          <div className="col-span-4 sm:col-span-6 lg:col-span-5">
            <h3 className="text-[1.125rem] font-semibold leading-snug">
              {e.title}
              {e.org && <span className="font-normal text-muted"> — {e.org}</span>}
            </h3>
            {e.dates && <p className="t-meta mt-2 text-muted">{e.dates}</p>}
            {e.current && (
              <p className="status-tag mt-3 text-terracotta-text">{e.design ? 'In progress' : 'Current'}</p>
            )}
          </div>
          {e.text && <p className="col-span-4 text-[0.9375rem] text-muted sm:col-span-6 sm:col-start-3 lg:col-span-4 lg:col-start-9">{e.text}</p>}
        </li>
      ))}
    </ol>
  )
}
