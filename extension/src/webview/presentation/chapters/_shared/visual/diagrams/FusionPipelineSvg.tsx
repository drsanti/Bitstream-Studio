/** 2D sensor-fusion pipeline: accel + gyro → filter → attitude outputs. */
export function FusionPipelineSvg() {
  const boxes = [
    { x: 24, label: "Gyro ω", sub: "fast · drifts", color: "var(--accent-amber)" },
    { x: 124, label: "Accel g", sub: "gravity hint", color: "var(--axis-z)" },
    { x: 224, label: "Fusion", sub: "complementary", color: "var(--accent-purple)" },
    { x: 324, label: "Attitude", sub: "Euler · Quat", color: "var(--accent-cyan)" },
  ];

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 420 200" aria-hidden>
      {boxes.map((box, i) => (
        <g key={box.label}>
          <rect
            x={box.x}
            y={64}
            width={88}
            height={72}
            rx={10}
            fill="var(--surface-card)"
            stroke={box.color}
            strokeWidth={1.5}
          />
          <text x={box.x + 44} y={92} textAnchor="middle" fontSize={11} fontWeight="700" fill={box.color}>
            {box.label}
          </text>
          <text x={box.x + 44} y={112} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
            {box.sub}
          </text>
          {i < boxes.length - 1 ? (
            <path
              d={`M ${box.x + 92} 100 H ${box.x + 108}`}
              stroke="var(--text-muted)"
              strokeWidth={2}
              markerEnd="url(#fusion-arrow)"
            />
          ) : null}
        </g>
      ))}
      <text x={210} y={168} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        Firmware publishes mask 0x08 (Euler) and 0x10 (Quaternion) on the wire
      </text>
      <defs>
        <marker id="fusion-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
    </svg>
  );
}
