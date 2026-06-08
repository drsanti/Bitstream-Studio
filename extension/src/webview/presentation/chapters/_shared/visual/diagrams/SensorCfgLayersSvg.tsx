/** SENSOR_CFG v2: UI draft → (future) wire apply → publish mask on EVT_SENSOR. */
export function SensorCfgLayersSvg() {
  const layers = [
    { y: 32, label: "Telemetry UI draft", sub: "ranges, ODR, masks", color: "var(--accent-cyan)" },
    { y: 88, label: "SENSOR_CFG v2", sub: "per-sensor blocks", color: "var(--accent-purple)" },
    { y: 144, label: "EVT_SENSOR mask", sub: "fields in payload", color: "var(--accent-amber)" },
  ];

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 360 200" aria-hidden>
      {layers.map((layer, index) => (
        <g key={layer.label}>
          <rect
            x={48}
            y={layer.y}
            width={264}
            height={44}
            rx={8}
            fill="var(--surface-card)"
            stroke={layer.color}
            strokeWidth={1.5}
          />
          <text x={72} y={layer.y + 20} fontSize={10} fontWeight="700" fill={layer.color}>
            {layer.label}
          </text>
          <text x={72} y={layer.y + 34} fontSize={8} fill="var(--text-muted)">
            {layer.sub}
          </text>
          {index < layers.length - 1 ? (
            <line x1={180} y1={layer.y + 44} x2={180} y2={layers[index + 1].y} stroke="var(--surface-border)" strokeWidth={2} />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
