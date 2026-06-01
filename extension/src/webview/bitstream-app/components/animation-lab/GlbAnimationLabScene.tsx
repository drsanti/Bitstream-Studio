import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import {
  GROUND_GRID_Y,
  ROTATION_PREVIEW_AMBIENT_INTENSITY,
  ROTATION_PREVIEW_CAMERA_POSITION,
  ROTATION_PREVIEW_GRID_FADE_DISTANCE,
  ROTATION_PREVIEW_ORBIT_MAX_DISTANCE,
} from "../3d-rotation/shared/rotationPreviewConstants.js";
import { RotationPreviewSceneEnvironment } from "../3d-rotation/shared/RotationPreviewSceneEnvironment.js";
import { GlbAnimationLabBody } from "./GlbAnimationLabBody.js";
import { AnimationLabCss3dCameraSync } from "./css3d/AnimationLabCss3dCameraSync.js";

export function GlbAnimationLabScene(props: {
  fetchUrl: string;
  showGrid: boolean;
  showBackgroundTexture: boolean;
  useCubemapIbl: boolean;
  environmentPresetIndex: number;
}) {
  const {
    fetchUrl,
    showGrid,
    showBackgroundTexture,
    useCubemapIbl,
    environmentPresetIndex,
  } = props;

  return (
    <>
      <RotationPreviewSceneEnvironment
        showBackgroundTexture={showBackgroundTexture}
        useCubemapIbl={useCubemapIbl}
        environmentPresetIndex={environmentPresetIndex}
      />
      <OrbitControls
        dampingFactor={0.08}
        enableDamping
        enablePan
        makeDefault
        maxDistance={ROTATION_PREVIEW_ORBIT_MAX_DISTANCE}
        minDistance={0.35}
        screenSpacePanning
        target={[0, 0, 0]}
      />
      <ambientLight intensity={ROTATION_PREVIEW_AMBIENT_INTENSITY} />
      {showGrid ? (
        <Grid
          args={[24, 24]}
          cellColor="#3f3f46"
          cellSize={0.25}
          cellThickness={0.65}
          fadeDistance={ROTATION_PREVIEW_GRID_FADE_DISTANCE}
          fadeStrength={1}
          infiniteGrid
          position={[0, GROUND_GRID_Y, 0]}
          renderOrder={-1}
          sectionColor="#71717a"
          sectionSize={1}
          sectionThickness={1}
          side={THREE.DoubleSide}
        />
      ) : null}
      <Suspense fallback={null}>
        <GlbAnimationLabBody url={fetchUrl} />
      </Suspense>
      <AnimationLabCss3dCameraSync />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={["#f87171", "#4ade80", "#60a5fa"]}
          labelColor="#e4e4e7"
          labels={["X", "Y", "Z"]}
        />
      </GizmoHelper>
    </>
  );
}

export const ANIMATION_LAB_CAMERA_POSITION = ROTATION_PREVIEW_CAMERA_POSITION;
