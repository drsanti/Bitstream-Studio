/** 2D block diagram: 6-DoF IMU = accel + gyro. */
export function ImuSixDofSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 360 260" aria-hidden>
      <defs>
        <linearGradient id="imu-chip" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-amber-bg)" />
          <stop offset="100%" stopColor="var(--surface-card)" />
        </linearGradient>
      </defs>

      <rect x={118} y={28} width={124} height={56} rx={10} fill="url(#imu-chip)" stroke="var(--accent-amber)" strokeWidth={1.5} />
      <text x={180} y={52} textAnchor="middle" fontSize={13} fontWeight="700" fill="var(--text-primary)">
        BMI270
      </text>
      <text x={180} y={70} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        6-DoF inertial sensor
      </text>

      <rect x={32} y={118} width={130} height={72} rx={10} fill="var(--surface-card)" stroke="var(--axis-x)" strokeWidth={1.5} />
      <text x={97} y={144} textAnchor="middle" fontSize={12} fontWeight="700" fill="var(--axis-x)">
        Accelerometer
      </text>
      <text x={97} y={164} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
        aX aY aZ (g)
      </text>
      <text x={97} y={180} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        specific force
      </text>

      <rect x={198} y={118} width={130} height={72} rx={10} fill="var(--surface-card)" stroke="var(--accent-amber)" strokeWidth={1.5} />
      <text x={263} y={144} textAnchor="middle" fontSize={12} fontWeight="700" fill="var(--accent-amber)">
        Gyroscope
      </text>
      <text x={263} y={164} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
        ωX ωY ωZ (°/s)
      </text>
      <text x={263} y={180} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        angular rate
      </text>

      <path d="M 180 84 L 97 118" stroke="var(--surface-border)" strokeWidth={2} markerEnd="url(#imu-arrow)" />
      <path d="M 180 84 L 263 118" stroke="var(--surface-border)" strokeWidth={2} />

      <rect x={72} y={214} width={216} height={36} rx={8} fill="var(--accent-cyan-bg)" stroke="var(--accent-cyan)" strokeWidth={1} />
      <text x={180} y={237} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
        EVT_SENSOR · sensorId 0 · BS2 live store
      </text>

      <defs>
        <marker id="imu-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--surface-border)" />
        </marker>
      </defs>
    </svg>
  );
}
