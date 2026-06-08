/** BMI270 sensor data types — mirrors Bitstream2SensorSamplePayload */

export type ConnectionMode = 'connecting' | 'live' | 'disconnected' | 'sim'

export interface SensorFrame {
  timestamp: number   // ms (performance.now())

  // Accelerometer (g)
  ax: number; ay: number; az: number
  accValid: boolean

  // Gyroscope (°/s)
  gx: number; gy: number; gz: number
  gyrValid: boolean

  // Temperature (°C)
  temp: number
  tempValid: boolean

  // Euler angles (deg)
  heading: number; pitch: number; roll: number
  eulerValid: boolean

  // Quaternion (unit)
  qw: number; qx: number; qy: number; qz: number
  quatValid: boolean
}

export const DEFAULT_FRAME: SensorFrame = {
  timestamp: 0,
  ax: 0,    ay: 0,    az: 1,      accValid:   false,
  gx: 0,    gy: 0,    gz: 0,      gyrValid:   false,
  temp: 25,                        tempValid:  false,
  heading: 0, pitch: 0, roll: 0,  eulerValid: false,
  qw: 1,    qx: 0,    qy: 0, qz: 0, quatValid: false,
}

// T3D WS protocol types
export interface T3DMessage {
  type: 'message' | 'suback' | 'hello'
  topic: string
  payload: RawSensorPayload
}

export interface RawSensorPayload {
  sensorId: number
  mask:     number
  counter:  number
  tMs:      number
  values:   number[]
  atMs?:    number
  origin?:  string
}

export const BMI270_MASK = {
  ACC:   0x01,
  GYR:   0x02,
  TMP:   0x04,
  EULER: 0x08,
  QUAT:  0x10,
} as const

// ─── BMM350 Magnetometer ─────────────────────────────────────────────────────
// Wire: sensorId=1, values[] are int16, ÷100 → µT / °C
// Mask bits from firmware bmm350.ts

export const BMM350_MASK = {
  MAG: 0x01,
  TMP: 0x02,
} as const

export interface Bmm350SensorFrame {
  timestamp: number
  /** Magnetic field components (µT) — right-hand frame, same axes as BMI270 */
  bx: number; by: number; bz: number
  magValid: boolean
  /** On-chip temperature (°C) */
  temp: number
  tempValid: boolean
}

export const DEFAULT_BMM350_FRAME: Bmm350SensorFrame = {
  timestamp: 0,
  // Bangkok, Thailand — approximate Earth field: ~26 µT North, ~34 µT Down
  bx: 26, by: 0, bz: -34,
  magValid: false,
  temp: 25,
  tempValid: false,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Magnetic field magnitude |B| in µT */
export function magMagnitude(bx: number, by: number, bz: number): number {
  return Math.sqrt(bx * bx + by * by + bz * bz)
}

/**
 * Magnetic heading (deg, 0–360 CW from North).
 * Level-only — no tilt compensation. Pass tilt-corrected B for full accuracy.
 */
export function compassHeading(bx: number, by: number): number {
  const h = Math.atan2(by, bx) * (180 / Math.PI)
  return (h + 360) % 360
}
