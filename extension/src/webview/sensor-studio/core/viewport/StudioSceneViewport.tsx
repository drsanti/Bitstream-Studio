import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fetchAndParseGltfFromUrl } from "../../features/editor/gltf/load-gltf-from-url.js";
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { ReadingLabel } from "../../features/editor/nodes/flow-node/readings/ReadingLabel";
import { ReadingPanel } from "../../features/editor/nodes/flow-node/readings/ReadingPanel";
import type { RotationPreviewSceneProps } from "../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import { resolveDefaultPreviewMeshGlbUrl } from "../../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.js";
import { resolveStudioAsset } from "../../features/asset-browser/resolveStudioAsset";
import { getStudioEnvironmentDescriptorById } from "../../features/asset-browser/studio-environment-scene-bindings";
import {
  resolveStudioModelDescriptorForPersistedModel,
  resolveStudioModelGltfFetchUrl,
  resolveStudioModelPackRelativePath,
} from "../../features/asset-browser/studio-model-scene-bindings";
import { useStudioAssetDescriptors } from "../../features/asset-browser/useStudioAssetDescriptors";
import { buildCubeMapFaceUrls } from "../../../model-catalog/model-preview-utils";
import {
  ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC,
  ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE,
} from "../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";
import { usePreviewMeshMissingUiStore } from "../../../bitstream-app/state/previewMeshMissingUi.store.js";
import type { NotifyMissingAssetPayload } from "../../../bitstream-app/state/previewMeshMissingUi.store.js";
import {
  buildGlobalDirectoryFallbackOptions,
  inferPackRelativePathFromAssetUrl,
  resolveGlobalDirectoryFetchFallbackUrl,
} from "../../../asset-resolution/global-directory-online-fallback";
import {
  friendlyGlbLoadErrorMessage,
  missingLocalMirrorDialogBullets,
} from "../../../model-loader/ui/glb-local-mirror-integrity.js";
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from "../../../model-loader/ui/preflightModelPreviewUrl.js";
import { resolveStudioWebGlPixelRatio } from "../../features/editor/nodes/display/canvas-hi-dpi";
import { useStudioCanvasDisplayScale } from "../../features/editor/nodes/display/studio-canvas-display-scale";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  parseHexToThreeColor,
  type EmbeddedRigPolicy,
  type Scene3DConfigV1,
  type StudioDirectionalLightV1,
} from "../scene3d/scene3d-config";
import {
  createPreviewFogRuntimeState,
  syncPreviewSceneFog,
} from "./studio-viewport-fog-runtime";
import {
  createPreviewBloomRuntimeState,
  createPreviewContactShadowRuntimeState,
  disposePreviewCompositorRuntime,
  renderPreviewFrame,
  syncPreviewContactShadows,
} from "./studio-viewport-compositor-runtime";
import {
  createPreviewParticleRuntimeState,
  disposePreviewParticleRuntime,
  tickPreviewParticleEmitter,
} from "./studio-viewport-particle-runtime";
import type { GlbMaterialPbrDriveRow } from "../../features/editor/gltf/studio-glb-material-param";
import {
  createStudioViewportCss3dWorldRuntime,
  type StudioViewportCss3dWorldRuntime,
} from "./studio-viewport-css3d-world";
import { StudioCameraCss3dFeedsOverlay } from "./StudioCameraCss3dFeedsOverlay";
import { StudioVisionDetectionsHud } from "./StudioVisionDetectionsHud";
import { StudioVisionPoseSketchOverlay } from "./StudioVisionPoseSketchOverlay";
import { graphHasVisionPoseSketch } from "../../core/camera/collect-vision-pose-sketches";
import { collectVisionLandmarks3dSpecs } from "../../core/camera/collect-vision-landmarks-3d-specs";
import { studioVisionLandmarks3dOverlay } from "../../core/camera/studio-vision-landmarks-3d-overlay";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { Css3dCameraFeedSpec } from "../camera/studio-camera-css3d-feed";
import type { GlbMaterialColorDriveRow } from "../../features/editor/gltf/studio-glb-material-color";
import {
  applyGlbLightIntensityOverrides,
  applyGlbMaterialColorByName,
  applyGlbMaterialPbrByName,
  applyGlbMaterialTexturesByName,
  applyGlbMaterialVideoTexturesByName,
  resetGlbMaterialVideoDriveState,
  type GlbMaterialVideoDriveRow,
  type GlbMaterialVideoDriveState,
  applyGlbMorphWeightsToModelRoot,
  applyGlbPartVisibilityByPathMap,
  applyStudioCameraFromBlendedGlbCameras,
  buildStudioGlbPathIndex,
  collectEmbeddedGlbCameraNames,
  resetGlbMaterialColorDriveState,
  resetGlbMaterialPbrDriveState,
  resetGlbMaterialTextureDriveState,
  resetGlbPartVisibilityDriveState,
  resolveGlbCameraBlendWeights,
  resolveGlbCameraDrivesWithSwitch,
  type GlbMaterialColorDriveState,
  type GlbMaterialPbrDriveState,
  type GlbMaterialTextureDriveState,
  type GlbPartVisibilityDriveState,
} from "../../features/editor/gltf/studio-glb-preview-runtime";
import {
  applyStudioGlbAnimationMixerDrives,
  createStudioGlbAnimationMixerState,
  type GlbAnimationClipPreviewDrive,
} from "../../features/editor/gltf/studio-glb-animation-preview-mixer";
import {
  advanceGlbAnimationSequenceAfterMixerTick,
  filterGlbAnimationDrivesForPreview,
  resetGlbAnimationSequencePlaybackState,
  type GlbAnimationSequencePlaybackState,
  type StudioGlbAnimationPlaybackModeV1,
} from "../../features/editor/gltf/studio-glb-animation-playback-mode";
import {
  applyUserPreviewTransportToClipActions,
  flowOwnsGlbPreviewAnimation,
  type GlbPreviewUserTransport,
} from "../../features/editor/gltf/glb-preview-user-transport";
import { GlbPreviewPlaybackControls } from "./GlbPreviewPlaybackControls";
import {
  applyStudioShadowMeshes,
  configureStudioDirectionalShadow,
  disableShadowOnObjectSubtree,
  resolveStudioShadowParams,
  studioShadowPipelineKey,
} from "./studio-viewport-shadow-runtime";
import {
  cameraDriveKeyFromScene3d,
  frameStudioViewportCamera,
  resetStudioViewportCameraToScene3d,
} from "./studio-viewport-camera";
import { coerceFlowWirePhysicsSceneV1 } from "../../features/editor/nodes/physics/flow-wire-physics-scene";
import type { StagePhysicsColliderV1 } from "../stage/stage-physics-colliders";
import {
  applyFlowWireTransformToObject3D,
  bindStageViewportPickHandler,
  frameStudioViewportOnModelRoots,
  layoutStageModelRootsAlongX,
  stageMultiModelsLoadKey,
  type StageViewportModelInstance,
  type StageViewportPickDetail,
} from "./studio-viewport-stage-multi-models";
import {
  createPreviewPhysicsRuntimeState,
  disposePreviewPhysicsRuntime,
  stepPreviewPhysicsRuntime,
  syncPreviewPhysicsRuntime,
  type PreviewPhysicsRuntimeState,
} from "./studio-viewport-physics-runtime";
import { applyFirmwareOrientationMapping } from "../../../bitstream-app/components/3d-rotation/shared/firmwareOrientationMapping.js";
import { fusionWireEulerHundredthsToThreeEulerRadComponents } from "../../../bitstream-app/components/3d-rotation/shared/fusionEulerWireToThreeEulerRad.js";
import type { FusionEulerHundredths } from "../../../bitstream-app/components/3d-rotation/shared/bmi270FusionExtract.js";
import { FUSION_EULER_ORDER } from "../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants.js";

/** Reused so `quaternionFromSceneProps` stays allocation-free on the hot path. */
const eulerWireScratch = {
  euler: new THREE.Euler(),
  body: new THREE.Quaternion(),
  mapped: new THREE.Quaternion(),
  tmp: new THREE.Quaternion(),
};

function quaternionFromFusionEulerWireHundredths(
  hundredths: FusionEulerHundredths,
): THREE.Quaternion {
  const { ex, ey, ez } =
    fusionWireEulerHundredthsToThreeEulerRadComponents(hundredths);
  eulerWireScratch.euler.set(ex, ey, ez, FUSION_EULER_ORDER);
  eulerWireScratch.body.setFromEuler(eulerWireScratch.euler);
  eulerWireScratch.body.invert();
  applyFirmwareOrientationMapping(
    eulerWireScratch.body,
    eulerWireScratch.mapped,
    eulerWireScratch.tmp,
  );
  return eulerWireScratch.mapped;
}

function quaternionFromSceneProps(
  p: RotationPreviewSceneProps,
): THREE.Quaternion {
  // Match `OrientationMarkerMesh`: identity quaternion is a placeholder when driving from Euler wires.
  if (p.eulerOnly === true) {
    const h = p.fusionEulerHundredths ?? { roll: 0, pitch: 0, heading: 0 };
    return quaternionFromFusionEulerWireHundredths(h);
  }

  // Prefer explicit quaternion props when they look valid (same mapping as OrientationMarkerMesh).
  if (
    Number.isFinite(p.qw) &&
    Number.isFinite(p.qx) &&
    Number.isFinite(p.qy) &&
    Number.isFinite(p.qz)
  ) {
    eulerWireScratch.body.set(p.qx, p.qy, p.qz, p.qw);
    if (eulerWireScratch.body.lengthSq() > 1e-6) {
      eulerWireScratch.body.normalize();
      applyFirmwareOrientationMapping(
        eulerWireScratch.body,
        eulerWireScratch.mapped,
        eulerWireScratch.tmp,
      );
      return eulerWireScratch.mapped.clone();
    }
  }

  // Euler fallback when quaternion is unusable (same wire mapping as Bitstream R3F preview).
  if (p.fusionEulerHundredths != null) {
    return quaternionFromFusionEulerWireHundredths(p.fusionEulerHundredths);
  }

  return new THREE.Quaternion();
}

/** Identity quaternion from Model Viewer / transform-only graphs — do not overwrite `root.rotation`. */
function isPlaceholderOrientationQuaternion(q: THREE.Quaternion): boolean {
  return (
    Math.abs(q.w - 1) < 1e-5 &&
    Math.abs(q.x) < 1e-5 &&
    Math.abs(q.y) < 1e-5 &&
    Math.abs(q.z) < 1e-5
  );
}

/** `flow-node` = card chrome (ReadingPanel + title). `stage-fullbleed` = workbench Stage pane only. */
export type StudioSceneViewportPresentation = "flow-node" | "stage-fullbleed";

