import type { BitstreamSensorSampleV2 } from "../../../../bitstream/events/sensor-decoder";
import {
  extractNormalizedQuatFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "../../../bitstream-app/components/3d-rotation/shared/bmi270FusionExtract.js";

/** Studio wire quaternion `{x,y,z,w}` (matches quat splitter / `FlowWireQuaternion` in the flow store). */
export type Bmi270StudioQuaternion = { x: number; y: number; z: number; w: number };

/** Maps fusion quaternion wire fields to studio wire quaternion `{x,y,z,w}` (same as vec/quat splitters). */
export function fusionQuaternionFromBmi270Sample(
  sample: BitstreamSensorSampleV2 | null,
): Bmi270StudioQuaternion {
  const q = extractNormalizedQuatFromBmi270Sample(sample);
  return { x: q.qx, y: q.qy, z: q.qz, w: q.qw };
}

export { hasFusionQuaternionWireFields };
