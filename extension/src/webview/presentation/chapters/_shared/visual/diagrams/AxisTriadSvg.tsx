/** 2D right-hand axis triad with animated gravity hint on +Z. */
export function AxisTriadSvg() {
  const cx = 160;
  const cy = 150;

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 320 280" aria-hidden>
      <defs>
        <marker id="axis-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
        <radialGradient id="chip-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-amber)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent-amber)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={24} y={24} width={272} height={232} rx={12} fill="color-mix(in srgb, var(--surface-bg) 40%, transparent)" />

      <circle cx={cx} cy={cy} r={52} fill="url(#chip-glow)" />
      <rect x={cx - 36} y={cy - 22} width={72} height={44} rx={6} fill="var(--surface-card)" stroke="var(--surface-border)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--accent-amber)">
        IMU
      </text>

      <line
        x1={cx}
        y1={cy}
        x2={cx + 88}
        y2={cy - 12}
        stroke="var(--axis-x)"
        strokeWidth={3}
        markerEnd="url(#axis-arrow)"
        style={{ color: "var(--axis-x)" }}
      />
      <text x={cx + 96} y={cy - 8} fontSize={12} fontWeight="700" fill="var(--axis-x)">
        +X
      </text>

      <line
        x1={cx}
        y1={cy}
        x2={cx - 18}
        y2={cy + 78}
        stroke="var(--axis-y)"
        strokeWidth={3}
        markerEnd="url(#axis-arrow)"
        style={{ color: "var(--axis-y)" }}
      />
      <text x={cx - 28} y={cy + 92} fontSize={12} fontWeight="700" fill="var(--axis-y)">
        +Y
      </text>

      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 92}
        stroke="var(--axis-z)"
        strokeWidth={3}
        markerEnd="url(#axis-arrow)"
        style={{ color: "var(--axis-z)" }}
      />
      <text x={cx + 8} y={cy - 98} fontSize={12} fontWeight="700" fill="var(--axis-z)">
        +Z
      </text>

      <g className="presentation-diagram-pulse">
        <path
          d={`M ${cx} ${cy - 108} l 0 -18`}
          stroke="var(--axis-z)"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <text x={cx + 12} y={cy - 132} fontSize={10} fill="var(--text-muted)">
          gravity → +1 g
        </text>
      </g>

      <text x={160} y={258} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        Right-hand rule · flat table → aZ ≈ +1 g
      </text>
    </svg>
  );
}
