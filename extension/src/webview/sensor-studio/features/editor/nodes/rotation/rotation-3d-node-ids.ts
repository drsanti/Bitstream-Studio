/**
 * Canonical Sensor Studio catalog ids for 3D rotation preview nodes.
 */
export const ROTATION_3D_NODE_CATALOG_IDS = [
  "rotation-3d-euler",
  "rotation-3d-quaternion",
  /** Same drag + resize affordances as rotation previews (GLTF viewport). */
  "model-viewer",
] as const;

export type Rotation3DCatalogNodeId = (typeof ROTATION_3D_NODE_CATALOG_IDS)[number];

export const ROTATION_3D_NODE_CATALOG_ID_SET: ReadonlySet<string> = new Set(
  ROTATION_3D_NODE_CATALOG_IDS,
);

export function isRotation3DCatalogNodeId(nodeId: string): boolean {
  return ROTATION_3D_NODE_CATALOG_ID_SET.has(nodeId);
}
