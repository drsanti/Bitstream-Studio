type Cell = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  accent: string;
};

const CELLS: Cell[] = [
  { x: 24, y: 40, w: 96, h: 56, label: "Gauge", accent: "var(--accent-cyan)" },
  { x: 128, y: 40, w: 96, h: 56, label: "LED", accent: "var(--status-live)" },
  { x: 232, y: 40, w: 96, h: 56, label: "Numeric", accent: "var(--accent-amber)" },
  { x: 24, y: 104, w: 200, h: 56, label: "Plotter", accent: "var(--accent-purple)" },
  { x: 232, y: 104, w: 96, h: 56, label: "Knob", accent: "var(--accent-cyan)" },
  { x: 24, y: 168, w: 120, h: 40, label: "Slider", accent: "var(--accent-green)" },
  { x: 152, y: 168, w: 176, h: 40, label: "Tab bar", accent: "var(--accent-purple)" },
];

/** Dashboard grid wireframe — publish targets from Flow nodes. */
export function DashboardGridSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 352 228" aria-hidden>
      <rect x={16} y={16} width={320} height={196} rx={10} fill="var(--surface-card)" stroke="var(--surface-border)" strokeWidth={1.5} />
      <text x={32} y={34} fontSize={9} fontWeight="600" fill="var(--accent-purple)">
        Dashboard · Preview
      </text>
      {CELLS.map((cell) => (
        <g key={cell.label}>
          <rect
            x={cell.x}
            y={cell.y}
            width={cell.w}
            height={cell.h}
            rx={6}
            fill="var(--surface-panel)"
            stroke={cell.accent}
            strokeWidth={1}
          />
          <text x={cell.x + cell.w / 2} y={cell.y + cell.h / 2 + 4} textAnchor="middle" fontSize={9} fontWeight="600" fill={cell.accent}>
            {cell.label}
          </text>
        </g>
      ))}
      <text x={176} y={220} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        publishToDashboard on Flow nodes → evaluated each tick
      </text>
    </svg>
  );
}
