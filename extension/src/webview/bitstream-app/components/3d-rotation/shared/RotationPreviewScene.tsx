import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import type { FusionEulerHundredths } from "./bmi270FusionExtract.js";
import type { OrientationPreviewMappingMode } from "./orientationPreviewMapping.js";
import { OrientationMarkerMesh } from "./OrientationMarkerMesh.js";
import { RotationPreviewSceneEnvironment } from "./RotationPreviewSceneEnvironment.js";
import {
  GROUND_GRID_Y,
  ROTATION_PREVIEW_AMBIENT_INTENSITY,
  ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
  ROTATION_PREVIEW_GRID_FADE_DISTANCE,
  ROTATION_PREVIEW_ORBIT_MAX_DISTANCE,
} from "./rotationPreviewConstants.js";
import type { GlbAnimationClipPreviewDrive } from "../../../../sensor-studio/features/editor/gltf/studio-glb-animation-preview-mixer";
import type { StudioGlbAnimationPlaybackModeV1 } from "../../../../sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode";
import type { GlbMaterialPbrDriveRow } from "../../../../sensor-studio/features/editor/gltf/studio-glb-material-param";
import type { GlbMaterialTextureDriveRow } from "../../../../sensor-studio/features/editor/gltf/studio-glb-material-texture";
import type { GlbMaterialColorDriveRow } from "../../../../sensor-studio/features/editor/gltf/studio-glb-material-color";
import type { GlbMaterialVideoDriveRow } from "../../../../sensor-studio/features/editor/gltf/studio-glb-material-video";
import type { Css3dCameraFeedSpec } from "../../../../sensor-studio/core/camera/studio-camera-css3d-feed";

