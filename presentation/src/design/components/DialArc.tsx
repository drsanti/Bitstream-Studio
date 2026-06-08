/**
 * DialArc — SVG semicircle gauge.
 * 0° at left (-180°), 100% at right (0°).
 */
interface Props {
  value:    number
  min?:     number
  max?:     number
  color?:   string
  size?:    number    // px diameter
  label?:   string
  unit?:    string
  decimals?: number
}

export function DialArc({
  value,
  min = -500,
  max = 500,
  color = 'var(--accent-cyan)',
  size = 120,
  label,
  unit = '°/s',
  decimals = 1,
}: Props) {
  const r = (size / 2) * 0.78
  const cx = size / 2
  const cy = size * 0.58
  const startAngle = -Math.PI          // left
  const endAngle   =  0               // right
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const angle = startAngle + frac * (endAngle - startAngle)

  function arcPath(r: number, from: number, to: number) {
    const x1 = cx + r * Math.cos(from)
    const y1 = cy + r * Math.sin(from)
    const x2 = cx + r * Math.cos(to)
    const y2 = cy + r * Math.sin(to)
    const large = to - from > Math.PI ? 1 : 0
    return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`
  }

  const needleX = cx + r * Math.cos(angle)
  const needleY = cy + r * Math.sin(angle)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Track */}
        <path
          d={arcPath(r, startAngle, 0)}
          fill="none"
          stroke="var(--surface-border)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={arcPath(r, startAngle, angle)}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Needle dot */}
        <circle cx={needleX} cy={needleY} r={4} fill={color} />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="var(--surface-border)" />
        {/* Value text */}
        <text
          x={cx} y={cy - 14}
          textAnchor="middle"
          fontSize={size * 0.14}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontWeight="700"
          fill={color}
        >
          {Number.isFinite(value) ? value.toFixed(decimals) : '---'}
        </text>
        <text
          x={cx} y={cy}
          textAnchor="middle"
          fontSize={size * 0.09}
          fontFamily="inherit"
          fill="var(--text-muted)"
        >
          {unit}
        </text>
      </svg>
      {label && (
        <span className="text-2xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
    </div>
  )
}
