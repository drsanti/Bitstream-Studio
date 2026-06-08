/**
 * Design tokens — single source of truth.
 * All color variants are derived by chroma-js from a small set of base hex values.
 * These tokens are injected as CSS custom properties by ThemeProvider.tsx
 */
import chroma from 'chroma-js'

// ─── Base palette ──────────────────────────────────────────────────────────────
const BASE = {
  // Sensor axis colors
  axisX:  '#F87171',   // red-400 — X axis
  axisY:  '#34D399',   // emerald-400 — Y axis
  axisZ:  '#60A5FA',   // blue-400 — Z axis

  // Feature accent colors
  cyan:   '#06B6D4',   // cyan-500 — primary accent / WS connected
  amber:  '#FBBF24',   // amber-400 — warnings / gyro
  purple: '#A78BFA',   // violet-400 — quaternion / 3D
  green:  '#22C55E',   // green-500 — live / OK
  red:    '#EF4444',   // red-500 — error / alert

  // Dark theme surfaces
  dkBg:     '#0b0f1a',   // deepest background
  dkPanel:  '#111827',   // sidebar, topbar
  dkCard:   '#1e293b',   // card surfaces
  dkBorder: '#334155',   // borders / dividers
  dkHover:  '#263044',   // hover states

  // Light theme surfaces
  ltBg:     '#f8fafc',
  ltPanel:  '#ffffff',
  ltCard:   '#f1f5f9',
  ltBorder: '#e2e8f0',
  ltHover:  '#e8edf4',
}

// ─── Color ramp helper ─────────────────────────────────────────────────────────
function axisRamp(hex: string) {
  return {
    base:   hex,
    bg:     chroma(hex).alpha(0.08).css(),
    tint:   chroma(hex).alpha(0.18).css(),
    border: chroma(hex).alpha(0.35).css(),
    glow:   chroma(hex).alpha(0.25).css(),
    hover:  chroma(hex).darken(0.35).hex(),
    light:  chroma(hex).brighten(0.4).hex(),
    // gradient fill under waveform curve
    gradStart: chroma(hex).alpha(0.35).css(),
    gradEnd:   chroma(hex).alpha(0.00).css(),
  }
}

// ─── Tokens ────────────────────────────────────────────────────────────────────
export const tokens = {
  axis: {
    x: axisRamp(BASE.axisX),
    y: axisRamp(BASE.axisY),
    z: axisRamp(BASE.axisZ),
  },
  accent: {
    cyan:   axisRamp(BASE.cyan),
    amber:  axisRamp(BASE.amber),
    purple: axisRamp(BASE.purple),
    green:  axisRamp(BASE.green),
    red:    axisRamp(BASE.red),
  },

  // Semantic status tokens
  status: {
    live:         BASE.green,
    disconnected: '#475569',  // slate-600
    connecting:   BASE.amber,
    sim:          BASE.purple,
  },

  // Typography scale
  fontSize: {
    '2xs': '0.625rem',
    xs:    '0.75rem',
    sm:    '0.875rem',
    base:  '1rem',
    lg:    '1.125rem',
    xl:    '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
  },

  // Spacing (4px base grid)
  spacing: {
    0:  '0px',
    1:  '0.25rem',
    2:  '0.5rem',
    3:  '0.75rem',
    4:  '1rem',
    5:  '1.25rem',
    6:  '1.5rem',
    8:  '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },

  // Border radius
  radius: {
    sm:  '0.25rem',
    md:  '0.5rem',
    lg:  '0.75rem',
    xl:  '1rem',
    full:'9999px',
  },

  // Z-index layers
  z: {
    base:    0,
    card:    10,
    overlay: 20,
    modal:   30,
    topbar:  40,
    tooltip: 50,
  },

  // Transition durations (ms)
  duration: {
    fast:   150,
    normal: 250,
    slow:   400,
  },
} as const

export type Tokens = typeof tokens
export type AxisKey = 'x' | 'y' | 'z'
export type AccentKey = 'cyan' | 'amber' | 'purple' | 'green' | 'red'

// ─── CSS variable names ─────────────────────────────────────────────────────────
// Exported so components can reference vars without hard-coding strings.
export const cssVar = {
  bg:          'var(--surface-bg)',
  panel:       'var(--surface-panel)',
  card:        'var(--surface-card)',
  border:      'var(--surface-border)',
  hover:       'var(--surface-hover)',
  textPrimary: 'var(--text-primary)',
  textSecond:  'var(--text-secondary)',
  textMuted:   'var(--text-muted)',
  axisX:       'var(--axis-x)',
  axisY:       'var(--axis-y)',
  axisZ:       'var(--axis-z)',
  cyan:        'var(--accent-cyan)',
  amber:       'var(--accent-amber)',
  purple:      'var(--accent-purple)',
  green:       'var(--accent-green)',
  red:         'var(--accent-red)',
  live:        'var(--status-live)',
} as const

// Expose raw BASE for Shiki / GSAP integration that needs raw hex
export { BASE }
