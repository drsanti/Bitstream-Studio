import type { FlowWireVec3 } from "../live/flow-wire-types";
import { readValueNormalizerInput as readAxisInput } from "./value-normalizer-operations";

export { readAxisInput as readTransformAxisInput };

export function evaluateTransformPartialVec3(
  x: number,
  y: number,
  z: number,
): FlowWireVec3 {
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    z: Number.isFinite(z) ? z : 0,
  };
}