export type StudioSceneViewportProps = {
  title: string;
  sceneProps: RotationPreviewSceneProps;
  /** When set and no model URL is configured, show this instead of loading a default GLB. */
  emptyHint?: string;
  /** Optional override; flow cards inherit zoom from {@link StudioFlowCanvasDisplayScaleProvider}. */
  displayScale?: number;
  /** Default `flow-node`. Stage workbench uses `stage-fullbleed` (no ReadingPanel wrapper). */
  presentation?: StudioSceneViewportPresentation;
  /**
   * Isolates this WebGL instance from other previews (missing-asset dedupe, diagnostics).
   * Stage: `sensor-studio-stage`. Flow nodes: `flow-node:<reactFlowId>`.
   */
  previewScopeId?: string;
  /** Stage only — model pick → Domain C via {@link dispatchStagePickEvent}. */
  onStagePick?: (detail: StageViewportPickDetail) => void;
  /** Live vision inference status chips (pose / hands / face / object). */
  visionHudNodes?: readonly FlowGraphNode[];
  /** Flow edges for vision skeleton overlay bus resolution. */
  visionHudEdges?: readonly {
    source: string;
    target: string;
    targetHandle?: string | null;
    sourceHandle?: string | null;
  }[];
};

/** Stable identity — avoids reload loops when `model.url` toggles relative path vs resolved fetch URL. */
function stableModelLoadKey(model: Scene3DConfigV1["model"]): string {
  const policy = model.embeddedRigPolicy;
  const sid = model.studioAssetId?.trim() ?? "";
  if (sid.length > 0) {
    return `id:${sid}\u0000${policy}`;
  }
  const url = model.url.trim();
  const rel = inferPackRelativePathFromAssetUrl(url) ?? url;
  return `url:${rel}\u0000${policy}`;
}

function modelLoadKey(s: Scene3DConfigV1): string {
  return stableModelLoadKey(s.model);
}

function modelUrlFromLoadKey(key: string): string {
  const sep = key.indexOf("\u0000");
  const head = sep >= 0 ? key.slice(0, sep) : key;
  if (head.startsWith("url:")) {
    return head.slice(4);
  }
  return head.startsWith("id:") ? "" : head;
}

function modelUrlForPolicyOnlyCompare(
  loadedKey: string,
  model: Scene3DConfigV1["model"],
): string {
  const fromKey = modelUrlFromLoadKey(loadedKey);
  return fromKey.length > 0 ? fromKey : model.url.trim();
}

/** Flow-node and Stage previews should not hijack the shell with the full Free Loader modal. */
function notifyMissingAssetForPreviewScope(
  previewScopeKey: string,
  payload: NotifyMissingAssetPayload,
): void {
  const embeddedFlow = previewScopeKey.startsWith("flow-node:");
  const stageWorkbench =
    previewScopeKey === "sensor-studio-stage" || previewScopeKey === "stage-fullbleed";
  const suppressFreeLoaderModal = embeddedFlow || stageWorkbench;
  usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
    ...payload,
    autoOpenFreeAssetsLoader: suppressFreeLoaderModal
      ? false
      : payload.autoOpenFreeAssetsLoader,
  });
}

/** Strip embedded GLTF lights/cameras under `root` according to studio policy. */
function applyEmbeddedRigPolicy(
  root: THREE.Object3D,
  policy: EmbeddedRigPolicy,
): void {
  if (policy === "keep") {
    return;
  }
  const removeList: THREE.Object3D[] = [];
  root.traverse((obj) => {
    const tagged = obj as THREE.Object3D & {
      isLight?: boolean;
      isCamera?: boolean;
    };
    if (policy === "strip") {
      if (tagged.isLight === true || tagged.isCamera === true) {
        removeList.push(obj);
      }
    } else if (policy === "hybrid") {
      if (tagged.isCamera === true) {
        removeList.push(obj);
      }
    }
  });
  for (const obj of removeList) {
    obj.parent?.remove(obj);
    const lit = obj as THREE.Light;
    lit.dispose?.();
  }
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const meshLike = obj as THREE.Mesh;
    const geometry = (meshLike as { geometry?: THREE.BufferGeometry }).geometry;
    if (geometry) {
      geometry.dispose?.();
    }
    const material = (meshLike as { material?: unknown }).material;
    if (!material) {
      return;
    }
    if (Array.isArray(material)) {
      for (const m of material) {
        (m as THREE.Material).dispose?.();
      }
      return;
    }
    (material as THREE.Material).dispose?.();
  });
}

/** Superseded in-flight GLB — geometry only (avoid revoking blob textures still parsing elsewhere). */
function disposeSupersededGltfScene(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh === true) {
      mesh.geometry?.dispose();
    }
  });
}

function degToRad(v: number): number {
  return (v * Math.PI) / 180;
}

function applyPreviewPixelRatio(
  renderer: THREE.WebGLRenderer,
  rendererCfg: Scene3DConfigV1["renderer"],
  displayScale: number,
): void {
  renderer.setPixelRatio(
    resolveStudioWebGlPixelRatio(rendererCfg, displayScale),
  );
}

function setSceneEnvRotationY(scene: THREE.Scene, yawDeg: number) {
  // Supported in newer Three.js versions (backgroundRotation/environmentRotation).
  const yaw = degToRad(yawDeg);
  const anyScene = scene as unknown as {
    backgroundRotation?: THREE.Euler;
    environmentRotation?: THREE.Euler;
  };
  if (anyScene.backgroundRotation == null) {
    anyScene.backgroundRotation = new THREE.Euler(0, 0, 0, "YXZ");
  }
  if (anyScene.environmentRotation == null) {
    anyScene.environmentRotation = new THREE.Euler(0, 0, 0, "YXZ");
  }
  anyScene.backgroundRotation.y = yaw;
  anyScene.environmentRotation.y = yaw;
}

/** Ground plane Y for flow contact-shadow disc (grid when enabled, else model bbox min). */
function resolvePreviewContactShadowGroundY(
  scene3d: Scene3DConfigV1,
  modelRoot: THREE.Object3D | null,
  root: THREE.Object3D,
): number {
  if (scene3d.helpers.grid.enabled) {
    return scene3d.helpers.grid.y;
  }
  if (modelRoot != null) {
    root.updateMatrixWorld(true);
    modelRoot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(modelRoot);
    return box.min.y;
  }
  return 0;
}

function applyOrbitControlsFromScene3d(
  controls: OrbitControls,
  c: Scene3DConfigV1["controls"],
) {
  controls.enableDamping = c.enableDamping;
  controls.dampingFactor = c.dampingFactor;
  controls.enablePan = c.enablePan;
  controls.enableRotate = c.enableRotate;
  controls.enableZoom = c.enableZoom;
  controls.screenSpacePanning = c.screenSpacePanning;
  controls.zoomToCursor = c.zoomToCursor;
  controls.rotateSpeed = c.rotateSpeed;
  controls.zoomSpeed = c.zoomSpeed;
  controls.panSpeed = c.panSpeed;
  controls.keyRotateSpeed = c.keyRotateSpeed;
  controls.keyPanSpeed = c.keyPanSpeed;
  controls.autoRotate = c.autoRotate;
  controls.autoRotateSpeed = c.autoRotateSpeed;
  controls.minDistance = c.minDistance;
  controls.maxDistance = c.maxDistance ?? Infinity;
  controls.minPolarAngle = degToRad(c.minPolarAngleDeg);
  controls.maxPolarAngle = degToRad(c.maxPolarAngleDeg);
  controls.minAzimuthAngle =
    c.minAzimuthDeg != null ? degToRad(c.minAzimuthDeg) : -Infinity;
  controls.maxAzimuthAngle =
    c.maxAzimuthDeg != null ? degToRad(c.maxAzimuthDeg) : Infinity;
  controls.minTargetRadius = c.minTargetRadius;
  controls.maxTargetRadius = c.maxTargetRadius ?? Infinity;

  controls.mouseButtons.LEFT =
    c.mouseButtons.left === "ROTATE"
      ? THREE.MOUSE.ROTATE
      : c.mouseButtons.left === "DOLLY"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.PAN;
  controls.mouseButtons.MIDDLE =
    c.mouseButtons.middle === "ROTATE"
      ? THREE.MOUSE.ROTATE
      : c.mouseButtons.middle === "DOLLY"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.PAN;
  controls.mouseButtons.RIGHT =
    c.mouseButtons.right === "ROTATE"
      ? THREE.MOUSE.ROTATE
      : c.mouseButtons.right === "DOLLY"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.PAN;

  controls.touches.ONE =
    c.touches.one === "PAN" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.touches.TWO =
    c.touches.two === "DOLLY_ROTATE"
      ? THREE.TOUCH.DOLLY_ROTATE
      : THREE.TOUCH.DOLLY_PAN;
}

export type StudioSceneViewportHandle = {
  /** Frame orbit camera on the loaded GLB root. */
  framePrimaryModel: () => void;
  /** Restore camera + target from current `scene3d` rig. */
  resetCameraToScene3d: () => void;
};

/**
 * Vanilla Three.js renderer (no R3F) for deterministic resizing.
 * Shared by Stage, Model Viewer, and 3D Rotation flow previews.
 */
export const StudioSceneViewport = forwardRef<
  StudioSceneViewportHandle,
  StudioSceneViewportProps
