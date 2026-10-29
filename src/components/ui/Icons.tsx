const base = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, 'aria-hidden': true } as const

export const ArrowRight = () => (
  <svg {...base} className="arrow">
    <path d="M1 8h13M9.5 3.5 14 8l-4.5 4.5" />
  </svg>
)
export const ArrowDown = () => (
  <svg {...base} className="arrow">
    <path d="M8 1v13M3.5 9.5 8 14l4.5-4.5" />
  </svg>
)
export const ArrowUpRight = () => (
  <svg {...base} className="arrow">
    <path d="M3 13 13 3M5 3h8v8" />
  </svg>
)
export const Plus = () => (
  <svg {...base}>
    <path d="M8 2v12M2 8h12" />
  </svg>
)
export const Minus = () => (
  <svg {...base}>
    <path d="M2 8h12" />
  </svg>
)
export const Close = () => (
  <svg {...base}>
    <path d="m3 3 10 10M13 3 3 13" />
  </svg>
)
export const Expand = () => (
  <svg {...base}>
    <path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4" />
  </svg>
)
export const Reset = () => (
  <svg {...base}>
    <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2v3.5H6" />
  </svg>
)
export const Orbit = () => (
  <svg {...base}>
    <ellipse cx="8" cy="8" rx="6" ry="2.6" />
    <path d="M12.4 4.9 14 6.2l-1.9.8" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
)
export const Play = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M4 2.5v11l9-5.5z" />
  </svg>
)
export const Cube = () => (
  <svg {...base}>
    <path d="M8 1.5 14 5v6l-6 3.5L2 11V5zM2 5l6 3.5L14 5M8 8.5v6" />
  </svg>
)
export const Layers = () => (
  <svg {...base}>
    <path d="M8 1.5 14.5 5 8 8.5 1.5 5zM1.5 8 8 11.5 14.5 8M1.5 11 8 14.5l6.5-3.5" />
  </svg>
)
export const Chevron = ({ dir = 'right' }: { dir?: 'left' | 'right' }) => (
  <svg {...base} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
    <path d="m6 3 5 5-5 5" />
  </svg>
)
