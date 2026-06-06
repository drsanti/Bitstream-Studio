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

const AXIS_HANDLE_IDS = new Set<string>(["x", "y", "z", "w"]);

/** Split / combine axis pins and labeled ports (X, Y, Z, W). */
export function resolveReadingAxisFromHandleOrLabel(
  handleId?: string,
  label?: string,
): ReadingAxis | null {
  const id = handleId?.trim().toLowerCase();
  if (id != null && AXIS_HANDLE_IDS.has(id)) {
    return id as ReadingAxis;
  }
  const lab = label?.trim().toLowerCase();
  if (lab != null && AXIS_HANDLE_IDS.has(lab)) {
    return lab as ReadingAxis;
  }
  return null;
}