>(function StudioSceneViewport(props, ref) {
  const { title, emptyHint, presentation = "flow-node", previewScopeId } = props;
  const stageFullBleed = presentation === "stage-fullbleed";
  const previewScopeKey = previewScopeId ?? (stageFullBleed ? "stage-fullbleed" : title);
  const previewScopeKeyRef = useRef(previewScopeKey);
  previewScopeKeyRef.current = previewScopeKey;
  const viewportApiRef = useRef<StudioSceneViewportHandle | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      framePrimaryModel: () => viewportApiRef.current?.framePrimaryModel(),
      resetCameraToScene3d: () => viewportApiRef.current?.resetCameraToScene3d(),
    }),
    [],
  );
  const emptyHintRef = useRef(emptyHint);
  emptyHintRef.current = emptyHint;
  const { descriptors } = useStudioAssetDescriptors();
  const descriptorsRef = useRef(descriptors);
  descriptorsRef.current = descriptors;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayScale = useStudioCanvasDisplayScale();
  const displayScaleRef = useRef(displayScale);
  const resizeRendererRef = useRef<(() => void) | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [hasGlbAnimations, setHasGlbAnimations] = useState(false);
  const [userTransport, setUserTransport] =
    useState<GlbPreviewUserTransport>("stopped");
  const userPreviewTransportRef = useRef<GlbPreviewUserTransport>("stopped");

  const glbMorphRef = useRef<Record<string, number>>({});
  const glbLightsRef = useRef<Record<string, number>>({});
  const glbAnimsRef = useRef<Record<string, number>>({});
  const glbAnimScalesRef = useRef<Record<string, number>>({});
  const glbAnimLoopsRef = useRef<Record<string, "once" | "loop" | "pingpong">>(
    {},
  );
  const glbAnimWeightsRef = useRef<Record<string, number>>({});
  const glbAnimDrivesRef = useRef<Record<string, GlbAnimationClipPreviewDrive>>(
    {},
  );
  const glbAnimPlaybackModeRef =
    useRef<StudioGlbAnimationPlaybackModeV1>("per-clip");
  const glbAnimClipOrderRef = useRef<string[]>([]);
  const glbAnimInspectorTransportActiveRef = useRef(true);
  const glbAnimSequenceStateRef = useRef<GlbAnimationSequencePlaybackState>({
    activeClipName: null,
  });
  const glbAnimPlaybackModePrevRef =
    useRef<StudioGlbAnimationPlaybackModeV1>("per-clip");
  const glbPartsRef = useRef<Record<string, number>>({});
  const glbMaterialPbrRef = useRef<Record<string, GlbMaterialPbrDriveRow>>({});
  const glbMaterialTexturesRef = useRef<
    Record<string, GlbMaterialTextureDriveRow>
  >({});
  const glbMaterialVideosRef = useRef<Record<string, GlbMaterialVideoDriveRow>>(
    {},
  );
  const glbMaterialColorsRef = useRef<Record<string, GlbMaterialColorDriveRow>>(
    {},
  );
  const glbCamerasRef = useRef<Record<string, number>>({});
  const glbCameraSwitchIndexRef = useRef<number | undefined>(undefined);
  const glbCameraSwitchRigRef = useRef<string[] | undefined>(undefined);
  const cameraCss3dFeedsRef = useRef<Css3dCameraFeedSpec[]>([]);
  const scenePropsGlb = props.sceneProps as RotationPreviewSceneProps & {
    glbMorphWeights?: Record<string, number>;
    glbLightIntensityByName?: Record<string, number>;
    glbAnimationTimeByClipName?: Record<string, number>;
    glbAnimationTimeScaleByClipName?: Record<string, number>;
    glbAnimationLoopByClipName?: Record<string, "once" | "loop" | "pingpong">;
    glbAnimationWeightByClipName?: Record<string, number>;
    glbAnimationClipDrivesByName?: Record<string, GlbAnimationClipPreviewDrive>;
    glbAnimationPlaybackMode?: StudioGlbAnimationPlaybackModeV1;
    glbAnimationClipOrder?: string[];
    glbAnimationInspectorTransportActive?: boolean;
    glbPartVisibilityByPath?: Record<string, number>;
    glbMaterialPbrByName?: Record<string, GlbMaterialPbrDriveRow>;
    glbMaterialTexturesByName?: Record<string, GlbMaterialTextureDriveRow>;
    glbMaterialVideosByName?: Record<string, GlbMaterialVideoDriveRow>;
    glbMaterialColorsByName?: Record<string, GlbMaterialColorDriveRow>;
    cameraCss3dFeeds?: import("../../core/camera/studio-camera-css3d-feed").Css3dCameraFeedSpec[];
    glbCameraDriveByName?: Record<string, number>;
    glbCameraSwitchIndex?: number;
    glbCameraSwitchRig?: string[];
  };
  glbMorphRef.current = scenePropsGlb.glbMorphWeights ?? {};
  glbLightsRef.current = scenePropsGlb.glbLightIntensityByName ?? {};
  glbAnimsRef.current = scenePropsGlb.glbAnimationTimeByClipName ?? {};
  glbAnimScalesRef.current =
    scenePropsGlb.glbAnimationTimeScaleByClipName ?? {};
  glbAnimLoopsRef.current = scenePropsGlb.glbAnimationLoopByClipName ?? {};
  glbAnimWeightsRef.current = scenePropsGlb.glbAnimationWeightByClipName ?? {};
  glbAnimDrivesRef.current = scenePropsGlb.glbAnimationClipDrivesByName ?? {};
  glbAnimPlaybackModeRef.current =
    scenePropsGlb.glbAnimationPlaybackMode ?? "per-clip";
  glbAnimClipOrderRef.current = scenePropsGlb.glbAnimationClipOrder ?? [];
  glbAnimInspectorTransportActiveRef.current =
    scenePropsGlb.glbAnimationInspectorTransportActive !== false;
  if (glbAnimPlaybackModePrevRef.current !== glbAnimPlaybackModeRef.current) {
    resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
    glbAnimPlaybackModePrevRef.current = glbAnimPlaybackModeRef.current;
  }
  glbPartsRef.current = scenePropsGlb.glbPartVisibilityByPath ?? {};
  glbMaterialPbrRef.current = scenePropsGlb.glbMaterialPbrByName ?? {};
  glbMaterialTexturesRef.current =
    scenePropsGlb.glbMaterialTexturesByName ?? {};
  glbMaterialVideosRef.current = scenePropsGlb.glbMaterialVideosByName ?? {};
  glbMaterialColorsRef.current = scenePropsGlb.glbMaterialColorsByName ?? {};
  glbCamerasRef.current = scenePropsGlb.glbCameraDriveByName ?? {};
  glbCameraSwitchIndexRef.current = scenePropsGlb.glbCameraSwitchIndex;
  glbCameraSwitchRigRef.current = scenePropsGlb.glbCameraSwitchRig;
  cameraCss3dFeedsRef.current = scenePropsGlb.cameraCss3dFeeds ?? [];

  const flowOwnsPlayback = useMemo(
    () =>
      flowOwnsGlbPreviewAnimation({
        structuredDrives: scenePropsGlb.glbAnimationClipDrivesByName ?? {},
        legacyTimesByClip: scenePropsGlb.glbAnimationTimeByClipName ?? {},
      }),
    [
      scenePropsGlb.glbAnimationClipDrivesByName,
      scenePropsGlb.glbAnimationTimeByClipName,
    ],
  );

  useEffect(() => {
    userPreviewTransportRef.current = userTransport;
  }, [userTransport]);

  const onPreviewPlay = useCallback(() => {
    setUserTransport("playing");
    userPreviewTransportRef.current = "playing";
  }, []);
  const onPreviewPause = useCallback(() => {
    setUserTransport("paused");
    userPreviewTransportRef.current = "paused";
  }, []);
  const onPreviewStop = useCallback(() => {
    setUserTransport("stopped");
    userPreviewTransportRef.current = "stopped";
  }, []);

  const quatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  useEffect(() => {
    quatRef.current.copy(quaternionFromSceneProps(props.sceneProps));
  }, [props.sceneProps]);

  const rawScene3d = (
    props.sceneProps as RotationPreviewSceneProps & {
      scene3d?: unknown;
    }
  ).scene3d;
  const scene3d = useMemo<Scene3DConfigV1>(
    () =>
      rawScene3d != null
        ? coerceScene3DConfigV1(rawScene3d)
        : defaultScene3DConfig(),
    [rawScene3d],
  );

  const showBackgroundTexture =
    props.sceneProps.showBackgroundTexture === undefined
      ? scene3d.environment.showBackgroundTexture !== false
      : props.sceneProps.showBackgroundTexture !== false;
  const useCubemapIbl =
    props.sceneProps.useCubemapIbl === undefined
      ? scene3d.environment.useCubemapIbl !== false
      : props.sceneProps.useCubemapIbl !== false;
  const environmentPresetIndex =
    typeof props.sceneProps.environmentPresetIndex === "number" &&
    Number.isFinite(props.sceneProps.environmentPresetIndex)
      ? Math.max(0, Math.round(props.sceneProps.environmentPresetIndex))
      : scene3d.environment.presetIndex;
  const scene3dRef = useRef<Scene3DConfigV1>(scene3d);
  useEffect(() => {
    scene3dRef.current = scene3d;
  }, [scene3d]);

  const stageSceneProps = props.sceneProps as RotationPreviewSceneProps & {
    stageModelInstances?: StageViewportModelInstance[];
    stagePrimaryModelIndex?: number;
  };
  const stageModelsRef = useRef(stageSceneProps.stageModelInstances);
  const stagePrimaryIndexRef = useRef(
    typeof stageSceneProps.stagePrimaryModelIndex === "number" &&
      Number.isFinite(stageSceneProps.stagePrimaryModelIndex)
      ? Math.max(0, Math.round(stageSceneProps.stagePrimaryModelIndex))
      : 0,
  );
  stageModelsRef.current = stageSceneProps.stageModelInstances;
  stagePrimaryIndexRef.current =
    typeof stageSceneProps.stagePrimaryModelIndex === "number" &&
    Number.isFinite(stageSceneProps.stagePrimaryModelIndex)
      ? Math.max(0, Math.round(stageSceneProps.stagePrimaryModelIndex))
      : 0;

  const stagePhysicsRef = useRef(
    coerceFlowWirePhysicsSceneV1(stageSceneProps.stagePhysicsWire),
  );
  stagePhysicsRef.current = coerceFlowWirePhysicsSceneV1(stageSceneProps.stagePhysicsWire);
  const stagePhysicsCollidersRef = useRef<readonly StagePhysicsColliderV1[]>(
    Array.isArray(stageSceneProps.stagePhysicsColliders)
      ? (stageSceneProps.stagePhysicsColliders as StagePhysicsColliderV1[])
      : [],
  );
  stagePhysicsCollidersRef.current = Array.isArray(stageSceneProps.stagePhysicsColliders)
    ? (stageSceneProps.stagePhysicsColliders as StagePhysicsColliderV1[])
    : [];

  const onStagePickRef = useRef(props.onStagePick);
  onStagePickRef.current = props.onStagePick;

  const visionHudNodesRef = useRef(props.visionHudNodes);
  visionHudNodesRef.current = props.visionHudNodes;
  const visionHudEdgesRef = useRef(props.visionHudEdges);
  visionHudEdgesRef.current = props.visionHudEdges;

  useEffect(() => {
    displayScaleRef.current = displayScale;
    resizeRendererRef.current?.();
  }, [displayScale]);

  useEffect(() => {
    const host = viewportRef.current;
    const canvas = canvasRef.current;
    if (host == null || canvas == null) {
      return;
    }

    setInitError(null);

    const tryCreateRenderer = (): THREE.WebGLRenderer | null => {
      // Avoid initializing while layout is still 0x0 (common during node resize/mount).
      const w = Math.round(host.clientWidth);
      const h = Math.round(host.clientHeight);
      if (w <= 1 || h <= 1) {
        return null;
      }

      // Let Three acquire WebGL(2): avoids mismatched manual getContext + HMR canvas reuse edge cases.
      try {
        return new THREE.WebGLRenderer({
          canvas,
          alpha: false,
          antialias: true,
          depth: true,
          stencil: false,
          powerPreference: "high-performance",
        });
      } catch {
        try {
          return new THREE.WebGLRenderer({
            canvas,
            alpha: false,
            antialias: false,
            depth: true,
            stencil: false,
            powerPreference: "high-performance",
          });
        } catch {
          return null;
        }
      }
    };

    let renderer: THREE.WebGLRenderer | null = null;
    let initRaf: number | null = null;
    let disposed = false;

    const init = (): (() => void) | null => {
      if (disposed) {
        return null;
      }
      const nextRenderer = tryCreateRenderer();
      if (nextRenderer == null) {
        return null;
      }
      renderer = nextRenderer;

      applyPreviewPixelRatio(
        renderer,
        scene3dRef.current.renderer,
        displayScaleRef.current,
      );

      // Match RotationPreviewViewport onCreated(gl): tone mapping + exposure + sRGB output.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure =
        scene3dRef.current.renderer.toneMappingExposure ??
        ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      renderer.setClearColor(
        parseHexToThreeColor(scene3dRef.current.renderer.clearColorHex),
        1,
      );

      const scene = new THREE.Scene();
      const fogRuntime = createPreviewFogRuntimeState();
      const contactShadowRuntime = createPreviewContactShadowRuntimeState();
      const bloomRuntime = createPreviewBloomRuntimeState();
      const particleRuntime = createPreviewParticleRuntimeState();
      const particleOriginScratch = new THREE.Vector3();
      let embeddedCameraNames: string[] = [];
      let cubeTexture: THREE.CubeTexture | null = null;

      let lastEnvKey = "";
      let envLoadToken = 0;
      let modelLoadGen = 0;
      const loadEnvironment = async () => {
        const s = scene3dRef.current;
        const presetIndex =
          typeof s.environment.presetIndex === "number" &&
          Number.isFinite(s.environment.presetIndex)
            ? Math.max(0, Math.round(s.environment.presetIndex))
            : environmentPresetIndex;
        const studioSid = s.environment.studioAssetId;
        const studioResolveKey =
          typeof studioSid === "string" && studioSid.length > 0
            ? (getStudioEnvironmentDescriptorById(
                studioSid,
                descriptorsRef.current,
              )?.id ?? `pending:${studioSid}`)
            : "";
        const envKey = [
          studioResolveKey,
          presetIndex,
          s.environment.useCubemapIbl,
          s.environment.showBackgroundTexture,
        ].join("|");
        if (envKey === lastEnvKey) {
          return;
        }
        lastEnvKey = envKey;

        // During HMR / fast refresh, avoid clearing the environment before the new cubemap is ready.
        // PBR metals go black without `scene.environment`, so keep the previous one until swap.
        scene.background = parseHexToThreeColor(
          s.environment.backgroundColorHex,
        );

        const applyLoadedCubeTexture = (tex: THREE.CubeTexture): void => {
          const latest = scene3dRef.current;
          const previous = cubeTexture;
          cubeTexture = tex;
          tex.colorSpace = THREE.LinearSRGBColorSpace;
          tex.generateMipmaps = true;
          tex.needsUpdate = true;
          scene.environment = tex;
          const baseIbl = latest.environment.iblStrength ?? 1;
          scene.environmentIntensity =
            latest.environment.useCubemapIbl && useCubemapIbl
              ? baseIbl
              : baseIbl *
                (latest.environment.iblOffStrengthFrac ??
                  ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC);
          setSceneEnvRotationY(scene, latest.environment.yawDeg ?? 0);
          scene.background =
            latest.environment.showBackgroundTexture && showBackgroundTexture
              ? tex
              : parseHexToThreeColor(latest.environment.backgroundColorHex);
          previous?.dispose();
        };

        const loadCubeFromUrls = async (urls: string[]): Promise<boolean> => {
          if (urls.length !== 6) {
            return false;
          }
          const tryFaces = async (faceUrls: string[]): Promise<boolean> => {
            const token = (envLoadToken += 1);
            const loader = new THREE.CubeTextureLoader();
            const tex = await new Promise<THREE.CubeTexture | null>(
              (resolve) => {
                loader.load(
                  faceUrls,
                  (t) => resolve(t),
                  undefined,
                  () => resolve(null),
                );
              },
            );
            if (disposed || tex == null || token !== envLoadToken) {
              tex?.dispose?.();
              return false;
            }
            applyLoadedCubeTexture(tex);
            return true;
          };

          if (await tryFaces(urls)) {
            return true;
          }
          const onlineFaces = urls.map(
            (u) => resolveGlobalDirectoryFetchFallbackUrl(u) ?? u,
          );
          if (onlineFaces.some((u, i) => u !== urls[i])) {
            return tryFaces(onlineFaces);
          }
          return false;
        };

        if (typeof studioSid === "string" && studioSid.length > 0) {
          const desc = getStudioEnvironmentDescriptorById(
            studioSid,
            descriptorsRef.current,
          );
          if (desc != null) {
            const resolved = resolveStudioAsset(desc);
            const urls = resolved.cubemapFaceUrls;
            if (urls != null && (await loadCubeFromUrls(urls))) {
              return;
            }
          }
        }

        const presets = getEngineEnvironmentCubeMaps();
        const preset =
          presets[presetIndex] ??
          presets[0] ??
          presets[Math.max(0, presets.length - 1)];
        if (!preset) {
          return;
        }
        const urls = buildCubeMapFaceUrls(preset.path);
        const onlineUrls = urls.map(
          (u) => resolveGlobalDirectoryFetchFallbackUrl(u) ?? u,
        );
        const tryPresetFaces = async (faceUrls: string[]): Promise<boolean> => {
          const token = (envLoadToken += 1);
          const loader = new THREE.CubeTextureLoader();
          const tex = await new Promise<THREE.CubeTexture | null>((resolve) => {
            loader.load(
              faceUrls,
              (t) => resolve(t),
              undefined,
              () => resolve(null),
            );
          });
          if (disposed || tex == null || token !== envLoadToken) {
            tex?.dispose?.();
            return false;
          }
          applyLoadedCubeTexture(tex);
          return true;
        };
        if (
          !(await tryPresetFaces(urls)) &&
          onlineUrls.some((u, i) => u !== urls[i])
        ) {
          await tryPresetFaces(onlineUrls);
        }
        if (!disposed && scene.environment == null) {
          notifyMissingAssetForPreviewScope(previewScopeKeyRef.current, {
            dedupeKey: `studio-rotation-cubemap:${previewScopeKeyRef.current}:${urls[0]}`,
            title: "Environment / cubemap not available",
            description: `Could not load all six cubemap face images for preset path:\n${preset.path}\n\nExample URL:\n${urls[0]}\n\nUse Asset Manager → Actions to sync cubemap textures or the free asset pack.`,
          });
        }
      };

      const camera = new THREE.PerspectiveCamera(
        scene3dRef.current.camera.fovDeg,
        1,
        0.01,
        200,
      );
      const css3dWorldRuntime: StudioViewportCss3dWorldRuntime =
        createStudioViewportCss3dWorldRuntime({
          host,
          getCamera: () => camera,
        });
      camera.position.set(
        scene3dRef.current.camera.transform.position.x,
        scene3dRef.current.camera.transform.position.y,
        scene3dRef.current.camera.transform.position.z,
      );

      const controls = new OrbitControls(camera, renderer.domElement);
      applyOrbitControlsFromScene3d(controls, scene3dRef.current.controls);
      controls.target.set(
        scene3dRef.current.camera.transform.target.x,
        scene3dRef.current.camera.transform.target.y,
        scene3dRef.current.camera.transform.target.z,
      );
      controls.update();

      const ambient = new THREE.AmbientLight(
        parseHexToThreeColor(scene3dRef.current.lights.ambient.colorHex),
        scene3dRef.current.lights.ambient.intensity,
      );
      scene.add(ambient);

      const directionalById = new Map<string, THREE.DirectionalLight>();
      let directionalIdsKey = "";
      /** Bumped when studio directionals are recreated so shadow attachments refresh. */
      let directionalShadowGeneration = 0;
      let shadowPipelineKey = "";
      let meshShadowKey = "";

      const disposeAllStudioDirectionals = (): void => {
        for (const [, lit] of directionalById) {
          scene.remove(lit);
          lit.dispose();
        }
        directionalById.clear();
        directionalIdsKey = "";
      };

      const syncStudioDirectionals = (
        list: StudioDirectionalLightV1[],
      ): void => {
        // Id-set only: reordering rows should not dispose/recreate lights (Auto helper still uses config order via `dirs[0]`).
        const key = [...list]
          .map((l) => l.id)
          .sort()
          .join("|");
        if (key !== directionalIdsKey) {
          if (directionalLightHelper != null) {
            scene.remove(directionalLightHelper);
            directionalLightHelper.dispose();
            directionalLightHelper = null;
            dirHelpStateKey = "";
          }
          disposeAllStudioDirectionals();
          directionalIdsKey = key;
          directionalShadowGeneration += 1;
          for (const cfg of list) {
            const dl = new THREE.DirectionalLight(
              parseHexToThreeColor(cfg.colorHex),
              cfg.intensity,
            );
            dl.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
            scene.add(dl);
            directionalById.set(cfg.id, dl);
          }
          return;
        }
        for (const cfg of list) {
          const dl = directionalById.get(cfg.id);
          if (dl == null) {
            continue;
          }
          dl.color.copy(parseHexToThreeColor(cfg.colorHex));
          dl.intensity = cfg.intensity;
          dl.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
        }
      };

      const syncShadowRendering = (
        modelRootAtFrame: THREE.Object3D | null,
      ): void => {
        if (renderer == null) {
          return;
        }
        const s = scene3dRef.current;
        const sh = resolveStudioShadowParams(s);
        const { enabled, mapSize, orthoExtent, bias, normalBias } = sh;
        renderer.shadowMap.enabled = enabled;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const pk = studioShadowPipelineKey({
          enabled,
          mapSize,
          orthoExtent,
          bias,
          normalBias,
          directionalShadowGeneration,
        });
        if (pk !== shadowPipelineKey) {
          shadowPipelineKey = pk;
          for (const dl of directionalById.values()) {
            configureStudioDirectionalShadow(
              dl,
              enabled,
              mapSize,
              orthoExtent,
              bias,
              normalBias,
            );
          }
        }

        const mk = `${enabled}|${modelRootAtFrame?.uuid ?? "none"}`;
        if (mk !== meshShadowKey) {
          meshShadowKey = mk;
          applyStudioShadowMeshes(modelRootAtFrame, enabled);
        }
      };

      let gridHelper: THREE.GridHelper | null = null;
      let gridLayoutKey = "";
      const maybeUpdateGrid = () => {
        const s = scene3dRef.current;
        const g = s.helpers.grid;
        const layoutKey = `${g.size}|${g.divisions}|${g.colorCenterHex}|${g.colorGridHex}`;
        if (!g.enabled) {
          if (gridHelper != null) {
            scene.remove(gridHelper);
            (gridHelper.material as THREE.Material).dispose?.();
            gridHelper.geometry.dispose?.();
            gridHelper = null;
          }
          gridLayoutKey = "";
          return;
        }
        if (gridHelper != null && gridLayoutKey !== layoutKey) {
          scene.remove(gridHelper);
          (gridHelper.material as THREE.Material).dispose?.();
          gridHelper.geometry.dispose?.();
          gridHelper = null;
        }
        if (gridHelper == null) {
          gridHelper = new THREE.GridHelper(
            g.size,
            g.divisions,
            parseHexToThreeColor(g.colorCenterHex),
            parseHexToThreeColor(g.colorGridHex),
          );
          (gridHelper.material as THREE.Material).transparent = true;
          scene.add(gridHelper);
          disableShadowOnObjectSubtree(gridHelper);
          gridLayoutKey = layoutKey;
        }
        (gridHelper.material as THREE.Material).opacity = g.opacity;
        gridHelper.position.y = g.y;
      };

      let axesHelper: THREE.AxesHelper | null = null;
      let axesKey = "";
      const maybeUpdateAxesHelper = () => {
        const s = scene3dRef.current;
        const ax = s.helpers.axes;
        const key = `${ax.length}|${ax.opacity}`;
        if (!ax.enabled) {
          if (axesHelper != null) {
            scene.remove(axesHelper);
            axesHelper.dispose();
            axesHelper = null;
          }
          axesKey = "";
          return;
        }
        if (axesHelper != null && axesKey !== key) {
          scene.remove(axesHelper);
          axesHelper.dispose();
          axesHelper = null;
        }
        if (axesHelper == null) {
          axesHelper = new THREE.AxesHelper(ax.length);
          const mat = axesHelper.material as THREE.LineBasicMaterial;
          mat.transparent = true;
          mat.opacity = ax.opacity;
          mat.depthTest = true;
          scene.add(axesHelper);
          disableShadowOnObjectSubtree(axesHelper);
          axesKey = key;
        } else {
          (axesHelper.material as THREE.LineBasicMaterial).opacity = ax.opacity;
        }
      };

      let cameraHelper: THREE.CameraHelper | null = null;
      const maybeUpdateCameraHelper = () => {
        const s = scene3dRef.current;
        if (!s.helpers.camera.enabled) {
          if (cameraHelper != null) {
            scene.remove(cameraHelper);
            cameraHelper.dispose();
            cameraHelper = null;
          }
          return;
        }
        if (cameraHelper == null) {
          cameraHelper = new THREE.CameraHelper(camera);
          scene.add(cameraHelper);
          disableShadowOnObjectSubtree(cameraHelper);
        }
      };

      let directionalLightHelper: THREE.DirectionalLightHelper | null = null;
      let dirHelpStateKey = "";
      const maybeUpdateDirectionalLightHelper = (): void => {
        const s = scene3dRef.current;
        const h = s.helpers.directionalLight;
        const dirs = s.lights.directionals;
        const resolvedAttach =
          h.attachToDirectionalId != null &&
          h.attachToDirectionalId.trim().length > 0
            ? h.attachToDirectionalId.trim()
            : (dirs[0]?.id ?? "");
        const targetLight =
          (resolvedAttach.length > 0
            ? directionalById.get(resolvedAttach)
            : undefined) ??
          (dirs[0]?.id != null ? directionalById.get(dirs[0].id) : undefined);

        const stateKey = `${h.enabled}|${h.planeSize}|${resolvedAttach}|${targetLight?.uuid ?? "none"}`;

        if (!h.enabled || targetLight == null) {
          if (directionalLightHelper != null) {
            scene.remove(directionalLightHelper);
            directionalLightHelper.dispose();
            directionalLightHelper = null;
          }
          dirHelpStateKey = "";
          return;
        }

        if (directionalLightHelper != null && dirHelpStateKey !== stateKey) {
          scene.remove(directionalLightHelper);
          directionalLightHelper.dispose();
          directionalLightHelper = null;
        }

        if (directionalLightHelper == null) {
          directionalLightHelper = new THREE.DirectionalLightHelper(
            targetLight,
            h.planeSize,
          );
          scene.add(directionalLightHelper);
          disableShadowOnObjectSubtree(directionalLightHelper);
          dirHelpStateKey = stateKey;
        }
      };

      syncStudioDirectionals(scene3dRef.current.lights.directionals);

      maybeUpdateGrid();
      maybeUpdateAxesHelper();
      maybeUpdateCameraHelper();
      maybeUpdateDirectionalLightHelper();

      // Simple “orientation board” proxy. We only need something stable to confirm resizing is correct.
      const root = new THREE.Group();
      scene.add(root);
      root.position.set(
        scene3dRef.current.model.transform.position.x,
        scene3dRef.current.model.transform.position.y,
        scene3dRef.current.model.transform.position.z,
      );
      root.rotation.set(
        degToRad(scene3dRef.current.model.transform.rotationDeg.x),
        degToRad(scene3dRef.current.model.transform.rotationDeg.y),
        degToRad(scene3dRef.current.model.transform.rotationDeg.z),
      );
      root.scale.set(
        scene3dRef.current.model.transform.scale.x,
        scene3dRef.current.model.transform.scale.y,
        scene3dRef.current.model.transform.scale.z,
      );

      let modelRoot: THREE.Object3D | null = null;
      let stageModelsHolder: THREE.Group | null = null;
      let stageMultiRoots: THREE.Object3D[] = [];
      const stageMultiClipsByUuid = new Map<string, THREE.AnimationClip[]>();
      let loadedStageMultiKey = "";
      let inflightStageMultiKey: string | null = null;
      let stageMultiLoadGen = 0;
      let stageAnimHostUuid: string | null = null;
      const physicsRuntime: PreviewPhysicsRuntimeState = createPreviewPhysicsRuntimeState();
      let unbindStagePick: (() => void) | null = null;
      let animationMixer: THREE.AnimationMixer | null = null;
      const clipActions = new Map<string, THREE.AnimationAction>();
      let glbPathIndex: Map<string, THREE.Object3D> | null = null;
      const partVisibilityDriveState: GlbPartVisibilityDriveState = {
        lastKeys: new Set(),
        materialOpacityBaseline: new Map(),
        materialTransparentBaseline: new Map(),
      };
      const materialPbrDriveState: GlbMaterialPbrDriveState = {
        baseline: new Map(),
        lastMaterialNames: new Set(),
      };
      const materialTextureDriveState: GlbMaterialTextureDriveState = {
        baseline: new Map(),
        lastMaterialNames: new Set(),
      };
      const materialVideoDriveState: GlbMaterialVideoDriveState = {
        baseline: new Map(),
        lastMaterialNames: new Set(),
      };
      const materialColorDriveState: GlbMaterialColorDriveState = {
        baseline: new Map(),
        lastMaterialNames: new Set(),
      };

      const animationMixerState = createStudioGlbAnimationMixerState();
      const resetAnimationMixer = (): void => {
        if (animationMixer != null) {
          animationMixer.stopAllAction();
        }
        animationMixer = null;
        clipActions.clear();
        animationMixerState.prevActive.clear();
        animationMixerState.lastDrives = {};
        animationMixerState.lastRestartNonceByClip = {};
        animationMixerState.lastLoopModeByClip = {};
      };
      let loopPlaybackMode: StudioGlbAnimationPlaybackModeV1 = "per-clip";
      let loadedModelKey = "";
      let inflightModelKey: string | null = null;
      /** Unmodified GLB root for fast embedded-rig policy swaps (same URL, no re-fetch). */
      let gltfPristineTemplate: THREE.Object3D | null = null;
      let gltfPristineTemplateUrl = "";
      let gltfPristineAnimations: THREE.AnimationClip[] = [];

      const clearGltfPristineTemplate = (): void => {
        if (gltfPristineTemplate != null) {
          disposeObject3D(gltfPristineTemplate);
          gltfPristineTemplate = null;
        }
        gltfPristineTemplateUrl = "";
        gltfPristineAnimations = [];
      };

      const resetModelPreviewMixerState = (): void => {
        setHasGlbAnimations(false);
        setUserTransport("stopped");
        userPreviewTransportRef.current = "stopped";
        resetAnimationMixer();
        resetGlbPartVisibilityDriveState(partVisibilityDriveState);
        resetGlbMaterialPbrDriveState(materialPbrDriveState);
        resetGlbMaterialTextureDriveState(materialTextureDriveState);
        resetGlbMaterialVideoDriveState(materialVideoDriveState);
        resetGlbMaterialColorDriveState(materialColorDriveState);
        resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
        glbPathIndex = null;
        embeddedCameraNames = [];
      };

      const mountSingleModelRoot = (
        nextRoot: THREE.Object3D,
        reasonKey: string,
        clips: THREE.AnimationClip[],
      ): void => {
        const previousRoot = modelRoot;
        modelRoot = nextRoot;
        applyStageInstanceTransform(modelRoot, 0);
        root.add(modelRoot);
        if (previousRoot != null) {
          root.remove(previousRoot);
          const rootToDispose = previousRoot;
          requestAnimationFrame(() => {
            disposeObject3D(rootToDispose);
          });
        }
        embeddedCameraNames = collectEmbeddedGlbCameraNames(modelRoot);
        loadedModelKey = reasonKey;
        loadedStageMultiKey = "";
        attachAnimationMixerToRoot(modelRoot, clips);
        updateStageViewportApi([modelRoot]);
      };

      const attachAnimationMixerToRoot = (host: THREE.Object3D, clips: THREE.AnimationClip[]) => {
        resetAnimationMixer();
        glbPathIndex = buildStudioGlbPathIndex(host);
        if (clips.length > 0) {
          animationMixer = new THREE.AnimationMixer(host);
          for (const clip of clips) {
            const nm = typeof clip.name === "string" ? clip.name.trim() : "";
            if (nm.length === 0) {
              continue;
            }
            const ac = animationMixer.clipAction(clip);
            ac.clampWhenFinished = true;
            ac.setLoop(THREE.LoopRepeat, Infinity);
            ac.play();
            ac.paused = true;
            clipActions.set(nm, ac);
          }
        }
        setHasGlbAnimations(clipActions.size > 0);
        setUserTransport("stopped");
        userPreviewTransportRef.current = "stopped";
        stageAnimHostUuid = host.uuid;
      };

      const clearStageMulti = (): void => {
        inflightStageMultiKey = null;
        loadedStageMultiKey = "";
        for (const r of stageMultiRoots) {
          stageModelsHolder?.remove(r);
          disposeObject3D(r);
        }
        stageMultiRoots = [];
        stageMultiClipsByUuid.clear();
        if (stageModelsHolder != null) {
          root.remove(stageModelsHolder);
          stageModelsHolder = null;
        }
      };

      const applyStageInstanceTransform = (root: THREE.Object3D, modelIndex: number): void => {
        const instances = stageModelsRef.current;
        const wire = instances?.[modelIndex]?.transformWire ?? null;
        applyFlowWireTransformToObject3D(root, wire);
      };

      const getStagePickTargets = () => {
        const instances = stageModelsRef.current ?? [];
        if (stageMultiRoots.length > 0) {
          return stageMultiRoots.map((root, i) => ({
            root,
            modelIndex: i,
            sourceNodeId: instances[i]?.sourceNodeId ?? "",
          }));
        }
        if (modelRoot != null) {
          return [
            {
              root: modelRoot,
              modelIndex: 0,
              sourceNodeId: instances[0]?.sourceNodeId ?? "",
            },
          ];
        }
        return [];
      };

      const getStageDriveRoot = (): THREE.Object3D | null => {
        if (stageMultiRoots.length === 0) {
          return null;
        }
        const idx = Math.max(
          0,
          Math.min(stagePrimaryIndexRef.current, stageMultiRoots.length - 1),
        );
        return stageMultiRoots[idx] ?? stageMultiRoots[0] ?? null;
      };

      const updateStageViewportApi = (frameRoots: readonly THREE.Object3D[]) => {
        viewportApiRef.current = {
          framePrimaryModel: () => {
            const instances = stageModelsRef.current;
            const multi =
              stageFullBleed &&
              instances != null &&
              instances.length > 1 &&
              stageMultiRoots.length > 0;
            if (multi) {
              const idx = Math.max(
                0,
                Math.min(stagePrimaryIndexRef.current, stageMultiRoots.length - 1),
              );
              const one = stageMultiRoots[idx];
              if (one != null) {
                frameStudioViewportCamera({
                  camera,
                  controls,
                  object: one,
                  margin: scene3dRef.current.camera.frameMargin,
                });
              }
              return;
            }
            if (modelRoot == null) {
              return;
            }
            frameStudioViewportCamera({
              camera,
              controls,
              object: modelRoot,
              margin: scene3dRef.current.camera.frameMargin,
            });
          },
          resetCameraToScene3d: () => {
            lastCameraDriveKey = resetStudioViewportCameraToScene3d({
              camera,
              controls,
              scene3d: scene3dRef.current,
            });
            prevGlbCamActive = false;
          },
        };
        if (frameRoots.length > 0) {
          frameStudioViewportOnModelRoots({
            camera,
            controls,
            roots: frameRoots,
            margin: scene3dRef.current.camera.frameMargin,
          });
        }
      };

      const beginStageMultiLoad = (reasonKey: string): void => {
        if (inflightStageMultiKey === reasonKey) {
          return;
        }
        const instances = stageModelsRef.current;
        if (instances == null || instances.length <= 1) {
          return;
        }
        const myGen = ++stageMultiLoadGen;
        setInitError(null);
        inflightStageMultiKey = reasonKey;
        setHasGlbAnimations(false);
        setUserTransport("stopped");
        userPreviewTransportRef.current = "stopped";
        resetAnimationMixer();
        stageAnimHostUuid = null;
        resetGlbPartVisibilityDriveState(partVisibilityDriveState);
        resetGlbMaterialPbrDriveState(materialPbrDriveState);
        resetGlbMaterialTextureDriveState(materialTextureDriveState);
        resetGlbMaterialVideoDriveState(materialVideoDriveState);
        resetGlbMaterialColorDriveState(materialColorDriveState);
        resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
        glbPathIndex = null;
        embeddedCameraNames = [];
        if (modelRoot != null) {
          root.remove(modelRoot);
          disposeObject3D(modelRoot);
          modelRoot = null;
        }
        clearStageMulti();
        stageModelsHolder = new THREE.Group();
        stageModelsHolder.name = "StageModels";
        root.add(stageModelsHolder);

        void (async () => {
          const policy = scene3dRef.current.model.embeddedRigPolicy;
          const loadedRoots: THREE.Object3D[] = [];

          for (const inst of instances) {
            if (disposed || myGen !== stageMultiLoadGen) {
              return;
            }
            const logicalUrl = inst.modelUrl.trim();
            const partialModel = {
              ...scene3dRef.current.model,
              url: logicalUrl,
              studioAssetId: inst.studioAssetId ?? scene3dRef.current.model.studioAssetId,
            };
            const fallbackModelUrl =
              logicalUrl.length > 0 ? resolveDefaultPreviewMeshGlbUrl() : "";
            const urlAtStart = resolveStudioModelGltfFetchUrl(
              partialModel,
              descriptorsRef.current,
              fallbackModelUrl,
            );
            if (urlAtStart.trim().length === 0) {
              continue;
            }
            const packRel = resolveStudioModelPackRelativePath(
              partialModel,
              descriptorsRef.current,
            );
            const inferred = resolveStudioModelDescriptorForPersistedModel(
              logicalUrl,
              partialModel.studioAssetId,
              descriptorsRef.current,
            );
            const pf = await preflightModelPreviewUrlWithGlobalDirectoryFallback(
              urlAtStart,
              buildGlobalDirectoryFallbackOptions(urlAtStart, {
                packRelativePath: packRel ?? undefined,
                explicitOnlineUrl: inferred?.onlineFallbackUrl,
              }),
              new AbortController().signal,
            );
            if (disposed || myGen !== stageMultiLoadGen) {
              return;
            }
            const wantKey = stageMultiModelsLoadKey(
              stageModelsRef.current ?? [],
              policy,
            );
            if (wantKey !== reasonKey) {
              inflightStageMultiKey = null;
              if (wantKey !== loadedStageMultiKey) {
                beginStageMultiLoad(wantKey);
              }
              return;
            }
            const loadUrl = pf.ok ? pf.url : urlAtStart;
            if (!pf.ok) {
              setInitError(pf.message);
              continue;
            }
            try {
              const gltf = await fetchAndParseGltfFromUrl(loadUrl);
              if (disposed || myGen !== stageMultiLoadGen) {
                disposeSupersededGltfScene(gltf.scene);
                return;
              }
              applyEmbeddedRigPolicy(gltf.scene, policy);
              stageMultiClipsByUuid.set(gltf.scene.uuid, gltf.animations ?? []);
              loadedRoots.push(gltf.scene);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "unknown error";
              setInitError(`Failed to load model: ${msg}`);
            }
          }

          inflightStageMultiKey = null;
          if (disposed || myGen !== stageMultiLoadGen) {
            for (const r of loadedRoots) {
              disposeObject3D(r);
            }
            return;
          }
          if (loadedRoots.length === 0) {
            setInitError(
              emptyHintRef.current ??
                "No model URL — wire Model Source nodes into Scene Output.",
            );
            return;
          }

          stageMultiRoots = loadedRoots;
          layoutStageModelRootsAlongX(loadedRoots);
          loadedRoots.forEach((r, i) => {
            applyStageInstanceTransform(r, i);
            stageModelsHolder?.add(r);
          });
          loadedStageMultiKey = reasonKey;
          loadedModelKey = "";

          const driveRoot = getStageDriveRoot();
          if (driveRoot != null) {
            attachAnimationMixerToRoot(
              driveRoot,
              stageMultiClipsByUuid.get(driveRoot.uuid) ?? [],
            );
            embeddedCameraNames = collectEmbeddedGlbCameraNames(driveRoot);
          }
          updateStageViewportApi(loadedRoots);
        })();
      };

      const beginModelLoadFromTemplate = (reasonKey: string): void => {
        if (inflightModelKey === reasonKey) {
          return;
        }
        if (gltfPristineTemplate == null) {
          beginModelLoad(reasonKey);
          return;
        }
        ++modelLoadGen;
        setInitError(null);
        inflightModelKey = reasonKey;
        resetModelPreviewMixerState();
        clearStageMulti();
        const policy = scene3dRef.current.model.embeddedRigPolicy;
        const nextRoot = gltfPristineTemplate.clone(true);
        applyEmbeddedRigPolicy(nextRoot, policy);
        inflightModelKey = null;
        mountSingleModelRoot(nextRoot, reasonKey, gltfPristineAnimations);
      };

      const beginModelLoad = (reasonKey: string): void => {
        if (inflightModelKey === reasonKey) {
          return;
        }
        const myGen = ++modelLoadGen;
        setInitError(null);
        inflightModelKey = reasonKey;
        resetModelPreviewMixerState();
        clearStageMulti();
        const logicalUrl = scene3dRef.current.model.url.trim();
        const fallbackModelUrl =
          logicalUrl.length > 0 ? resolveDefaultPreviewMeshGlbUrl() : "";
        const urlAtStart = resolveStudioModelGltfFetchUrl(
          scene3dRef.current.model,
          descriptorsRef.current,
          fallbackModelUrl,
        );

        if (urlAtStart.trim().length === 0) {
          inflightModelKey = null;
          loadedModelKey = reasonKey;
          setInitError(
            emptyHintRef.current ??
              "No model URL — wire a Model Source node or pick a model in the inspector.",
          );
          return;
        }

        void (async () => {
          const packRel = resolveStudioModelPackRelativePath(
            scene3dRef.current.model,
            descriptorsRef.current,
          );
          const inferred = resolveStudioModelDescriptorForPersistedModel(
            scene3dRef.current.model.url,
            scene3dRef.current.model.studioAssetId,
            descriptorsRef.current,
          );
          const pf = await preflightModelPreviewUrlWithGlobalDirectoryFallback(
            urlAtStart,
            buildGlobalDirectoryFallbackOptions(urlAtStart, {
              packRelativePath: packRel ?? undefined,
              explicitOnlineUrl: inferred?.onlineFallbackUrl,
            }),
            new AbortController().signal,
          );
          if (disposed || myGen !== modelLoadGen) {
            return;
          }
          const wantKeyEarly = modelLoadKey(scene3dRef.current);
          if (wantKeyEarly !== reasonKey) {
            inflightModelKey = null;
            if (wantKeyEarly !== loadedModelKey) {
              beginModelLoad(wantKeyEarly);
            }
            return;
          }
          const loadUrl = pf.ok ? pf.url : urlAtStart;
          if (!pf.ok) {
            inflightModelKey = null;
            loadedModelKey = reasonKey;
            setInitError(pf.message);
            notifyMissingAssetForPreviewScope(previewScopeKeyRef.current, {
              dedupeKey: `studio-rotation-model:${previewScopeKeyRef.current}:${urlAtStart}`,
              title: "Model file not available",
              summary: pf.message,
              detail: `URL:\n${urlAtStart}`,
              bullets: missingLocalMirrorDialogBullets,
            });
            return;
          }

          try {
            const gltf = await fetchAndParseGltfFromUrl(loadUrl);
            inflightModelKey = null;
            if (disposed) {
              disposeObject3D(gltf.scene);
              return;
            }
            const wantKey = modelLoadKey(scene3dRef.current);
            if (wantKey !== reasonKey) {
              disposeSupersededGltfScene(gltf.scene);
              if (wantKey !== loadedModelKey) {
                beginModelLoad(wantKey);
              }
              return;
            }
            if (gltfPristineTemplateUrl !== loadUrl) {
              clearGltfPristineTemplate();
              gltfPristineTemplate = gltf.scene.clone(true);
              gltfPristineTemplateUrl = loadUrl;
              gltfPristineAnimations = gltf.animations ?? [];
            }
            applyEmbeddedRigPolicy(
              gltf.scene,
              scene3dRef.current.model.embeddedRigPolicy,
            );
            mountSingleModelRoot(gltf.scene, reasonKey, gltf.animations ?? []);
          } catch (err) {
            inflightModelKey = null;
            loadedModelKey = reasonKey;
            if (!disposed) {
              const raw =
                err instanceof Error ? err.message : "unknown error";
              const summary = friendlyGlbLoadErrorMessage(raw);
              setInitError(`Failed to load model: ${summary}`);
              notifyMissingAssetForPreviewScope(previewScopeKeyRef.current, {
                dedupeKey: `studio-rotation-model-err:${previewScopeKeyRef.current}:${urlAtStart}`,
                title: "Failed to load 3D model",
                summary,
                detail: `Technical:\n${raw}\n\nURL:\n${loadUrl}`,
                bullets: missingLocalMirrorDialogBullets,
              });
            }
          }
        })();
      };

      beginModelLoad(modelLoadKey(scene3dRef.current));

      // Fire and forget; safe-guarded by `disposed`.
      void loadEnvironment();

      let lastResizeW = 0;
      let lastResizeH = 0;
      let resizeRaf: number | null = null;

      const resize = () => {
        const w = Math.max(1, Math.round(host.clientWidth));
        const h = Math.max(1, Math.round(host.clientHeight));
        if (w === lastResizeW && h === lastResizeH) {
          return;
        }
        lastResizeW = w;
        lastResizeH = h;
        if (renderer != null) {
          applyPreviewPixelRatio(
            renderer,
            scene3dRef.current.renderer,
            displayScaleRef.current,
          );
          renderer.setSize(w, h, false);
        }
        css3dWorldRuntime.resize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const scheduleResize = () => {
        if (resizeRaf != null) {
          cancelAnimationFrame(resizeRaf);
        }
        // Double rAF: flex layout after RF node edge drag may settle one frame late.
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = requestAnimationFrame(() => {
            resizeRaf = null;
            resize();
          });
        });
      };

      resizeRendererRef.current = resize;
      resize();
      const ro = new ResizeObserver(() => scheduleResize());
      ro.observe(host);

      if (stageFullBleed) {
        unbindStagePick = bindStageViewportPickHandler({
          canvas,
          camera,
          getPickTargets: getStagePickTargets,
          onPick: (detail) => {
            onStagePickRef.current?.(detail);
          },
        });
      }

      let raf = 0;
      let lastCameraDriveKey = cameraDriveKeyFromScene3d(scene3dRef.current);
      /** Previous frame's GLB camera drive winner; used to detect handoff back to `scene3d` rig. */
      let prevGlbCamActive = false;
      let lastPerfMs = performance.now();
      const loop = () => {
        const nowMs = performance.now();
        const deltaSec = Math.min(
          0.05,
          Math.max(0, (nowMs - lastPerfMs) / 1000),
        );
        lastPerfMs = nowMs;

        const s = scene3dRef.current;

        // Apply live renderer + light knobs without re-init.
        if (renderer == null) {
          raf = requestAnimationFrame(loop);
          return;
        }
        renderer.toneMappingExposure =
          s.renderer.toneMappingExposure ??
          ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
        renderer.setClearColor(
          parseHexToThreeColor(s.renderer.clearColorHex),
          1,
        );

        ambient.color.copy(parseHexToThreeColor(s.lights.ambient.colorHex));
        ambient.intensity = s.lights.ambient.intensity;
        syncStudioDirectionals(s.lights.directionals);
        syncPreviewSceneFog(scene, fogRuntime, s.fog);
        const stageInstances = stageModelsRef.current;
        const useStageMulti =
          stageFullBleed &&
          stageInstances != null &&
          stageInstances.length > 1;
        const physWire =
          stagePhysicsRef.current.enabled && stageFullBleed
            ? stagePhysicsRef.current
            : null;
        syncPreviewPhysicsRuntime({
          scene,
          state: physicsRuntime,
          wire: physWire,
          colliders: Array.isArray(stagePhysicsCollidersRef.current)
            ? stagePhysicsCollidersRef.current
            : [],
        });
        stepPreviewPhysicsRuntime(physicsRuntime, deltaSec);
        if (useStageMulti) {
          stageMultiRoots.forEach((r, i) => applyStageInstanceTransform(r, i));
        } else if (modelRoot != null) {
          applyStageInstanceTransform(modelRoot, 0);
        }
        const driveRoot = useStageMulti ? getStageDriveRoot() : modelRoot;

        if (useStageMulti) {
          const mk = stageMultiModelsLoadKey(
            stageInstances,
            s.model.embeddedRigPolicy,
          );
          if (mk !== loadedStageMultiKey && inflightStageMultiKey == null) {
            beginStageMultiLoad(mk);
          }
        } else if (loadedStageMultiKey.length > 0) {
          clearStageMulti();
        }

        if (
          useStageMulti &&
          driveRoot != null &&
          driveRoot.uuid !== stageAnimHostUuid
        ) {
          const clips = stageMultiClipsByUuid.get(driveRoot.uuid) ?? [];
          attachAnimationMixerToRoot(driveRoot, clips);
          embeddedCameraNames = collectEmbeddedGlbCameraNames(driveRoot);
        }

        syncPreviewContactShadows(
          scene,
          contactShadowRuntime,
          s.contactShadows,
          resolvePreviewContactShadowGroundY(s, driveRoot, root),
        );
        tickPreviewParticleEmitter(
          scene,
          particleRuntime,
          s.particleEmitter,
          driveRoot,
          deltaSec,
          particleOriginScratch,
        );
        if (driveRoot != null) {
          syncShadowRendering(driveRoot);
        }

        applyGlbPartVisibilityByPathMap(
          glbPathIndex,
          glbPartsRef.current,
          partVisibilityDriveState,
        );
        applyGlbMorphWeightsToModelRoot(driveRoot, glbMorphRef.current);
        applyGlbMaterialPbrByName(
          driveRoot,
          glbMaterialPbrRef.current,
          materialPbrDriveState,
        );
        applyGlbMaterialTexturesByName(
          driveRoot,
          glbMaterialTexturesRef.current,
          materialTextureDriveState,
        );
        applyGlbMaterialVideoTexturesByName(
          driveRoot,
          glbMaterialVideosRef.current,
          materialVideoDriveState,
        );
        applyGlbMaterialColorByName(
          driveRoot,
          glbMaterialColorsRef.current,
          materialColorDriveState,
        );
        applyGlbLightIntensityOverrides(driveRoot, glbLightsRef.current);
        if (animationMixer != null && clipActions.size > 0) {
          const structuredDrives = glbAnimDrivesRef.current;
          const driveKeys = Object.keys(structuredDrives);
          if (driveKeys.length > 0) {
            const playbackMode = glbAnimPlaybackModeRef.current;
            if (playbackMode !== loopPlaybackMode) {
              animationMixerState.prevActive.clear();
              animationMixerState.lastLoopModeByClip = {};
              loopPlaybackMode = playbackMode;
            }
            const clipOrder = glbAnimClipOrderRef.current;
            const drivesForMixer = filterGlbAnimationDrivesForPreview({
              drives: structuredDrives,
              playbackMode,
              clipOrder,
              sequenceState: glbAnimSequenceStateRef.current,
              inspectorTransportActive:
                glbAnimInspectorTransportActiveRef.current,
            });
            applyStudioGlbAnimationMixerDrives({
              clipActions,
              drives: drivesForMixer,
              state: animationMixerState,
            });
            if (
              playbackMode === "sequence" &&
              glbAnimInspectorTransportActiveRef.current
            ) {
              animationMixer.update(deltaSec);
              advanceGlbAnimationSequenceAfterMixerTick({
                clipActions,
                drives: structuredDrives,
                clipOrder,
                sequenceState: glbAnimSequenceStateRef.current,
              });
            }
          } else {
            const drives = glbAnimsRef.current;
            const scales = glbAnimScalesRef.current;
            const loops = glbAnimLoopsRef.current;
            const weights = glbAnimWeightsRef.current;
            const hasLegacyDrive = Object.values(drives).some(
              (t) => typeof t === "number" && Number.isFinite(t),
            );
            if (hasLegacyDrive) {
              for (const [nm, ac] of clipActions) {
                const t = drives[nm];
                if (typeof t === "number" && Number.isFinite(t)) {
                  ac.enabled = true;
                  ac.paused = false;
                  ac.time = Math.max(0, t);
                  const ts = scales[nm];
                  ac.timeScale =
                    typeof ts === "number" &&
                    Number.isFinite(ts) &&
                    Math.abs(ts) < 1e6
                      ? ts
                      : 1;
                  const mode = loops[nm] ?? "loop";
                  const threeLoop =
                    mode === "once"
                      ? THREE.LoopOnce
                      : mode === "pingpong"
                        ? THREE.LoopPingPong
                        : THREE.LoopRepeat;
                  const reps = mode === "once" ? 1 : Infinity;
                  ac.setLoop(threeLoop, reps);
                  ac.clampWhenFinished = mode === "once";
                  const w = weights[nm];
                  ac.weight =
                    typeof w === "number" && Number.isFinite(w)
                      ? Math.min(1, Math.max(0, w))
                      : 1;
                } else {
                  ac.paused = true;
                  ac.time = 0;
                  ac.timeScale = 1;
                  ac.weight = 1;
                }
              }
            } else {
              applyUserPreviewTransportToClipActions({
                clipActions,
                transport: userPreviewTransportRef.current,
              });
            }
          }
          animationMixer.update(deltaSec);
        }

        applyOrbitControlsFromScene3d(controls, s.controls);

        root.position.set(
          s.model.transform.position.x,
          s.model.transform.position.y,
          s.model.transform.position.z,
        );
        root.scale.set(
          s.model.transform.scale.x,
          s.model.transform.scale.y,
          s.model.transform.scale.z,
        );
        const orientationQ = quatRef.current;
        if (isPlaceholderOrientationQuaternion(orientationQ)) {
          root.rotation.set(
            degToRad(s.model.transform.rotationDeg.x),
            degToRad(s.model.transform.rotationDeg.y),
            degToRad(s.model.transform.rotationDeg.z),
          );
        } else {
          root.quaternion.copy(orientationQ);
        }

        camera.fov = s.camera.fovDeg;
        const effectiveGlbCameras = resolveGlbCameraDrivesWithSwitch(
          glbCamerasRef.current,
          glbCameraSwitchIndexRef.current,
          glbCameraSwitchRigRef.current,
          embeddedCameraNames,
        );
        const glbCamBlend = resolveGlbCameraBlendWeights(effectiveGlbCameras);
        const glbCamActive = glbCamBlend.length > 0;
        const glbCamHandoffToScene = prevGlbCamActive && !glbCamActive;
        if (!glbCamActive) {
          const camDriveKey = cameraDriveKeyFromScene3d(s);
          if (glbCamHandoffToScene || camDriveKey !== lastCameraDriveKey) {
            lastCameraDriveKey = camDriveKey;
            camera.position.set(
              s.camera.transform.position.x,
              s.camera.transform.position.y,
              s.camera.transform.position.z,
            );
            controls.target.set(
              s.camera.transform.target.x,
              s.camera.transform.target.y,
              s.camera.transform.target.z,
            );
          }
        }
        prevGlbCamActive = glbCamActive;
        camera.updateProjectionMatrix();
        if (glbCamActive && driveRoot != null) {
          applyStudioCameraFromBlendedGlbCameras(
            driveRoot,
            glbCamBlend,
            camera,
            controls,
          );
        }

        if (!useStageMulti) {
          const mk = modelLoadKey(s);
          if (mk !== loadedModelKey && inflightModelKey == null) {
            const nextUrl = s.model.url.trim();
            const loadedUrl = modelUrlForPolicyOnlyCompare(loadedModelKey, s.model);
            const policyOnlyChange =
              nextUrl.length > 0 &&
              nextUrl === loadedUrl &&
              stableModelLoadKey(s.model) === loadedModelKey &&
              gltfPristineTemplate != null;
            if (policyOnlyChange) {
              beginModelLoadFromTemplate(mk);
            } else {
              beginModelLoad(mk);
            }
          }
        }

        // Reload env/model when key parameters change.
        void loadEnvironment();
        if (cubeTexture != null) {
          const baseIbl2 = s.environment.iblStrength ?? 1;
          scene.environmentIntensity =
            s.environment.useCubemapIbl && useCubemapIbl
              ? baseIbl2
              : baseIbl2 *
                (s.environment.iblOffStrengthFrac ??
                  ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC);
          setSceneEnvRotationY(scene, s.environment.yawDeg ?? 0);
          scene.background =
            s.environment.showBackgroundTexture && showBackgroundTexture
              ? cubeTexture
              : parseHexToThreeColor(s.environment.backgroundColorHex);
        }
        // Intentionally do not scale the model after load.

        maybeUpdateGrid();
        maybeUpdateAxesHelper();
        maybeUpdateCameraHelper();
        maybeUpdateDirectionalLightHelper();
        directionalLightHelper?.update();
        cameraHelper?.update();

        controls.update(deltaSec);

        const hostW = Math.max(1, Math.round(host.clientWidth));
        const hostH = Math.max(1, Math.round(host.clientHeight));
        if (hostW !== lastResizeW || hostH !== lastResizeH) {
          resize();
        }

        const hudNodes = visionHudNodesRef.current;
        if (hudNodes != null && hudNodes.length > 0) {
          studioVisionLandmarks3dOverlay.sync(
            camera,
            collectVisionLandmarks3dSpecs(hudNodes, visionHudEdgesRef.current),
          );
        } else {
          studioVisionLandmarks3dOverlay.sync(camera, []);
        }

        renderer?.render(scene, camera);
        css3dWorldRuntime.syncFeeds(cameraCss3dFeedsRef.current);
        css3dWorldRuntime.render();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onContextLost = (event: Event) => {
        event.preventDefault();
        setInitError("WebGL context lost.");
      };
      const onContextRestored = () => {
        setInitError(null);
      };
      renderer.domElement.addEventListener(
        "webglcontextlost",
        onContextLost,
        false,
      );
      renderer.domElement.addEventListener(
        "webglcontextrestored",
        onContextRestored,
        false,
      );

      return () => {
        resizeRendererRef.current = null;
        if (resizeRaf != null) {
          cancelAnimationFrame(resizeRaf);
          resizeRaf = null;
        }
        unbindStagePick?.();
        unbindStagePick = null;
        cancelAnimationFrame(raf);
        ro.disconnect();
        studioVisionLandmarks3dOverlay.dispose(camera);
        css3dWorldRuntime.dispose();
        controls.dispose();
        disposePreviewPhysicsRuntime(scene, physicsRuntime);
        resetAnimationMixer();
        resetGlbPartVisibilityDriveState(partVisibilityDriveState);
        resetGlbMaterialPbrDriveState(materialPbrDriveState);
        resetGlbMaterialTextureDriveState(materialTextureDriveState);
        resetGlbMaterialVideoDriveState(materialVideoDriveState);
        resetGlbMaterialColorDriveState(materialColorDriveState);
        resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
        glbPathIndex = null;
        clearStageMulti();
        if (modelRoot != null) {
          root.remove(modelRoot);
          disposeObject3D(modelRoot);
          modelRoot = null;
          embeddedCameraNames = [];
        }
        clearGltfPristineTemplate();
        if (gridHelper != null) {
          scene.remove(gridHelper);
          (gridHelper.material as THREE.Material).dispose?.();
          gridHelper.geometry.dispose?.();
          gridHelper = null;
        }
        if (axesHelper != null) {
          scene.remove(axesHelper);
          axesHelper.dispose();
          axesHelper = null;
        }
        if (cameraHelper != null) {
          scene.remove(cameraHelper);
          cameraHelper.dispose();
          cameraHelper = null;
        }
        if (directionalLightHelper != null) {
          scene.remove(directionalLightHelper);
          directionalLightHelper.dispose();
          directionalLightHelper = null;
        }
        disposeAllStudioDirectionals();
        disposePreviewCompositorRuntime(
          scene,
          contactShadowRuntime,
          bloomRuntime,
        );
        disposePreviewParticleRuntime(particleRuntime, scene);
        scene.remove(ambient);
        ambient.dispose();
        if (cubeTexture != null) {
          cubeTexture.dispose();
          cubeTexture = null;
        }
        renderer?.domElement.removeEventListener(
          "webglcontextlost",
          onContextLost,
        );
        renderer?.domElement.removeEventListener(
          "webglcontextrestored",
          onContextRestored,
        );
        renderer?.dispose();
        // In Vite dev / Fast Refresh the same <canvas> DOM node is reused. forceContextLoss()
        // intentionally destroys the GL context; many browsers then refuse a new context on that
        // canvas until a full reload → "WebGL context unavailable (renderer init failed)."
        if (!import.meta.env.DEV) {
          try {
            renderer?.forceContextLoss();
          } catch {
            // ignore
          }
        }
      };
    };

    let cleanup: (() => void) | null = null;
    const retryUntilMs = 1800;
    const startTs = performance.now();

    const tickInit = () => {
      if (disposed || cleanup != null) {
        return;
      }
      cleanup = init();
      if (cleanup != null) {
        return;
      }
      const w = Math.round(host.clientWidth);
      const h = Math.round(host.clientHeight);
      const hasSize = w > 1 && h > 1;
      if (performance.now() - startTs > retryUntilMs) {
        setInitError(
          hasSize
            ? "WebGL context unavailable (renderer init failed)."
            : "Waiting for layout…",
        );
        return;
      }
      initRaf = requestAnimationFrame(tickInit);
    };

    tickInit();

    // If layout becomes available later (or contexts are freed), retry again on resize.
    const roInit = new ResizeObserver(() => {
      if (disposed || cleanup != null) {
        return;
      }
      // Clear errors while we retry.
      setInitError(null);
      if (initRaf == null) {
        initRaf = requestAnimationFrame(tickInit);
      }
    });
    roInit.observe(host);

    return () => {
      disposed = true;
      viewportApiRef.current = null;
      if (initRaf != null) {
        cancelAnimationFrame(initRaf);
        initRaf = null;
      }
      roInit.disconnect();
      cleanup?.();
    };
  }, []);

  const viewportShell = (
    <div
      ref={viewportRef}
      className={
        stageFullBleed
          ? "relative h-full min-h-0 w-full overflow-hidden bg-black cursor-default"
          : "nodrag nopan nowheel relative h-full w-full overflow-hidden rounded border border-zinc-700/70 bg-black/50 cursor-default"
      }
      style={{ touchAction: "none" }}
      aria-label={stageFullBleed ? props.title : undefined}
      // Bubble phase: let the canvas receive the event first; then stop React Flow pane zoom/pan from stealing.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {initError != null ? (
        <div
          className={`absolute inset-0 flex items-center justify-center p-3 text-center text-[11px] leading-snug ${
            emptyHintRef.current != null && initError === emptyHintRef.current
              ? "text-zinc-400"
              : "text-rose-200/90"
          }`}
        >
          {initError}
        </div>
      ) : null}
      {hasGlbAnimations && initError == null ? (
        <div className="absolute bottom-2 left-2 z-10">
          <GlbPreviewPlaybackControls
            transport={userTransport}
            flowOwnsPlayback={flowOwnsPlayback}
            onPlay={onPreviewPlay}
            onPause={onPreviewPause}
            onStop={onPreviewStop}
          />
        </div>
      ) : null}
      <StudioCameraCss3dFeedsOverlay
        feeds={scenePropsGlb.cameraCss3dFeeds}
        sketchFlowNodes={props.visionHudNodes}
        sketchFlowEdges={props.visionHudEdges}
      />
      {props.visionHudNodes != null && props.visionHudNodes.length > 0 ? (
        <StudioVisionDetectionsHud nodes={props.visionHudNodes} />
      ) : null}
      {props.visionHudNodes != null && graphHasVisionPoseSketch(props.visionHudNodes) ? (
        <StudioVisionPoseSketchOverlay nodes={props.visionHudNodes} edges={props.visionHudEdges} />
      ) : null}
      <Suspense fallback={null}>
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
      </Suspense>
    </div>
  );

  if (stageFullBleed) {
    return <div className="absolute inset-0 min-h-0 w-full">{viewportShell}</div>;
  }

  return (
    <ReadingPanel className="relative mt-0 flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden space-y-1">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <ReadingLabel className="block">{props.title}</ReadingLabel>
      </div>
      <div className="min-h-0 h-full w-full flex-1 basis-0">{viewportShell}</div>
    </ReadingPanel>
  );
});
