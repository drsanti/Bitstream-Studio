type AssetBucket = {
  label: string;
  examples: string;
  accent: string;
  x: number;
};

const BUCKETS: AssetBucket[] = [
  { label: "Models", examples: "GLB catalog · free pack", accent: "var(--accent-cyan)", x: 24 },
  { label: "Flow presets", examples: "Starter graphs", accent: "var(--accent-purple)", x: 148 },
  { label: "Vision packs", examples: "MediaPipe bundle", accent: "var(--accent-amber)", x: 272 },
];

/** Asset Manager — three curated buckets (high-level, not a full tutorial). */
export function AssetsCatalogSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 396 200" aria-hidden>
      {BUCKETS.map(({ label, examples, accent, x }) => (
        <g key={label}>
          <rect x={x} y={48} width={100} height={88} rx={10} fill="var(--surface-card)" stroke={accent} strokeWidth={1.5} />
          <text x={x + 50} y={78} textAnchor="middle" fontSize={11} fontWeight="700" fill={accent}>
            {label}
          </text>
          <text x={x + 50} y={98} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
            {examples}
          </text>
          <rect x={x + 20} y={108} width={60} height={16} rx={4} fill="var(--surface-panel)" stroke="var(--surface-border)" strokeWidth={1} />
          <text x={x + 50} y={120} textAnchor="middle" fontSize={7} fill="var(--text-secondary)">
            manifest v1
          </text>
        </g>
      ))}
      <rect x={108} y={24} width={180} height={28} rx={6} fill="var(--accent-purple-bg)" stroke="var(--accent-purple)" strokeWidth={1} />
      <text x={198} y={42} textAnchor="middle" fontSize={9} fontWeight="600" fill="var(--accent-purple)">
        Asset Manager · globalStorage
      </text>
      <text x={198} y={168} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        Browse · sync · copy URL — Sensor Studio Asset Browser consumes the same catalog
      </text>
    </svg>
  );
}
