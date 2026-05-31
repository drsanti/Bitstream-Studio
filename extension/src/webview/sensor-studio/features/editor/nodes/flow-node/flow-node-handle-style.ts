import type { CSSProperties } from "react";

/**
 * Port accent only — position uses React Flow defaults (`right`/`left: 0` +
 * `translate(±50%, -50%)` in `flow-node-handles.css`) on the `w-0` anchor column.
 */
export function flowNodeHandleStyle(
  _side: "left" | "right",
  borderColor: string,
): CSSProperties {
  return { borderColor };
}
