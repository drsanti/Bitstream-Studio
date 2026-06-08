/** Barometric pressure vs altitude — teaching schematic. */
export function BaroPressureSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 320 260" aria-hidden>
      <rect x={28} y={24} width={120} height={200} rx={8} fill="var(--surface-card)" stroke="var(--surface-border)" />
      <text x={88} y={48} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--accent-cyan)">
        Sea level
      </text>
      <text x={88} y={68} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        ~1013 hPa
      </text>
      <line x1={148} y1={80} x2={200} y2={50} stroke="var(--accent-amber)" strokeWidth={2} markerEnd="url(#baro-arrow)" />
      <text x={210} y={48} fontSize={10} fill="var(--text-secondary)">
        Lower P
      </text>
      <text x={210} y={62} fontSize={10} fill="var(--text-secondary)">
        Higher altitude
      </text>
      <defs>
        <marker id="baro-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-amber)" />
        </marker>
      </defs>
      <path
        d="M 88 200 Q 88 120 88 90"
        fill="none"
        stroke="var(--accent-cyan)"
        strokeWidth={2}
        strokeDasharray="5 4"
      />
      <text x={88} y={228} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        Pressure ↓ ~12 hPa / 100 m (ISA rule-of-thumb)
      </text>
    </svg>
  );
}
