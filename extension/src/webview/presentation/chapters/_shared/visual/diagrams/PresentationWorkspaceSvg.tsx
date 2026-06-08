/** Presentation workspace — tab + side panel, shared broker (not a standalone decoder app). */
export function PresentationWorkspaceSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 400 220" aria-hidden>
      <rect x={24} y={32} width={160} height={56} rx={8} fill="var(--surface-card)" stroke="var(--accent-amber)" strokeWidth={1.5} />
      <text x={104} y={56} textAnchor="middle" fontSize={10} fontWeight="700" fill="var(--accent-amber)">
        Workspace tab
      </text>
      <text x={104} y={72} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        ?workspace=presentation
      </text>

      <rect x={216} y={32} width={160} height={56} rx={8} fill="var(--surface-card)" stroke="var(--accent-amber)" strokeWidth={1.5} />
      <text x={296} y={56} textAnchor="middle" fontSize={10} fontWeight="700" fill="var(--accent-amber)">
        VS Code panel
      </text>
      <text x={296} y={72} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        openPresentation
      </text>

      <rect x={72} y={112} width={256} height={48} rx={8} fill="var(--accent-purple-bg)" stroke="var(--accent-purple)" strokeWidth={1.5} />
      <text x={200} y={134} textAnchor="middle" fontSize={10} fontWeight="600" fill="var(--accent-purple)">
        BitstreamShellRoot + useBitstreamLiveStore
      </text>
      <text x={200} y={150} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        chapters · live demos · no duplicate WebSocket decode
      </text>

      <line x1={104} y1={88} x2={160} y2={112} stroke="var(--surface-border)" strokeWidth={1.5} />
      <line x1={296} y1={88} x2={240} y2={112} stroke="var(--surface-border)" strokeWidth={1.5} />

      <text x={200} y={188} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
        Separate slide state per panel · same broker path
      </text>
      <text x={200} y={204} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        Legacy `presentation/` at repo root is archive only
      </text>
    </svg>
  );
}
