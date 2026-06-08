/** T–RH comfort chart with optional live sample position. */
export function ComfortZoneSvg({
  tempC = 24,
  rhPct = 50,
  showMarker = false,
}: {
  tempC?: number;
  rhPct?: number;
  showMarker?: boolean;
}) {
  const pad = { l: 44, r: 24, t: 24, b: 40 };
  const w = 320;
  const h = 240;
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const tMin = 10;
  const tMax = 35;
  const rhMin = 0;
  const rhMax = 100;

  const toX = (rh: number) => pad.l + ((rh - rhMin) / (rhMax - rhMin)) * plotW;
  const toY = (t: number) => pad.t + ((tMax - t) / (tMax - tMin)) * plotH;

  const zone = {
    x: toX(35),
    y: toY(27),
    width: toX(65) - toX(35),
    height: toY(20) - toY(27),
  };

  const markerX = toX(Math.max(rhMin, Math.min(rhMax, rhPct)));
  const markerY = toY(Math.max(tMin, Math.min(tMax, tempC)));

  return (
    <svg className="presentation-diagram-svg" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="var(--surface-card)" stroke="var(--surface-border)" />
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        fill="color-mix(in srgb, var(--accent-cyan) 18%, transparent)"
        stroke="var(--accent-cyan)"
        strokeWidth={1}
        rx={4}
      />
      <text x={zone.x + zone.width / 2} y={zone.y + zone.height / 2 + 4} textAnchor="middle" fontSize={10} fill="var(--accent-cyan)">
        Comfort band
      </text>
      {showMarker && Number.isFinite(tempC) && Number.isFinite(rhPct) ? (
        <circle cx={markerX} cy={markerY} r={7} fill="var(--accent-amber)" stroke="white" strokeWidth={2} />
      ) : null}
      <text x={w / 2} y={h - 10} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        %RH →
      </text>
      <text
        x={14}
        y={pad.t + plotH / 2}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-muted)"
        transform={`rotate(-90 14 ${pad.t + plotH / 2})`}
      >
        °C
      </text>
    </svg>
  );
}
