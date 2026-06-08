/**
 * Simulation fallback — generates realistic BMI270 sensor data.
 * Used when no T3D WS connection is available.
 */
import type { SensorFrame } from './types'

let t = 0

export function simulateFrame(): SensorFrame {
  t += 0.016   // ~60 fps

  // Gentle oscillating tilt
  const tiltPitch = Math.sin(t * 0.3) * 25     // ±25°
  const tiltRoll  = Math.sin(t * 0.2 + 1) * 15 // ±15°

  const pitchRad = (tiltPitch * Math.PI) / 180
  const rollRad  = (tiltRoll  * Math.PI) / 180

  // Gravity projection (specific force convention — flat = +1g on Z)
  const ax = -Math.sin(pitchRad)
  const ay =  Math.sin(rollRad) * Math.cos(pitchRad)
  const az =  Math.cos(rollRad) * Math.cos(pitchRad)

  // Gentle angular velocity (deg/s)
  const gx = Math.cos(t * 0.3) * 0.3 * 25 * (Math.PI / 180)    * (180 / Math.PI)
  const gy = Math.cos(t * 0.2 + 1) * 0.2 * 15 * (Math.PI / 180) * (180 / Math.PI)
  const gz = Math.sin(t * 0.15) * 5

  // Add tiny noise
  const n = () => (Math.random() - 0.5) * 0.005

  // Euler from tilt
  const heading = (t * 5) % 360

  return {
    timestamp: performance.now(),
    ax: ax + n(), ay: ay + n(), az: az + n(), accValid: true,
    gx: gx + n(), gy: gy + n(), gz: gz + n(), gyrValid: true,
    temp: 28 + Math.sin(t * 0.05) * 3, tempValid: true,
    heading, pitch: tiltPitch, roll: tiltRoll, eulerValid: true,
    // Simple quaternion from Euler (approx — good enough for 3D demo)
    qw: Math.cos(pitchRad / 2) * Math.cos(rollRad / 2),
    qx: Math.sin(pitchRad / 2) * Math.cos(rollRad / 2),
    qy: Math.cos(pitchRad / 2) * Math.sin(rollRad / 2),
    qz: Math.sin(pitchRad / 2) * Math.sin(rollRad / 2),
    quatValid: true,
  }
}
