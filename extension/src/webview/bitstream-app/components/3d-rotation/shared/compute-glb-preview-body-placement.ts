import * as THREE from "three";
import { GROUND_GRID_Y } from "./rotationPreviewConstants.js";

/**
 * How the preview group positions a loaded GLB before scale.
 *
 * - **authored** — no translation; keep export pivot (Blender world origin).
 * - **bbox-center** — AABB center at world origin (optional integrator mode).
 * - **bbox-floor** — AABB min Y on {@link GROUND_GRID_Y}; X/Z centered (optional integrator mode).
 */
export type GlbPreviewBodyPlacementMode = "authored" | "bbox-center" | "bbox-floor";

export function computeGlbPreviewBodyGroupPosition(
  root: THREE.Object3D,
  args: {
    mode: GlbPreviewBodyPlacementMode;
    groundY?: number;
    /** Group scale applied after this position (used for floor Y only). */
    scale?: number;
  },
): THREE.Vector3 {
  if (args.mode === "authored") {
    return new THREE.Vector3(0, 0, 0);
  }

  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) {
    return new THREE.Vector3();
  }

  const center = box.getCenter(new THREE.Vector3());
  if (args.mode === "bbox-center") {
    return new THREE.Vector3(-center.x, -center.y, -center.z);
  }

  const groundY = args.groundY ?? GROUND_GRID_Y;
  const scale = args.scale ?? 1;
  return new THREE.Vector3(-center.x, groundY - scale * box.min.y, -center.z);
}
