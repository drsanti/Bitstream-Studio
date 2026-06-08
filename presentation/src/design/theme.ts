/**
 * Theme maps — light + dark.
 * Each entry becomes a CSS custom property on <html data-theme="dark|light">.
 */
import chroma from 'chroma-js'
import { tokens, BASE } from './tokens'

type CSSVarMap = Record<string, string>

function buildAxisVars(prefix: string, ramp: typeof tokens.axis.x): CSSVarMap {
  return {
    [`${prefix}`]:          ramp.base,
    [`${prefix}-bg`]:       ramp.bg,
    [`${prefix}-tint`]:     ramp.tint,
    [`${prefix}-border`]:   ramp.border,
    [`${prefix}-glow`]:     ramp.glow,
    [`${prefix}-grad-from`]: ramp.gradStart,
    [`${prefix}-grad-to`]:   ramp.gradEnd,
  }
}

// ─── Dark theme ────────────────────────────────────────────────────────────────
export const darkTheme: CSSVarMap = {
  // Surfaces
  '--surface-bg':     '#0b0f1a',
  '--surface-panel':  '#111827',
  '--surface-card':   '#1e293b',
  '--surface-border': '#334155',
  '--surface-hover':  '#263044',

  // Text
  '--text-primary':   '#f1f5f9',
  '--text-secondary': '#94a3b8',
  '--text-muted':     '#475569',
  '--text-inverse':   '#0b0f1a',

  // Axis colors
  '--axis-x': BASE.axisX,
  '--axis-y': BASE.axisY,
  '--axis-z': BASE.axisZ,
  ...buildAxisVars('--axis-x', tokens.axis.x),
  ...buildAxisVars('--axis-y', tokens.axis.y),
  ...buildAxisVars('--axis-z', tokens.axis.z),

  // Accent colors
  '--accent-cyan':   BASE.cyan,
  '--accent-amber':  BASE.amber,
  '--accent-purple': BASE.purple,
  '--accent-green':  BASE.green,
  '--accent-red':    BASE.red,

  // Accent BG tints (for badges, card highlights)
  '--accent-cyan-bg':   chroma(BASE.cyan).alpha(0.10).css(),
  '--accent-amber-bg':  chroma(BASE.amber).alpha(0.12).css(),
  '--accent-purple-bg': chroma(BASE.purple).alpha(0.10).css(),
  '--accent-green-bg':  chroma(BASE.green).alpha(0.10).css(),
  '--accent-red-bg':    chroma(BASE.red).alpha(0.10).css(),

  // Status
  '--status-live':         BASE.green,
  '--status-disconnected': '#475569',
  '--status-connecting':   BASE.amber,
  '--status-sim':          BASE.purple,

  // 3D scene background
  '--scene-bg':  '#080c14',
  '--scene-fog': '#0b0f1a',

  // Shiki theme
  '--shiki-theme': '"github-dark"',

  // Scrollbar (for notes panel)
  '--scrollbar-thumb':  '#334155',
  '--scrollbar-track':  '#1e293b',
}

// ─── Light theme ───────────────────────────────────────────────────────────────
export const lightTheme: CSSVarMap = {
  // Surfaces
  '--surface-bg':     '#f8fafc',
  '--surface-panel':  '#ffffff',
  '--surface-card':   '#f1f5f9',
  '--surface-border': '#e2e8f0',
  '--surface-hover':  '#e8edf4',

  // Text
  '--text-primary':   '#0f172a',
  '--text-secondary': '#475569',
  '--text-muted':     '#94a3b8',
  '--text-inverse':   '#f8fafc',

  // Axis colors stay the same hue but are slightly darkened for light bg contrast
  '--axis-x': chroma(BASE.axisX).darken(0.3).hex(),
  '--axis-y': chroma(BASE.axisY).darken(0.5).hex(),
  '--axis-z': chroma(BASE.axisZ).darken(0.3).hex(),
  ...buildAxisVars('--axis-x', {
    ...tokens.axis.x,
    base: chroma(BASE.axisX).darken(0.3).hex(),
    bg:   chroma(BASE.axisX).alpha(0.06).css(),
    tint: chroma(BASE.axisX).alpha(0.12).css(),
    border: chroma(BASE.axisX).alpha(0.30).css(),
    glow: chroma(BASE.axisX).alpha(0.15).css(),
    gradStart: chroma(BASE.axisX).alpha(0.25).css(),
    gradEnd: chroma(BASE.axisX).alpha(0.00).css(),
    hover: chroma(BASE.axisX).darken(0.8).hex(),
    light: BASE.axisX,
  }),
  ...buildAxisVars('--axis-y', {
    ...tokens.axis.y,
    base: chroma(BASE.axisY).darken(0.5).hex(),
    bg:   chroma(BASE.axisY).alpha(0.06).css(),
    tint: chroma(BASE.axisY).alpha(0.12).css(),
    border: chroma(BASE.axisY).alpha(0.30).css(),
    glow: chroma(BASE.axisY).alpha(0.15).css(),
    gradStart: chroma(BASE.axisY).alpha(0.25).css(),
    gradEnd: chroma(BASE.axisY).alpha(0.00).css(),
    hover: chroma(BASE.axisY).darken(0.8).hex(),
    light: BASE.axisY,
  }),
  ...buildAxisVars('--axis-z', {
    ...tokens.axis.z,
    base: chroma(BASE.axisZ).darken(0.3).hex(),
    bg:   chroma(BASE.axisZ).alpha(0.06).css(),
    tint: chroma(BASE.axisZ).alpha(0.12).css(),
    border: chroma(BASE.axisZ).alpha(0.30).css(),
    glow: chroma(BASE.axisZ).alpha(0.15).css(),
    gradStart: chroma(BASE.axisZ).alpha(0.25).css(),
    gradEnd: chroma(BASE.axisZ).alpha(0.00).css(),
    hover: chroma(BASE.axisZ).darken(0.8).hex(),
    light: BASE.axisZ,
  }),

  // Accents — slightly darkened for legibility on white
  '--accent-cyan':   chroma(BASE.cyan).darken(0.2).hex(),
  '--accent-amber':  chroma(BASE.amber).darken(0.4).hex(),
  '--accent-purple': chroma(BASE.purple).darken(0.2).hex(),
  '--accent-green':  chroma(BASE.green).darken(0.3).hex(),
  '--accent-red':    chroma(BASE.red).darken(0.2).hex(),

  '--accent-cyan-bg':   chroma(BASE.cyan).alpha(0.07).css(),
  '--accent-amber-bg':  chroma(BASE.amber).alpha(0.09).css(),
  '--accent-purple-bg': chroma(BASE.purple).alpha(0.07).css(),
  '--accent-green-bg':  chroma(BASE.green).alpha(0.07).css(),
  '--accent-red-bg':    chroma(BASE.red).alpha(0.07).css(),

  // Status
  '--status-live':         chroma(BASE.green).darken(0.3).hex(),
  '--status-disconnected': '#94a3b8',
  '--status-connecting':   chroma(BASE.amber).darken(0.4).hex(),
  '--status-sim':          chroma(BASE.purple).darken(0.2).hex(),

  // 3D scene
  '--scene-bg':  '#e8edf4',
  '--scene-fog': '#f1f5f9',

  '--shiki-theme': '"github-light"',

  '--scrollbar-thumb':  '#e2e8f0',
  '--scrollbar-track':  '#f1f5f9',
}

export type ThemeMode = 'dark' | 'light'
