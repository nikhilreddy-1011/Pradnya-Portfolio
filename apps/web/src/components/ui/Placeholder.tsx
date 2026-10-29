/**
 * Placeholder system — keeps every layout intact until real imagery is uploaded.
 * Line drawings only (never a fake photo or a generated face), always labelled.
 */
type Kind = 'render' | 'portrait' | 'plan' | 'texture'

const Art = ({ kind }: { kind: Kind }) => {
  if (kind === 'plan')
    return (
      <svg className="ph-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
          <rect x="60" y="50" width="280" height="200" strokeWidth="2.5" />
          <path d="M60 150h120M180 50v200M180 170h160M260 170v80" />
          <path d="M180 120a30 30 0 0 1 30-30" strokeDasharray="3 3" />
          <path d="M100 250v-8M140 250v-8" />
        </g>
      </svg>
    )
  if (kind === 'portrait')
    return (
      <svg className="ph-art" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
          <path d="M150 0v400M0 200h300" strokeDasharray="2 6" />
          <rect x="60" y="80" width="180" height="240" />
        </g>
      </svg>
    )
  if (kind === 'texture')
    return (
      <svg className="ph-art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 100L100 0M-50 100L50 0M50 100L150 0" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
    )
  // One-point perspective room — reads as "interior render goes here".
  return (
    <svg className="ph-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <rect x="560" y="330" width="480" height="300" />
        <path d="M0 0L560 330M1600 0L1040 330M0 1000L560 630M1600 1000L1040 630" />
        <rect x="660" y="390" width="150" height="170" />
        <path d="M735 390v170M660 475h150" />
        <path d="M200 1000L640 630M400 1000L720 630M800 1000V630M1200 1000L880 630M1400 1000L960 630" strokeDasharray="2 8" />
        <path d="M1130 790h250v-70h-250zM1150 790v40M1360 790v40" />
      </g>
    </svg>
  )
}

export function Placeholder({
  kind = 'render',
  label,
  ink = false,
  corner = false,
  className = '',
}: {
  kind?: Kind
  label?: string
  ink?: boolean
  /** Put the label in the top-right corner (for full-bleed heroes with text on top). */
  corner?: boolean
  className?: string
}) {
  const text =
    label ??
    { render: 'Render to be added', portrait: 'Portrait — to be supplied', plan: 'Floor plan to be added', texture: 'Material photo to be added' }[kind]
  return (
    <div className={`ph ${ink ? 'ph--ink' : ''} ${corner ? 'ph--corner' : ''} ${className}`} role="img" aria-label={text || 'Image to be added'}>
      <Art kind={kind} />
      {text && (
        <span className="ph-label" aria-hidden="true">
          {text}
        </span>
      )}
    </div>
  )
}
