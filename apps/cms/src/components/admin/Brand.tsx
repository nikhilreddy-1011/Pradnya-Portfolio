import React from 'react'

/** Admin login + nav branding. Server components, no client JS. */
export function Logo() {
  return (
    <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
      <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 30, letterSpacing: '0.02em' }}>
        PRADNYA SALUNKHE
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginTop: 8 }}>
        Portfolio admin
      </div>
    </div>
  )
}

export function Icon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1" y="1" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 17 H13 V25" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
