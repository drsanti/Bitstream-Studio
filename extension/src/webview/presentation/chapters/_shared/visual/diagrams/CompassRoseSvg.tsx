/** Compass rose — optional heading (deg) rotates the north needle for live demos. */
export function CompassRoseSvg({ headingDeg = 0 }: { headingDeg?: number }) {
  const cx = 160;
  const cy = 150;
  const r = 100;

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 320 300" aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="var(--surface-card)" stroke="var(--surface-border)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r - 18} fill="none" stroke="color-mix(in srgb, var(--surface-border) 60%, transparent)" strokeWidth={1} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (r - 28);
        const y1 = cy + Math.sin(rad) * (r - 28);
        const x2 = cx + Math.cos(rad) * (r - 8);
        const y2 = cy + Math.sin(rad) * (r - 8);
        const major = deg % 90 === 0;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--text-muted)"
            strokeWidth={major ? 2 : 1}
            opacity={major ? 0.9 : 0.45}
          />
        );
      })}
      <text x={cx} y={cy - r + 22} textAnchor="middle" fontSize={13} fontWeight="700" fill="var(--accent-red)">
        N
      </text>
      <g transform={`rotate(${headingDeg} ${cx} ${cy})`}>
        <polygon
          points={`${cx},${cy - r + 36} ${cx - 10},${cy + 8} ${cx},${cy - 4} ${cx + 10},${cy + 8}`}
          fill="var(--accent-red)"
          opacity={0.92}
        />
        <polygon
          points={`${cx},${cy + r - 36} ${cx - 8},${cy - 6} ${cx},${cy + 4} ${cx + 8},${cy - 6}`}
          fill="var(--text-muted)"
          opacity={0.5}
        />
      </g>
      <circle cx={cx} cy={cy} r={6} fill="var(--surface-panel)" stroke="var(--surface-border)" />
      <text x={cx} y={cy + r + 28} textAnchor="middle" fontSize={12} fill="var(--text-secondary)">
        {Number.isFinite(headingDeg) ? `${headingDeg.toFixed(1)}°` : "—°"} heading
      </text>
    </svg>
  );
}
