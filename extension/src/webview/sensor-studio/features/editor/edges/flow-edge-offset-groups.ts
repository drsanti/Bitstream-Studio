import type { Edge } from "@xyflow/react";

/** Symmetric perpendicular offsets for each edge in multi-wire groups (index-centered). */
export function symmetricOffsetsForEdgeGroups(
  groups: ReadonlyMap<string, readonly Edge[]>,
  spacingPx: number,
): Map<string, number> {
  const offsetById = new Map<string, number>();
  if (spacingPx <= 0) {
    return offsetById;
  }

  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }
    const center = (group.length - 1) / 2;
    group.forEach((edge, index) => {
      offsetById.set(edge.id, Math.round((index - center) * spacingPx));
    });
  }

  return offsetById;
}
