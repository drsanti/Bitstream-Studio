/** Static MEMS accelerometer cross-section (theory slide). */
export function MemsCrossSectionSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 360 220" aria-hidden>
      <rect x={20} y={20} width={320} height={180} rx={10} fill="var(--surface-card)" stroke="var(--surface-border)" />

      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={`fixed-${i}`}
          x={60 + i * 22}
          y={52}
          width={10}
          height={36}
          rx={2}
          fill="var(--axis-z)"
          opacity={0.55}
        />
      ))}

      <rect x={118} y={78} width={88} height={48} rx={6} fill="var(--accent-amber-bg)" stroke="var(--accent-amber)" strokeWidth={2} />
      <text x={162} y={106} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--accent-amber)">
        Proof mass
      </text>

      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={`mobile-${i}`}
          x={68 + i * 22}
          y={88}
          width={10}
          height={28}
          rx={2}
          fill="var(--axis-x)"
          opacity={0.75}
        />
      ))}

      <line x1={40} y1={102} x2={108} y2={102} stroke="var(--surface-border)" strokeWidth={2} strokeDasharray="5 4" />
      <line x1={216} y1={102} x2={300} y2={102} stroke="var(--surface-border)" strokeWidth={2} strokeDasharray="5 4" />
      <text x={48} y={94} fontSize={9} fill="var(--text-muted)">
        spring
      </text>

      <text x={72} y={168} fontSize={10} fill="var(--axis-z)">
        C1
      </text>
      <text x={268} y={168} fontSize={10} fill="var(--axis-x)">
        C2
      </text>
      <text x={180} y={188} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        ΔC = C1 − C2 → Σ-Δ ADC → digital accel
      </text>
    </svg>
  );
}