export type RotationPreviewSceneProps = {
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  fusionEulerHundredths: FusionEulerHundredths | null;
  meshOrientationFromEulerFallback: boolean;
  eulerOnly?: boolean;
  /** Wire fusion quaternion → mesh frame (default wire-direct). */
  orientationMappingMode?: OrientationPreviewMappingMode;
  /** Smooth orientation updates (slerp) inside the render loop. */
  orientationSlerpEnabled?: boolean;
  showGrid: boolean;
  /** When false, scene background is solid color (cubemap hidden as backdrop). */
  showBackgroundTexture?: boolean;
  /** When true, cubemap drives `scene.environment` for PBR reflections (independent of `showBackgroundTexture`). */
  useCubemapIbl?: boolean;
  /** Index into built-in engine cubemap presets (see `getEngineEnvironmentCubeMaps`) for background / IBL texture. */
  environmentPresetIndex?: number;
  /** Sensor Studio: full **`Scene3DConfigV1`** payload for {@link StudioSceneViewport} (vanilla Three path). */
  scene3d?: unknown;
  /** Resolved fetch URL for the orientation body GLB (defaults to PSoC E84 when omitted). */
  previewMeshGlbUrl?: string;
  /**
   * Stage workbench: all models wired to Scene Output. When length > 1, the viewport
   * loads each GLB side-by-side; use {@link stagePrimaryModelIndex} for frame/animation focus.
   */
  stageModelInstances?: Array<{
    modelUrl: string;
    studioAssetId?: string;
    sourceNodeId?: string;
    transformWire?: unknown;
  }>;
  /** Stage workbench: focus index into {@link stageModelInstances} (frame camera, GLB drives). */
  stagePrimaryModelIndex?: number;
  /** Wired **physics-world** snapshot (`FlowWirePhysicsSceneV1`) for Stage Rapier preview. */
  stagePhysicsWire?: unknown;
  /** Graph **box-collider** / **sphere-collider** nodes when physics is enabled. */
  stagePhysicsColliders?: unknown;
  /** Stage workbench: procedural meshes from Scene Output **Meshes** wires. */
  stageProceduralMeshes?: Array<{
    sourceNodeId: string;
    label: string;
    wire: unknown;
  }>;
  /** Optional morph weights keyed like GLB extraction (`meshKey:morphName`). */
  glbMorphWeights?: Record<string, number>;
  /** Optional light intensity overrides by embedded GLB light object name. */
  glbLightIntensityByName?: Record<string, number>;
  /** Optional animation clip local times (seconds) by clip name. */
  glbAnimationTimeByClipName?: Record<string, number>;
  /** Optional per-clip mixer time scale (defaults to **1** when omitted). */
  glbAnimationTimeScaleByClipName?: Record<string, number>;
  /** Optional per-clip loop mode for the studio GLB preview (`once` | `loop` | `pingpong`). */
  glbAnimationLoopByClipName?: Record<string, "once" | "loop" | "pingpong">;
  /** Optional per-clip action weight (0–1) in the preview mixer. */
  glbAnimationWeightByClipName?: Record<string, number>;
  /** Structured per-clip drives (trim, fade, loop, weight) for the studio GLB preview mixer. */
  glbAnimationClipDrivesByName?: Record<string, GlbAnimationClipPreviewDrive>;
  /** Multi-clip strategy from **GLB Animation Bundle** wire (default **per-clip**). */
  glbAnimationPlaybackMode?: StudioGlbAnimationPlaybackModeV1;
  /** Clip order for **sequence** mode. */
  glbAnimationClipOrder?: string[];
  /** Bundle inspector Play active — when **false**, holds scrub pose. */
  glbAnimationInspectorTransportActive?: boolean;
  /** Optional part visibility by object path (`> 0.5` visible), matching GLB extraction part refs. */
  glbPartVisibilityByPath?: Record<string, number>;
  /** Optional continuous local-axis spin by object path (rad/s), applied after animation mixer. */
  glbPartSpinByPath?: Record<
    string,
    { axis: "x" | "y" | "z"; speedRadS: number; enabled: boolean }
  >;
  /** Optional material PBR scalars by material **name** (emissive, roughness, metalness, opacity). */
  glbMaterialPbrByName?: Record<string, GlbMaterialPbrDriveRow>;
  /** Optional material texture URLs by material **name** and map slot. */
  glbMaterialTexturesByName?: Record<string, GlbMaterialTextureDriveRow>;
  /** Optional live camera **VideoTexture** drives by material **name** and map slot. */
  glbMaterialVideosByName?: Record<string, GlbMaterialVideoDriveRow>;
  /** Optional base / emissive RGB drives by material **name** (0–1 channels). */
  glbMaterialColorsByName?: Record<string, GlbMaterialColorDriveRow>;
  /** Screen / world CSS3D camera feed panels for this viewport. */
  cameraCss3dFeeds?: Css3dCameraFeedSpec[];
  /** @deprecated Prefer {@link glbMaterialPbrByName}. Emissive-only legacy map. */
  glbMaterialEmissiveByName?: Record<string, number>;
  /**
   * Optional embedded GLB camera drives by object **name**. Strongest value **> 0.5** wins and
   * copies that camera’s pose into the studio orbit camera for the frame.
   */
  glbCameraDriveByName?: Record<string, number>;
  /** Active embedded camera slot from flow **`camera-switch`** (0–7). */
  glbCameraSwitchIndex?: number;
  /** Optional explicit camera name ordering for slot index resolution. */
  glbCameraSwitchRig?: string[];
};

export function RotationPreviewScene(props: RotationPreviewSceneProps) {
  const {
    qw,
    qx,
    qy,
    qz,
    fusionEulerHundredths,
    meshOrientationFromEulerFallback,
    eulerOnly,
    orientationMappingMode,
    orientationSlerpEnabled = true,
    showGrid,
    showBackgroundTexture = true,
    useCubemapIbl = ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
    environmentPresetIndex,
    previewMeshGlbUrl,
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
        enabled
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
      <OrientationMarkerMesh
        qw={qw}
        qx={qx}
        qy={qy}
        qz={qz}
        fusionEulerHundredths={fusionEulerHundredths}
        meshOrientationFromEulerFallback={meshOrientationFromEulerFallback}
        eulerOnly={eulerOnly}
        orientationMappingMode={orientationMappingMode}
        slerpEnabled={orientationSlerpEnabled}
        glbUrl={previewMeshGlbUrl}
      />
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
