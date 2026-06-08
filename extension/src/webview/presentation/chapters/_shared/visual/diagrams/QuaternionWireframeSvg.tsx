/** Unit quaternion components as a 2D teaching diagram. */
export function QuaternionWireframeSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 320 220" aria-hidden>
      <rect x={100} y={48} width={120} height={120} rx={8} fill="none" stroke="var(--accent-purple)" strokeWidth={2} transform="rotate(18 160 108)" />
      <rect x={108} y={56} width={104} height={104} rx={6} fill="none" stroke="var(--surface-border)" strokeWidth={1.5} transform="rotate(-12 160 108)" />

      {[
        { label: "w", desc: "scalar", x: 160, y: 92, color: "var(--accent-purple)" },
        { label: "x", desc: "i", x: 92, y: 124, color: "var(--axis-x)" },
        { label: "y", desc: "j", x: 160, y: 156, color: "var(--axis-y)" },
        { label: "z", desc: "k", x: 228, y: 124, color: "var(--axis-z)" },
      ].map(({ label, desc, x, y, color }) => (
        <g key={label}>
          <circle cx={x} cy={y} r={18} fill="var(--surface-card)" stroke={color} strokeWidth={1.5} />
          <text x={x} y={y + 4} textAnchor="middle" fontSize={14} fontWeight="700" fill={color}>
            {label}
          </text>
          <text x={x} y={y + 28} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
            {desc}
          </text>
        </g>
      ))}

      <text x={160} y={200} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        x² + y² + z² + w² = 1
      </text>
    </svg>
  );
}
