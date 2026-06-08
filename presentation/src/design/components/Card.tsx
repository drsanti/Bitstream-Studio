import type { ReactNode, CSSProperties } from 'react'

interface Props {
  children:   ReactNode
  className?: string
  style?:     CSSProperties
  accent?:    string   // CSS color for left border accent
  onClick?:   () => void
}

export function Card({ children, className = '', style, accent, onClick }: Props) {
  const borderStyle = accent ? { borderLeftColor: accent, borderLeftWidth: '3px' } : {}
  return (
    <div
      className={`rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] p-4 ${onClick ? 'cursor-pointer hover:bg-[var(--surface-hover)] transition-colors' : ''} ${className}`}
      style={{ ...borderStyle, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
