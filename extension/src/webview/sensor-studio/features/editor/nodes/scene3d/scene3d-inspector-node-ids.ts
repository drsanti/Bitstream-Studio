/**
 * Catalog node ids that expose the Scene3D inspector (node tab cards + viewport chrome).
 */
export const SCENE3D_INSPECTOR_NODE_CATALOG_IDS = [
  "rotation-3d-euler",
  "rotation-3d-quaternion",
  /** Same drag + resize affordances as rotation previews (GLTF viewport). */
  "model-viewer",
] as const;

export type Scene3dInspectorNodeCatalogId = (typeof SCENE3D_INSPECTOR_NODE_CATALOG_IDS)[number];

export const SCENE3D_INSPECTOR_NODE_CATALOG_ID_SET: ReadonlySet<string> = new Set(
  SCENE3D_INSPECTOR_NODE_CATALOG_IDS,
);

export function isScene3dInspectorNodeId(nodeId: string): boolean {
  return SCENE3D_INSPECTOR_NODE_CATALOG_ID_SET.has(nodeId);
}

/** @deprecated Use {@link SCENE3D_INSPECTOR_NODE_CATALOG_IDS}. */
export const ROTATION_3D_NODE_CATALOG_IDS = SCENE3D_INSPECTOR_NODE_CATALOG_IDS;

/** @deprecated Use {@link Scene3dInspectorNodeCatalogId}. */
export type Rotation3DCatalogNodeId = Scene3dInspectorNodeCatalogId;

/** @deprecated Use {@link SCENE3D_INSPECTOR_NODE_CATALOG_ID_SET}. */
export const ROTATION_3D_NODE_CATALOG_ID_SET = SCENE3D_INSPECTOR_NODE_CATALOG_ID_SET;

/** @deprecated Use {@link isScene3dInspectorNodeId}. */
export const isRotation3DCatalogNodeId = isScene3dInspectorNodeId;
