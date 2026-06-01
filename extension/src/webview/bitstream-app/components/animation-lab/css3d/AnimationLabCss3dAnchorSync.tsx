import { useFrame } from "@react-three/fiber";
import { useAnimationLabSceneStore } from "../animation-lab-scene.store.js";
import { useGlbAnimationLabTwin } from "../glb-animation-lab-twin-context.js";
import { useAnimationLabCss3dAnchorStore } from "./animation-lab-css3d-anchor.store.js";
import {
  applyTagStyleOffsetsToPositions,
  useAnimationLabTwinTagStyleStore,
} from "../animation-lab-twin-tag-style.store.js";
import { getTwinAnchorResolver } from "./compute-twin-anchor-world-positions.js";

/** Updates twin tag world positions from the loaded GLB scene graph. */
export function AnimationLabCss3dAnchorSync() {
  const root = useAnimationLabSceneStore((s) => s.root);
  const twinCtx = useGlbAnimationLabTwin();
  const setPositions = useAnimationLabCss3dAnchorStore((s) => s.setPositions);
  const tagStyles = useAnimationLabTwinTagStyleStore((s) => s.byComponent);

  useFrame(() => {
    if (root == null || twinCtx?.twin == null) {
      return;
    }
    const resolver = getTwinAnchorResolver(root, twinCtx.twin.components);
    const base = resolver.updatePositions();
    setPositions(applyTagStyleOffsetsToPositions(base, tagStyles));
  });

  return null;
}
