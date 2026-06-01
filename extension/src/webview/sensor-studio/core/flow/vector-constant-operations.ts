import { readValueNormalizerInput as readVectorAxisInput } from "./value-normalizer-operations";
import type { FlowWireVec3 } from "../live/flow-wire-types";

export { readVectorAxisInput };

export const VECTOR_CONSTANT_DEFAULTS = {
  x: 0,
  y: 0,
  z: 0,
} as const;

export function evaluateVectorConstant(x: number, y: number, z: number): FlowWireVec3 {
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    z: Number.isFinite(z) ? z : 0,
  };
}
