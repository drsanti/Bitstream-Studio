import { Suspense, useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF, Box } from "@react-three/drei";
import * as THREE from "three";
import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";
import { GlbPreviewModelRoot } from "../../../bitstream-app/components/3d-rotation/shared/GlbPreviewModelRoot";
import { Diagram3dMeshMaterial } from "./Diagram3dMeshMaterial";
import { useDiagram3dCatalogMaterialTint } from "./diagram3dCatalogMaterialTint";

function CatalogGlbBody({
  url,
  material,
  opacity,
  animationClip,
  animationLoop,
  animationPlaying,
}: {
  url: string;
  material?: Diagram3dMaterialV1;
  opacity: number;
  animationClip?: string;
  animationLoop?: boolean;
  animationPlaying?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  useDiagram3dCatalogMaterialTint(clonedScene, material, opacity);
  const { actions } = useAnimations(clonedScene, groupRef);

  useEffect(() => {
    for (const action of Object.values(actions)) {
      action?.stop();
    }
    if (animationClip == null || animationClip.length === 0) {
      return;
    }
    const action = actions[animationClip];
    if (action == null) {
      return;
    }
    action.reset();
    action.setLoop(
      animationLoop !== false ? THREE.LoopRepeat : THREE.LoopOnce,
      animationLoop !== false ? Infinity : 1,
    );
    if (animationPlaying !== false) {
      action.play();
    }
    return () => {
      action.stop();
    };
  }, [actions, animationClip, animationLoop, animationPlaying]);

  return (
    <group ref={groupRef}>
      <GlbPreviewModelRoot scene={clonedScene} />
    </group>
  );
}

function CatalogModelMissingFallback({
  opacity = 1,
  emissiveBoost = 0.05,
  material,
}: {
  opacity?: number;
  emissiveBoost?: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Box args={[0.8, 0.8, 0.8]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Box>
  );
}

export function Diagram3dCatalogModelMesh({
  url,
  opacity = 1,
  selected = false,
  highlightRole = "none",
  emissiveBoost = 0,
  material,
  animationClip,
  animationLoop,
  animationPlaying,
}: {
  url: string | null;
  opacity?: number;
  selected?: boolean;
  highlightRole?: "none" | "selected" | "active";
  emissiveBoost?: number;
  material?: Diagram3dMaterialV1;
  animationClip?: string;
  animationLoop?: boolean;
  animationPlaying?: boolean;
}) {
  const fallbackBoost =
    emissiveBoost > 0
      ? emissiveBoost
      : highlightRole === "active" || selected
        ? 0.2
        : 0.05;

  if (url == null || url.length === 0) {
    return (
      <CatalogModelMissingFallback
        opacity={opacity}
        emissiveBoost={fallbackBoost}
        material={material}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <CatalogModelMissingFallback
          opacity={opacity}
          emissiveBoost={fallbackBoost}
          material={material}
        />
      }
    >
      <CatalogGlbBody
        url={url}
        material={material}
        opacity={opacity}
        animationClip={animationClip}
        animationLoop={animationLoop}
        animationPlaying={animationPlaying}
      />
    </Suspense>
  );
}
