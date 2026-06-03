import type { Node } from "@xyflow/react";

/** Center of a flow node in flow coordinates (position + measured size). */
export function flowNodeCenter(node: Node): { x: number; y: number } {
  const width =
    typeof node.width === "number" && node.width > 0
      ? node.width
      : typeof node.measured?.width === "number"
        ? node.measured.width
        : 0;
  const height =
    typeof node.height === "number" && node.height > 0
      ? node.height
      : typeof node.measured?.height === "number"
        ? node.measured.height
        : 0;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}
