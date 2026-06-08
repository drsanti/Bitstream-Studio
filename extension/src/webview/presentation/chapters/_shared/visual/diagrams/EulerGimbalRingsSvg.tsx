/** 2D nested gimbal rings illustrating roll / pitch / yaw. */
export function EulerGimbalRingsSvg() {
  const cx = 180;
  const cy = 120;

  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 360 240" aria-hidden>
      <ellipse cx={cx} cy={cy} rx={110} ry={42} fill="none" stroke="var(--axis-x)" strokeWidth={3} opacity={0.9} />
      <text x={cx + 118} y={cy - 8} fontSize={11} fontWeight="700" fill="var(--axis-x)">
        Roll
      </text>

      <ellipse cx={cx} cy={cy} rx={78} ry={78} fill="none" stroke="var(--axis-y)" strokeWidth={3} opacity={0.9} transform={`rotate(-28 ${cx} ${cy})`} />
      <text x={cx - 118} y={cy + 6} fontSize={11} fontWeight="700" fill="var(--axis-y)">
        Pitch
      </text>

      <ellipse cx={cx} cy={cy} rx={42} ry={110} fill="none" stroke="var(--axis-z)" strokeWidth={3} opacity={0.9} />
      <text x={cx + 6} y={cy - 118} fontSize={11} fontWeight="700" fill="var(--axis-z)">
        Yaw
      </text>

      <circle cx={cx} cy={cy} r={10} fill="var(--surface-card)" stroke="var(--surface-border)" strokeWidth={2} />
      <text x={180} y={218} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        Sequential Euler rotations · quaternion avoids singularities
      </text>
    </svg>
  );
}
