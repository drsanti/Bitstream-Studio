/**
 * LiveBar — bi-directional ±1 (or custom range) bar chart for a single axis.
 * Center = 0, fills left for negative, right for positive.
 */
interface Props {
  value:      number
  min?:       number
  max?:       number
  color?:     string
  bgColor?:   string
  height?:    number      // px
  label?:     string
  showValue?: boolean
  unit?:      string
  decimals?:  number
}

export function LiveBar({
  value,
  min = -1,
  max = 1,
  color = 'var(--accent-cyan)',
  bgColor = 'var(--surface-border)',
  height = 8,
  label,
  showValue = false,
  unit = '',
  decimals = 2,
}: Props) {
  const range   = max - min
  const clamped = Math.max(min, Math.min(max, value))
  const zeroFrac = (0 - min) / range              // where 0 sits in [0..1]
  const valueFrac = (clamped - min) / range

  const left  = Math.min(zeroFrac, valueFrac) * 100
  const width = Math.abs(valueFrac - zeroFrac) * 100

  return (
    <div className="flex flex-col gap-1">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-2xs font-semibold tracking-widest uppercase"
                  style={{ color: 'var(--text-muted)' }}>
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs font-code" style={{ color }}>
              {clamped.toFixed(decimals)} {unit}
            </span>
          )}
        </div>
      )}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height, background: bgColor }}
      >
        {/* Zero tick */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${zeroFrac * 100}%`, background: 'var(--surface-border)' }}
        />
        {/* Fill */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-75"
          style={{ left: `${left}%`, width: `${width}%`, background: color }}
        />
      </div>
    </div>
  )
}
