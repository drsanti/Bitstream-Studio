/**
 * ValueDisplay — large live numeric readout with label and unit.
 * Updates smoothly; color is from CSS var (pass axisColor for axis data).
 */
import { type CSSProperties } from 'react'

interface Props {
  label:     string
  value:     number
  unit:      string
  color?:    string    // CSS color or var()
  decimals?: number
  className?: string
}

export function ValueDisplay({ label, value, unit, color = 'var(--accent-cyan)', decimals = 3, className = '' }: Props) {
  const formatted = Number.isFinite(value) ? value.toFixed(decimals) : '---'
  const style: CSSProperties = { color }

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-2xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-code leading-none" style={style}>
          {formatted}
        </span>
        <span className="text-sm font-code" style={{ color: 'var(--text-muted)' }}>
          {unit}
        </span>
      </div>
    </div>
  )
}
