import type { ReadingAxis } from "./ReadingAxisNumber";

/** Default tints for flow-node scalar components (x=red, y=green, z=sky, w=pink). */
export const READING_PARAM_AXIS_VALUE_CLASS: Record<ReadingAxis, string> = {
  x: "text-red-300/95",
  y: "text-emerald-300/95",
  z: "text-sky-300/95",
  w: "text-pink-300/95",
};

export function readingParamAxisValueClass(axis: ReadingAxis): string {
  return READING_PARAM_AXIS_VALUE_CLASS[axis];
}
