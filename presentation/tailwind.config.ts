import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map CSS custom properties → Tailwind utilities
        surface: {
          bg:      'var(--surface-bg)',
          panel:   'var(--surface-panel)',
          card:    'var(--surface-card)',
          border:  'var(--surface-border)',
          hover:   'var(--surface-hover)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
        accent: {
          cyan:   'var(--accent-cyan)',
          x:      'var(--axis-x)',
          y:      'var(--axis-y)',
          z:      'var(--axis-z)',
          amber:  'var(--accent-amber)',
          purple: 'var(--accent-purple)',
          green:  'var(--accent-green)',
          red:    'var(--accent-red)',
        },
        status: {
          live:         'var(--status-live)',
          disconnected: 'var(--status-disconnected)',
          connecting:   'var(--status-connecting)',
          sim:          'var(--status-sim)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl': ['3rem',     { lineHeight: '1' }],
        '6xl': ['3.75rem',  { lineHeight: '1' }],
        '7xl': ['4.5rem',   { lineHeight: '1' }],
      },
      borderRadius: {
        sm:  '0.25rem',
        DEFAULT: '0.375rem',
        md:  '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgba(0,0,0,.4), 0 1px 2px -1px rgba(0,0,0,.4)',
        panel: '0 4px 24px 0 rgba(0,0,0,.5)',
        glow:  '0 0 20px var(--accent-cyan)',
        'glow-x': '0 0 16px var(--axis-x)',
        'glow-y': '0 0 16px var(--axis-y)',
        'glow-z': '0 0 16px var(--axis-z)',
      },
      animation: {
        'spin-slow':  'spin 3s linear infinite',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'blink':      'blink 1s step-end infinite',
      },
      keyframes: {
        pulseRing: {
          '0%':   { transform: 'scale(1)',   opacity: '1' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config
