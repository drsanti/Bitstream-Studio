/** Stylized flow node with output ports — teaching diagram for Sensor Studio sensor nodes. */
export function SensorStudioNodeSvg({
  title,
  ports,
  accent = "var(--accent-cyan)",
}: {
  title: string;
  ports: string[];
  accent?: string;
}) {
  const h = 56 + ports.length * 28;

  return (
    <svg className="presentation-diagram-svg" viewBox={`0 0 280 ${h + 24}`} aria-hidden>
      <rect x={24} y={16} width={180} height={h} rx={10} fill="var(--surface-card)" stroke={accent} strokeWidth={2} />
      <text x={114} y={44} textAnchor="middle" fontSize={13} fontWeight="700" fill={accent}>
        {title}
      </text>
      {ports.map((port, i) => {
        const y = 64 + i * 28;
        return (
          <g key={port}>
            <circle cx={204} cy={y} r={5} fill={accent} />
            <line x1={204} y1={y} x2={248} y2={y} stroke={accent} strokeWidth={2} />
            <text x={40} y={y + 4} fontSize={11} fill="var(--text-secondary)">
              {port}
            </text>
          </g>
        );
      })}
      <text x={140} y={h + 32} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        Drag from outputs → Dashboard / Stage / math nodes
      </text>
    </svg>
  );
}
