/** Earth's magnetic field — declination / inclination teaching diagram. */
export function EarthFieldSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 320 280" aria-hidden>
      <defs>
        <radialGradient id="earth-core" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      <circle cx={160} cy={140} r={72} fill="url(#earth-core)" stroke="var(--surface-border)" strokeWidth={2} />
      <ellipse cx={160} cy={140} rx={72} ry={24} fill="none" stroke="color-mix(in srgb, var(--accent-cyan) 40%, transparent)" strokeWidth={1.5} strokeDasharray="4 4" />
      <line x1={160} y1={68} x2={118} y2={198} stroke="var(--accent-amber)" strokeWidth={3} markerEnd="url(#field-arrow)" />
      <defs>
        <marker id="field-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-amber)" />
        </marker>
      </defs>
      <text x={92} y={210} fontSize={11} fontWeight="600" fill="var(--accent-amber)">
        B field (µT)
      </text>
      <text x={200} y={88} fontSize={10} fill="var(--text-muted)">
        Inclination
      </text>
      <text x={200} y={168} fontSize={10} fill="var(--text-muted)">
        Declination
      </text>
      <text x={160} y={252} textAnchor="middle" fontSize={11} fill="var(--text-secondary)">
        Typical |B| ≈ 25–65 µT at the surface
      </text>
    </svg>
  );
}
