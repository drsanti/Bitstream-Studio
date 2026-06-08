/** Dev browser vs installed VSIX — same webview bundle, different host shell. */
export function ExtensionDeliverySvg() {
  const panels = [
    { x: 48, y: 48, w: 140, h: 88, label: "Vite dev", sub: "localhost:5173", color: "var(--accent-amber)" },
    { x: 232, y: 48, w: 140, h: 88, label: "VSIX host", sub: "VS Code webview", color: "var(--accent-cyan)" },
  ];

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 420 200" aria-hidden>
      {panels.map((panel) => (
        <g key={panel.label}>
          <rect
            x={panel.x}
            y={panel.y}
            width={panel.w}
            height={panel.h}
            rx={10}
            fill="var(--surface-card)"
            stroke={panel.color}
            strokeWidth={1.5}
          />
          <text x={panel.x + panel.w / 2} y={panel.y + 36} textAnchor="middle" fontSize={11} fontWeight="700" fill={panel.color}>
            {panel.label}
          </text>
          <text x={panel.x + panel.w / 2} y={panel.y + 54} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
            {panel.sub}
          </text>
          <text x={panel.x + panel.w / 2} y={panel.y + 72} textAnchor="middle" fontSize={8} fill="var(--text-secondary)">
            ?workspace=…
          </text>
        </g>
      ))}
      <rect x={118} y={152} width={184} height={36} rx={8} fill="var(--accent-purple-bg)" stroke="var(--accent-purple)" strokeWidth={1.5} />
      <text x={210} y={174} textAnchor="middle" fontSize={10} fontWeight="600" fill="var(--accent-purple)">
        bitstream-studio bundle
      </text>
      <line x1={118} y1={136} x2={168} y2={152} stroke="var(--surface-border)" strokeWidth={1.5} />
      <line x1={302} y1={136} x2={252} y2={152} stroke="var(--surface-border)" strokeWidth={1.5} />
    </svg>
  );
}
