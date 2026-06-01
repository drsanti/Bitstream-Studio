import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { computeGlbPreviewBodyGroupPosition } from "./compute-glb-preview-body-placement.js";
import type { GlbPreviewCatalogTransform } from "./glb-preview-catalog-transform.types.js";
import { GLB_PREVIEW_BODY_PLACEMENT_MODE } from "./rotationPreviewConstants.js";

const DEG2RAD = Math.PI / 180;

function catalogTransformToThree(
  transform: GlbPreviewCatalogTransform | undefined,
): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
} | null {
  if (transform == null) {
    return null;
  }
  const hasPosition = transform.position != null;
  const hasRotation = transform.rotationDeg != null;
  const hasScale = transform.scale != null;
  if (!hasPosition && !hasRotation && !hasScale) {
    return null;
  }
  return {
    position: transform.position ?? [0, 0, 0],
    rotation: (transform.rotationDeg ?? [0, 0, 0]).map((d) => d * DEG2RAD) as [
      number,
      number,
      number,
    ],
    scale: transform.scale ?? [1, 1, 1],
  };
}

export function useGlbPreviewAutoPlacement(scene: THREE.Object3D): THREE.Vector3 | null {
  return useMemo(() => {
    if (GLB_PREVIEW_BODY_PLACEMENT_MODE === "authored") {
      return null;
    }
    return computeGlbPreviewBodyGroupPosition(scene, {
      mode: GLB_PREVIEW_BODY_PLACEMENT_MODE,
      scale: 1,
    });
  }, [scene]);
}

/**
 * Renders a cached glTF scene with export-authored transform by default.
 * Optional auto-placement or catalog metadata adds a parent group only when configured.
 */
export function GlbPreviewModelRoot(props: {
  scene: THREE.Object3D;
  autoPlacement?: THREE.Vector3 | null;
  catalogTransform?: GlbPreviewCatalogTransform;
}) {
  const computedPlacement = useGlbPreviewAutoPlacement(props.scene);
  const autoPlacement =
    props.autoPlacement !== undefined ? props.autoPlacement : computedPlacement;

  const catalogGroup = useMemo(
    () => catalogTransformToThree(props.catalogTransform),
    [props.catalogTransform],
  );

  const mesh: ReactNode = <primitive object={props.scene} />;

  if (autoPlacement != null) {
    return <group position={autoPlacement}>{mesh}</group>;
  }

  if (catalogGroup == null) {
    return mesh;
  }

  return (
    <group
      position={catalogGroup.position}
      rotation={catalogGroup.rotation}
      scale={catalogGroup.scale}
    >
      {mesh}
    </group>
  );
}
