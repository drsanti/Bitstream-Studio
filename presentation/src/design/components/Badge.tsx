import type { ReactNode } from 'react'

type Variant = 'cyan' | 'amber' | 'purple' | 'green' | 'red' | 'muted'

const variants: Record<Variant, { bg: string; text: string }> = {
  cyan:   { bg: 'var(--accent-cyan-bg)',   text: 'var(--accent-cyan)'   },
  amber:  { bg: 'var(--accent-amber-bg)',  text: 'var(--accent-amber)'  },
  purple: { bg: 'var(--accent-purple-bg)', text: 'var(--accent-purple)' },
  green:  { bg: 'var(--accent-green-bg)',  text: 'var(--accent-green)'  },
  red:    { bg: 'var(--accent-red-bg)',    text: 'var(--accent-red)'    },
  muted:  { bg: 'var(--surface-hover)',    text: 'var(--text-muted)'    },
}

interface Props {
  children:  ReactNode
  variant?:  Variant
  dot?:      boolean
}

export function Badge({ children, variant = 'cyan', dot = false }: Props) {
  const { bg, text } = variants[variant]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-semibold tracking-wide uppercase"
      style={{ background: bg, color: text }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: text }}
        />
      )}
      {children}
    </span>
  )
}
