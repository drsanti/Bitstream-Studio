type PaletteNode = {
  title: string;
  ports: string[];
  accent: string;
  x: number;
  y: number;
};

const NODES: PaletteNode[] = [
  {
    title: "BMI270",
    ports: ["Accel", "Gyro", "Euler"],
    accent: "var(--accent-amber)",
    x: 24,
    y: 24,
  },
  {
    title: "BMM350",
    ports: ["Magnetic", "Temp"],
    accent: "var(--accent-green)",
    x: 220,
    y: 24,
  },
  {
    title: "SHT40",
    ports: ["Humidity", "Temp"],
    accent: "var(--accent-cyan)",
    x: 24,
    y: 132,
  },
  {
    title: "DPS368",
    ports: ["Pressure", "Temp"],
    accent: "var(--accent-purple)",
    x: 220,
    y: 132,
  },
];

function MiniFlowNode({ title, ports, accent, x, y }: PaletteNode) {
  const w = 168;
  const h = 88;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="var(--surface-card)" stroke={accent} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize={10} fontWeight="700" fill={accent}>
        {title}
      </text>
      {ports.map((port, index) => {
        const py = y + 40 + index * 16;
        return (
          <g key={port}>
            <circle cx={x + w - 14} cy={py} r={4} fill={accent} />
            <line x1={x + w - 18} y1={py} x2={x + w - 6} y2={py} stroke={accent} strokeWidth={1.5} />
            <text x={x + 12} y={py + 4} fontSize={9} fill="var(--text-secondary)">
              {port}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Four BS2 sensor nodes in a 2×2 palette — platform overview diagram. */
export function SensorPaletteGridSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 412 248" aria-hidden>
      {NODES.map((node) => (
        <MiniFlowNode key={node.title} {...node} />
      ))}
      <text x={206} y={236} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        Flow palette · sensorId 0–3 · tap nodes for single outputs
      </text>
    </svg>
  );
}
