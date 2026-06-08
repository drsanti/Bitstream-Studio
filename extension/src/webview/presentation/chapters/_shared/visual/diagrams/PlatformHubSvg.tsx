/** 2D hub diagram: broker at center, three workspace clients. */
export function PlatformHubSvg() {
  const cx = 180;
  const cy = 120;
  const nodes = [
    { x: 72, y: 56, label: "Telemetry", color: "var(--accent-cyan)" },
    { x: 288, y: 56, label: "Studio", color: "var(--accent-purple)" },
    { x: 180, y: 196, label: "Presentation", color: "var(--accent-amber)" },
  ];

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 360 240" aria-hidden>
      <circle cx={cx} cy={cy} r={36} fill="var(--accent-cyan-bg)" stroke="var(--accent-cyan)" strokeWidth={2} />
      <text x={cx} y={116} textAnchor="middle" fontSize={10} fontWeight="700" fill="var(--accent-cyan)">
        Bridge
      </text>
      <text x={cx} y={130} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        ws :9998
      </text>
      {nodes.map((node) => (
        <g key={node.label}>
          <line x1={cx} y1={cy} x2={node.x} y2={node.y} stroke="var(--surface-border)" strokeWidth={2} />
          <circle cx={node.x} cy={node.y} r={28} fill="var(--surface-card)" stroke={node.color} strokeWidth={1.5} />
          <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={9} fontWeight="600" fill={node.color}>
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
