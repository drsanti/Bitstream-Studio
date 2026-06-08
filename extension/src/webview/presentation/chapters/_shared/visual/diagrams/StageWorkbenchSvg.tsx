/** Stylized Stage pane: toolbar + 3D viewport fed by Flow Scene Output. */
export function StageWorkbenchSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 400 220" aria-hidden>
      <rect x={16} y={16} width={368} height={188} rx={10} fill="var(--surface-card)" stroke="var(--surface-border)" strokeWidth={1.5} />

      <rect x={16} y={16} width={368} height={32} rx={10} fill="var(--surface-panel)" />
      <rect x={16} y={36} width={368} height={12} fill="var(--surface-panel)" />
      <text x={32} y={36} fontSize={9} fontWeight="600" fill="var(--accent-cyan)">
        Edit
      </text>
      <text x={68} y={36} fontSize={9} fill="var(--text-muted)">
        Simulate
      </text>
      <text x={300} y={36} fontSize={8} fill="var(--text-muted)">
        Persp · Orbit
      </text>

      <line x1={32} y1={72} x2={368} y2={72} stroke="var(--surface-border)" strokeWidth={1} strokeDasharray="4 6" />
      <line x1={32} y1={168} x2={368} y2={168} stroke="var(--surface-border)" strokeWidth={1} strokeDasharray="4 6" />
      <line x1={200} y1={56} x2={200} y2={184} stroke="var(--surface-border)" strokeWidth={1} strokeDasharray="4 6" />

      <path
        d="M 168 148 L 200 108 L 232 148 L 200 168 Z"
        fill="var(--accent-purple-bg)"
        stroke="var(--accent-purple)"
        strokeWidth={1.5}
      />
      <text x={200} y={196} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
        GLB · procedural meshes · gizmo (Edit)
      </text>

      <rect x={24} y={48} width={88} height={20} rx={4} fill="var(--accent-purple-bg)" stroke="var(--accent-purple)" strokeWidth={1} />
      <text x={68} y={62} textAnchor="middle" fontSize={8} fontWeight="600" fill="var(--accent-purple)">
        Scene Output
      </text>
      <path d="M 112 58 C 140 58 140 100 168 120" fill="none" stroke="var(--accent-purple)" strokeWidth={1.5} markerEnd="url(#stage-wire)" />

      <defs>
        <marker id="stage-wire" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-purple)" />
        </marker>
      </defs>
    </svg>
  );
}
