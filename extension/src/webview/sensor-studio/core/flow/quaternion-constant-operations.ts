import { readValueNormalizerInput as readQuaternionAxisInput } from "./value-normalizer-operations";
import type { FlowWireQuaternion } from "../live/flow-wire-types";

export { readQuaternionAxisInput };

export const QUATERNION_CONSTANT_DEFAULTS = {
  w: 1,
  x: 0,
  y: 0,
  z: 0,
} as const;

export function evaluateQuaternionConstant(
  w: number,
  x: number,
  y: number,
  z: number,
): FlowWireQuaternion {
  return {
    w: Number.isFinite(w) ? w : QUATERNION_CONSTANT_DEFAULTS.w,
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    z: Number.isFinite(z) ? z : 0,
  };
}
