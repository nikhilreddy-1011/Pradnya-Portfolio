import { Picture } from '@/components/ui/Picture'
import type { MaterialUse } from '@/lib/types'

/**
 * Material / colour board. A real material photo is always preferred; without one, the
 * CMS "indicative tone" is shown and labelled as such — never presented as a specification.
 */
export function MaterialStory({ materials, palette }: { materials: MaterialUse[]; palette: { name: string; hex: string }[] }) {
  return (
    <div className="space-y-[var(--space-xl)]">
      {materials.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-[var(--grid-gap)] gap-y-10 lg:grid-cols-4">
          {materials.map((m, i) => (
            <li key={m.name} className="group" data-reveal style={{ ['--delay' as string]: `${i * 90}ms` }}>
              <div className="frame aspect-[3/4] transition-transform duration-700 group-hover:-translate-y-1.5">
                {m.texture ? (
                  <Picture img={m.texture} kind="texture" sizes="(min-width: 1024px) 22vw, 45vw" />
                ) : m.tone ? (
                  <div className="h-full w-full" style={{ background: m.tone }} role="img" aria-label={`${m.name} — indicative tone`}>
                    <div className="h-full w-full opacity-[0.07] [background-image:repeating-linear-gradient(115deg,#000_0_1px,transparent_1px_7px)]" />
                  </div>
                ) : (
                  <Picture img={null} kind="texture" sizes="25vw" />
                )}
              </div>
              <p className="t-meta mt-4 tabular text-muted">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-serif text-[clamp(1.375rem,1.2rem+0.6vw,1.875rem)] leading-tight">{m.name}</h3>
              {(m.application || m.room) && <p className="mt-2 text-[0.9375rem] text-muted">{[m.application, m.room].filter(Boolean).join(' · ')}</p>}
              {m.description && <p className="mt-2 text-[0.9375rem] text-muted">{m.description}</p>}
              {!m.texture && m.tone && <p className="t-meta mt-3 text-muted opacity-80">Indicative tone</p>}
            </li>
          ))}
        </ul>
      )}

      {palette.length > 0 && (
        <div data-reveal>
          <p className="t-meta text-muted">Colour palette</p>
          <ul className="mt-4 flex h-28 w-full sm:h-36">
            {palette.map((c) => (
              <li key={c.hex + c.name} className="group relative flex-1 transition-[flex-grow] duration-500 hover:flex-[1.6]" style={{ background: c.hex }}>
                <span className="t-meta absolute bottom-2 left-2 bg-[var(--color-background)] px-2 py-1">
                  {c.name} <span className="text-muted">{c.hex.toUpperCase()}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
