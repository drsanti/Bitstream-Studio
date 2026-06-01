import * as THREE from "three";
import {
  applyUserPreviewTransportToClipActions,
  type GlbPreviewUserTransport,
} from "../../../../sensor-studio/features/editor/gltf/glb-preview-user-transport";

export function collectGlbAnimationActions(
  actions: Record<string, THREE.AnimationAction | null | undefined>,
): Map<string, THREE.AnimationAction> {
  const map = new Map<string, THREE.AnimationAction>();
  for (const [name, ac] of Object.entries(actions)) {
    if (ac != null) {
      map.set(name, ac);
    }
  }
  return map;
}

export function applyRotationPreviewBodyGlbTransport(args: {
  actions: Record<string, THREE.AnimationAction | null | undefined>;
  transport: GlbPreviewUserTransport;
}): Map<string, THREE.AnimationAction> {
  const clipActions = collectGlbAnimationActions(args.actions);
  if (clipActions.size === 0) {
    return clipActions;
  }
  applyUserPreviewTransportToClipActions({
    clipActions,
    transport: args.transport,
  });
  return clipActions;
}
