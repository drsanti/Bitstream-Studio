import { wrapRadiansSignedPi } from "../../../telemetry/telemetryFormat.js";
import type { FusionEulerHundredths } from "./bmi270FusionExtract.js";

/**
 * Converts fusion wire scalars (radians ×100) into Three.js `Euler` **x / y / z** radians
 * for `setFromEuler(..., FUSION_EULER_ORDER)`.
 *
 * Naive assignment roll→x, pitch→y did not match physical axes on hardware: rotation about
 * firmware frame **X** tracks the **pitch** wire field; about **Y** tracks **roll**; **Z** tracks **heading**.
 * So `Euler.x` ← pitch, `Euler.y` ← roll, `Euler.z` ← heading (heading = yaw about **N**’s Z).
 *
 * Each channel is wrapped to **(−π, π]** so [0, 2π) wire values match quaternion convention / UI.
 */
export function fusionWireEulerHundredthsToThreeEulerRadComponents(
  e: FusionEulerHundredths,
): { ex: number; ey: number; ez: number } {
  return {
    ex: wrapRadiansSignedPi(e.pitch / 100),
    ey: wrapRadiansSignedPi(e.roll / 100),
    ez: wrapRadiansSignedPi(e.heading / 100),
  };
}
