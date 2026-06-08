/** UART bring-up sequence: COM open → HELLO → caps → EVT_SENSOR. */
export function UartHandshakeSvg() {
  const steps = [
    { x: 24, label: "COM", sub: "921600", color: "var(--accent-cyan)" },
    { x: 118, label: "HELLO", sub: "REQ/RES", color: "var(--accent-purple)" },
    { x: 212, label: "Caps", sub: "sensor list", color: "var(--accent-amber)" },
    { x: 306, label: "EVT", sub: "SENSOR", color: "var(--status-live)" },
  ];

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 400 180" aria-hidden>
      {steps.map((step, index) => (
        <g key={step.label}>
          {index > 0 ? (
            <line
              x1={steps[index - 1].x + 64}
              y1={72}
              x2={step.x}
              y2={72}
              stroke="var(--surface-border)"
              strokeWidth={2}
              markerEnd="url(#uart-arrow)"
            />
          ) : null}
          <rect
            x={step.x}
            y={48}
            width={72}
            height={48}
            rx={8}
            fill="var(--surface-card)"
            stroke={step.color}
            strokeWidth={1.5}
          />
          <text x={step.x + 36} y={70} textAnchor="middle" fontSize={10} fontWeight="700" fill={step.color}>
            {step.label}
          </text>
          <text x={step.x + 36} y={84} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
            {step.sub}
          </text>
        </g>
      ))}
      <defs>
        <marker id="uart-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--surface-border)" />
        </marker>
      </defs>
      <text x={200} y={140} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
        Settings deck unlocks after handshake readiness
      </text>
    </svg>
  );
}
