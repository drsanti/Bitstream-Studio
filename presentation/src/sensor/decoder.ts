/**
 * Decodes raw Bitstream2SensorSamplePayload values[] into a SensorFrame.
 *
 * Wire format: values[] is a flat int32 array, values packed in canonical order:
 *   ACC(3) → GYR(3) → TMP(1) → EULER(3) → QUAT(4)
 * Each group is only present when its bit is set in `mask`.
 *
 * Scale factors:
 *   ACC: int32 × (1/100) / 9.80665 → g
 *   GYR: int32 × (1/100) × (180/π)  → °/s
 *   TMP: int32 × (1/100)             → °C
 *   EULER: int32 × (1/100) × (180/π) → degrees
 *   QUAT: int32 × (1/10000)          → unit quaternion component
 */
import {
  type RawSensorPayload,
  type SensorFrame, DEFAULT_FRAME, BMI270_MASK,
  type Bmm350SensorFrame, DEFAULT_BMM350_FRAME, BMM350_MASK,
} from './types'

const G = 9.80665
const RAD2DEG = 180 / Math.PI

export function decodePayload(payload: RawSensorPayload): SensorFrame {
  if (payload.sensorId !== 0) return { ...DEFAULT_FRAME, timestamp: performance.now() }

  const { mask, values: v } = payload
  let idx = 0

  const frame: SensorFrame = { ...DEFAULT_FRAME, timestamp: performance.now() }

  if (mask & BMI270_MASK.ACC) {
    frame.ax = v[idx]   / 100 / G
    frame.ay = v[idx+1] / 100 / G
    frame.az = v[idx+2] / 100 / G
    frame.accValid = true
    idx += 3
  }

  if (mask & BMI270_MASK.GYR) {
    frame.gx = v[idx]   / 100 * RAD2DEG
    frame.gy = v[idx+1] / 100 * RAD2DEG
    frame.gz = v[idx+2] / 100 * RAD2DEG
    frame.gyrValid = true
    idx += 3
  }

  if (mask & BMI270_MASK.TMP) {
    frame.temp = v[idx] / 100
    frame.tempValid = true
    idx += 1
  }

  if (mask & BMI270_MASK.EULER) {
    frame.heading = v[idx]   / 100 * RAD2DEG
    frame.pitch   = v[idx+1] / 100 * RAD2DEG
    frame.roll    = v[idx+2] / 100 * RAD2DEG
    frame.eulerValid = true
    idx += 3
  }

  if (mask & BMI270_MASK.QUAT) {
    frame.qw = v[idx]   / 10000
    frame.qx = v[idx+1] / 10000
    frame.qy = v[idx+2] / 10000
    frame.qz = v[idx+3] / 10000
    frame.quatValid = true
  }

  return frame
}

// ─── BMM350 Decoder ──────────────────────────────────────────────────────────
/**
 * Decodes BMM350 payload (sensorId=1).
 * values[] are int16. Order: [mx, my, mz] when MAG set, [temp] when TMP set.
 * Scale: ÷100 for µT (magnetic) and °C (temperature).
 */
export function decodeBmm350Payload(payload: RawSensorPayload): Bmm350SensorFrame {
  if (payload.sensorId !== 1) return { ...DEFAULT_BMM350_FRAME, timestamp: performance.now() }

  const { mask, values: v } = payload
  let idx = 0

  const frame: Bmm350SensorFrame = { ...DEFAULT_BMM350_FRAME, timestamp: performance.now() }

  if (mask & BMM350_MASK.MAG) {
    frame.bx = v[idx]   / 100  // µT
    frame.by = v[idx+1] / 100
    frame.bz = v[idx+2] / 100
    frame.magValid = true
    idx += 3
  }

  if (mask & BMM350_MASK.TMP) {
    frame.temp = v[idx] / 100   // °C
    frame.tempValid = true
  }

  return frame
}
