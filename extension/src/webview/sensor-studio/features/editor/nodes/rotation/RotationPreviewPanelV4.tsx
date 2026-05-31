import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import type { RotationPreviewSceneProps } from "../../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import { resolveDefaultPreviewMeshGlbUrl } from "../../../../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.js";
import { resolveStudioAsset } from "../../../asset-browser/resolveStudioAsset";
import { getStudioEnvironmentDescriptorById } from "../../../asset-browser/studio-environment-scene-bindings";
import {
  resolveStudioModelDescriptorForPersistedModel,
  resolveStudioModelGltfFetchUrl,
  resolveStudioModelPackRelativePath,
} from "../../../asset-browser/studio-model-scene-bindings";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import { buildCubeMapFaceUrls } from "../../../../../model-catalog/model-preview-utils";
import {
  ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC,
  ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE,
} from "../../../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";
import { usePreviewMeshMissingUiStore } from "../../../../../bitstream-app/state/previewMeshMissingUi.store.js";
import {
  buildGlobalDirectoryFallbackOptions,
  resolveGlobalDirectoryFetchFallbackUrl,
} from "../../../../../asset-resolution/global-directory-online-fallback";
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from "../../../../../model-loader/ui/preflightModelPreviewUrl.js";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  parseHexToThreeColor,
  type EmbeddedRigPolicy,
  type Scene3DConfigV1,
  type StudioDirectionalLightV1,
} from "./scene3d-config";
import type { GlbMaterialPbrDriveRow } from "../../gltf/studio-glb-material-param";
import type { GlbMaterialTextureDriveRow } from "../../gltf/studio-glb-material-texture";
import {
  applyGlbLightIntensityOverrides,
  applyGlbMaterialPbrByName,
  applyGlbMaterialTexturesByName,
  applyGlbMorphWeightsToModelRoot,
  applyGlbPartVisibilityByPathMap,
  applyStudioCameraFromBlendedGlbCameras,
  buildStudioGlbPathIndex,
  resetGlbMaterialPbrDriveState,
  resetGlbMaterialTextureDriveState,
  resetGlbPartVisibilityDriveState,
  resolveGlbCameraBlendWeights,
  type GlbMaterialPbrDriveState,
  type GlbMaterialTextureDriveState,
  type GlbPartVisibilityDriveState,
} from "../../gltf/studio-glb-preview-runtime";
import {
  applyStudioGlbAnimationMixerDrives,
  createStudioGlbAnimationMixerState,
  type GlbAnimationClipPreviewDrive,
} from "../../gltf/studio-glb-animation-preview-mixer";
import {
  advanceGlbAnimationSequenceAfterMixerTick,
  filterGlbAnimationDrivesForPreview,
  resetGlbAnimationSequencePlaybackState,
  type GlbAnimationSequencePlaybackState,
  type StudioGlbAnimationPlaybackModeV1,
} from "../../gltf/studio-glb-animation-playback-mode";
import {
  applyStudioShadowMeshes,
  configureStudioDirectionalShadow,
  disableShadowOnObjectSubtree,
  resolveStudioShadowParams,
  studioShadowPipelineKey,
} from "./rotation-preview-shadow-runtime";
import { applyFirmwareOrientationMapping } from "../../../../../bitstream-app/components/3d-rotation/shared/firmwareOrientationMapping.js";
import { fusionWireEulerHundredthsToThreeEulerRadComponents } from "../../../../../bitstream-app/components/3d-rotation/shared/fusionEulerWireToThreeEulerRad.js";
import type { FusionEulerHundredths } from "../../../../../bitstream-app/components/3d-rotation/shared/bmi270FusionExtract.js";
import { FUSION_EULER_ORDER } from "../../../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants.js";

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
  const { ex, ey, ez } = fusionWireEulerHundredthsToThreeEulerRadComponents(hundredths);
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

function quaternionFromSceneProps(p: RotationPreviewSceneProps): THREE.Quaternion {
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

export type RotationPreviewPanelV4Props = {
  title: string;
  sceneProps: RotationPreviewSceneProps;
  /** When set and no model URL is configured, show this instead of loading a default GLB. */
  emptyHint?: string;
};

function modelLoadKey(s: Scene3DConfigV1): string {
  return `${s.model.url}\u0000${s.model.embeddedRigPolicy}`;
}

/** Strip embedded GLTF lights/cameras under `root` according to studio policy. */
function applyEmbeddedRigPolicy(root: THREE.Object3D, policy: EmbeddedRigPolicy): void {
  if (policy === "keep") {
    return;
  }
  const removeList: THREE.Object3D[] = [];
  root.traverse((obj) => {
    const tagged = obj as THREE.Object3D & { isLight?: boolean; isCamera?: boolean };
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

function centerObjectToOrigin(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box.getCenter(center);
  root.position.sub(center);
  root.updateMatrixWorld(true);
}

function degToRad(v: number): number {
  return (v * Math.PI) / 180;
}

function applyPreviewPixelRatio(
  renderer: THREE.WebGLRenderer,
  rendererCfg: Scene3DConfigV1["renderer"],
): void {
  const sys = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const lo = Math.min(rendererCfg.dprMin, rendererCfg.dprMax);
  const hi = Math.max(rendererCfg.dprMin, rendererCfg.dprMax);
  renderer.setPixelRatio(Math.min(hi, Math.max(lo, sys)));
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

/** Stable key for inspector-driven camera pose (orbit/pan must not be overwritten every frame). */
function cameraDriveKeyFromScene3d(s: Scene3DConfigV1): string {
  const { position, target } = s.camera.transform;
  return JSON.stringify({
    px: position.x,
    py: position.y,
    pz: position.z,
    tx: target.x,
    ty: target.y,
    tz: target.z,
  });
}

function applyOrbitControlsFromScene3d(controls: OrbitControls, c: Scene3DConfigV1["controls"]) {
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
  controls.minAzimuthAngle = c.minAzimuthDeg != null ? degToRad(c.minAzimuthDeg) : -Infinity;
  controls.maxAzimuthAngle = c.maxAzimuthDeg != null ? degToRad(c.maxAzimuthDeg) : Infinity;
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

  controls.touches.ONE = c.touches.one === "PAN" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.touches.TWO =
    c.touches.two === "DOLLY_ROTATE" ? THREE.TOUCH.DOLLY_ROTATE : THREE.TOUCH.DOLLY_PAN;
}

function frameCameraToObject(params: {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  object: THREE.Object3D;
  /** Multiplicative padding factor (smaller = closer). */
  margin?: number;
}) {
  const margin = params.margin ?? 1.12;
  params.object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(params.object);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);

  const center = sphere.center.clone();
  const radius = Math.max(1e-4, sphere.radius);

  // Fit bounding sphere inside vertical FOV.
  const fovRad = (params.camera.fov * Math.PI) / 180;
  const distance = (radius / Math.tan(fovRad / 2)) * margin;

  // Nice diagonal direction so we see depth.
  const dir = new THREE.Vector3(1, 0.7, 1).normalize();

  params.camera.position.copy(center).addScaledVector(dir, distance);
  params.camera.near = Math.max(0.01, distance / 200);
  params.camera.far = Math.max(params.camera.near + 1, distance * 200);
  params.camera.updateProjectionMatrix();

  params.controls.target.copy(center);
  params.controls.update();
  params.camera.lookAt(center);
}

/**
 * V4: Vanilla Three.js renderer (no R3F) for deterministic resizing.
 * This avoids any resize scheduling/observer ambiguity inside React Flow transforms.
 */
export function RotationPreviewPanelV4(props: RotationPreviewPanelV4Props) {
  const { emptyHint } = props;
  const emptyHintRef = useRef(emptyHint);
  emptyHintRef.current = emptyHint;
  const { descriptors } = useStudioAssetDescriptors();
  const descriptorsRef = useRef(descriptors);
  descriptorsRef.current = descriptors;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const glbMorphRef = useRef<Record<string, number>>({});
  const glbLightsRef = useRef<Record<string, number>>({});
  const glbAnimsRef = useRef<Record<string, number>>({});
  const glbAnimScalesRef = useRef<Record<string, number>>({});
  const glbAnimLoopsRef = useRef<Record<string, "once" | "loop" | "pingpong">>({});
  const glbAnimWeightsRef = useRef<Record<string, number>>({});
  const glbAnimDrivesRef = useRef<Record<string, GlbAnimationClipPreviewDrive>>({});
  const glbAnimPlaybackModeRef = useRef<StudioGlbAnimationPlaybackModeV1>("per-clip");
  const glbAnimClipOrderRef = useRef<string[]>([]);
  const glbAnimSequenceStateRef = useRef<GlbAnimationSequencePlaybackState>({ activeClipName: null });
  const glbAnimPlaybackModePrevRef = useRef<StudioGlbAnimationPlaybackModeV1>("per-clip");
  const glbPartsRef = useRef<Record<string, number>>({});
  const glbMaterialPbrRef = useRef<Record<string, GlbMaterialPbrDriveRow>>({});
  const glbMaterialTexturesRef = useRef<Record<string, GlbMaterialTextureDriveRow>>({});
  const glbCamerasRef = useRef<Record<string, number>>({});
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
    glbPartVisibilityByPath?: Record<string, number>;
    glbMaterialPbrByName?: Record<string, GlbMaterialPbrDriveRow>;
    glbMaterialTexturesByName?: Record<string, GlbMaterialTextureDriveRow>;
    glbCameraDriveByName?: Record<string, number>;
  };
  glbMorphRef.current = scenePropsGlb.glbMorphWeights ?? {};
  glbLightsRef.current = scenePropsGlb.glbLightIntensityByName ?? {};
  glbAnimsRef.current = scenePropsGlb.glbAnimationTimeByClipName ?? {};
  glbAnimScalesRef.current = scenePropsGlb.glbAnimationTimeScaleByClipName ?? {};
  glbAnimLoopsRef.current = scenePropsGlb.glbAnimationLoopByClipName ?? {};
  glbAnimWeightsRef.current = scenePropsGlb.glbAnimationWeightByClipName ?? {};
  glbAnimDrivesRef.current = scenePropsGlb.glbAnimationClipDrivesByName ?? {};
  glbAnimPlaybackModeRef.current = scenePropsGlb.glbAnimationPlaybackMode ?? "per-clip";
  glbAnimClipOrderRef.current = scenePropsGlb.glbAnimationClipOrder ?? [];
  if (glbAnimPlaybackModePrevRef.current !== glbAnimPlaybackModeRef.current) {
    resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
    glbAnimPlaybackModePrevRef.current = glbAnimPlaybackModeRef.current;
  }
  glbPartsRef.current = scenePropsGlb.glbPartVisibilityByPath ?? {};
  glbMaterialPbrRef.current = scenePropsGlb.glbMaterialPbrByName ?? {};
  glbMaterialTexturesRef.current = scenePropsGlb.glbMaterialTexturesByName ?? {};
  glbCamerasRef.current = scenePropsGlb.glbCameraDriveByName ?? {};

  const quatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  useEffect(() => {
    quatRef.current.copy(quaternionFromSceneProps(props.sceneProps));
  }, [props.sceneProps]);

  const showBackgroundTexture = props.sceneProps.showBackgroundTexture !== false;
  const useCubemapIbl = props.sceneProps.useCubemapIbl !== false;
  const environmentPresetIndex =
    typeof props.sceneProps.environmentPresetIndex === "number" &&
    Number.isFinite(props.sceneProps.environmentPresetIndex)
      ? Math.max(0, Math.round(props.sceneProps.environmentPresetIndex))
      : 0;

  const rawScene3d = (props.sceneProps as RotationPreviewSceneProps & {
    scene3d?: unknown;
  }).scene3d;
  const scene3d = useMemo<Scene3DConfigV1>(
    () => (rawScene3d != null ? coerceScene3DConfigV1(rawScene3d) : defaultScene3DConfig()),
    [rawScene3d],
  );
  const scene3dRef = useRef<Scene3DConfigV1>(scene3d);
  useEffect(() => {
    scene3dRef.current = scene3d;
  }, [scene3d]);

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

      applyPreviewPixelRatio(renderer, scene3dRef.current.renderer);

      // Match RotationPreviewViewport onCreated(gl): tone mapping + exposure + sRGB output.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure =
        scene3dRef.current.renderer.toneMappingExposure ?? ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      renderer.setClearColor(
        parseHexToThreeColor(scene3dRef.current.renderer.clearColorHex),
        1,
      );

      const scene = new THREE.Scene();
      let cubeTexture: THREE.CubeTexture | null = null;

      let lastEnvKey = "";
      let envLoadToken = 0;
      let modelLoadGen = 0;
      const loadEnvironment = async () => {
        const s = scene3dRef.current;
        const presetIndex =
          typeof s.environment.presetIndex === "number" && Number.isFinite(s.environment.presetIndex)
            ? Math.max(0, Math.round(s.environment.presetIndex))
            : environmentPresetIndex;
        const studioSid = s.environment.studioAssetId;
        const studioResolveKey =
          typeof studioSid === "string" && studioSid.length > 0
            ? (getStudioEnvironmentDescriptorById(studioSid, descriptorsRef.current)?.id ?? `pending:${studioSid}`)
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
        scene.background = parseHexToThreeColor(s.environment.backgroundColorHex);

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
            const tex = await new Promise<THREE.CubeTexture | null>((resolve) => {
              loader.load(faceUrls, (t) => resolve(t), undefined, () => resolve(null));
            });
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
          const desc = getStudioEnvironmentDescriptorById(studioSid, descriptorsRef.current);
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
            loader.load(faceUrls, (t) => resolve(t), undefined, () => resolve(null));
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
          usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
            dedupeKey: `studio-rotation-cubemap:${urls[0]}`,
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

      const syncStudioDirectionals = (list: StudioDirectionalLightV1[]): void => {
        // Id-set only: reordering rows should not dispose/recreate lights (Auto helper still uses config order via `dirs[0]`).
        const key = [...list].map((l) => l.id).sort().join("|");
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

      const syncShadowRendering = (modelRootAtFrame: THREE.Object3D | null): void => {
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
            configureStudioDirectionalShadow(dl, enabled, mapSize, orthoExtent, bias, normalBias);
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
          h.attachToDirectionalId != null && h.attachToDirectionalId.trim().length > 0
            ? h.attachToDirectionalId.trim()
            : dirs[0]?.id ?? "";
        const targetLight =
          (resolvedAttach.length > 0 ? directionalById.get(resolvedAttach) : undefined) ??
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
          directionalLightHelper = new THREE.DirectionalLightHelper(targetLight, h.planeSize);
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
      };
      let loadedModelKey = "";
      let inflightModelKey: string | null = null;
      const modelLoader = new GLTFLoader();
      const beginModelLoad = (reasonKey: string): void => {
        if (inflightModelKey === reasonKey) {
          return;
        }
        const myGen = ++modelLoadGen;
        setInitError(null);
        inflightModelKey = reasonKey;
        resetAnimationMixer();
        resetGlbPartVisibilityDriveState(partVisibilityDriveState);
        resetGlbMaterialPbrDriveState(materialPbrDriveState);
        resetGlbMaterialTextureDriveState(materialTextureDriveState);
        resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
        glbPathIndex = null;
        if (modelRoot != null) {
          root.remove(modelRoot);
          disposeObject3D(modelRoot);
          modelRoot = null;
        }
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
              "No model URL — wire a Studio Model node or pick a GLB in the inspector.",
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
            setInitError(pf.message);
            usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
              dedupeKey: `studio-rotation-model:${urlAtStart}`,
              title: "Model file not available",
              description: `${pf.message}\n\nURL:\n${urlAtStart}\n\nUse Asset Manager → Actions to sync the free pack or download catalog models.`,
            });
            return;
          }

          modelLoader.load(
            loadUrl,
            (gltf) => {
              inflightModelKey = null;
              if (disposed) {
                disposeObject3D(gltf.scene);
                return;
              }
              const wantKey = modelLoadKey(scene3dRef.current);
              if (wantKey !== reasonKey) {
                disposeObject3D(gltf.scene);
                if (wantKey !== loadedModelKey) {
                  beginModelLoad(wantKey);
                }
                return;
              }
              modelRoot = gltf.scene;
              centerObjectToOrigin(modelRoot);
              applyEmbeddedRigPolicy(modelRoot, scene3dRef.current.model.embeddedRigPolicy);
              root.add(modelRoot);
              resetAnimationMixer();
              glbPathIndex = buildStudioGlbPathIndex(modelRoot);
              const clips = gltf.animations ?? [];
              if (clips.length > 0) {
                animationMixer = new THREE.AnimationMixer(modelRoot);
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
              loadedModelKey = reasonKey;
              frameCameraToObject({
                camera,
                controls,
                object: modelRoot,
                margin: scene3dRef.current.camera.frameMargin,
              });
            },
            undefined,
            (err) => {
              inflightModelKey = null;
              if (!disposed) {
                const msg = err instanceof Error ? err.message : "unknown error";
                setInitError(`Failed to load model: ${msg}`);
                usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
                  dedupeKey: `studio-rotation-model-err:${urlAtStart}`,
                  title: "Failed to load 3D model",
                  description: `${msg}\n\nURL:\n${loadUrl}\n\nUse Asset Manager → Actions to sync or download this asset.`,
                });
              }
            },
          );
        })();
      };

      beginModelLoad(modelLoadKey(scene3dRef.current));

      // Fire and forget; safe-guarded by `disposed`.
      void loadEnvironment();

      const resize = () => {
        const w = Math.max(1, Math.round(host.clientWidth));
        const h = Math.max(1, Math.round(host.clientHeight));
        if (renderer != null) {
          applyPreviewPixelRatio(renderer, scene3dRef.current.renderer);
          renderer.setSize(w, h, false);
        }
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      resize();
      const ro = new ResizeObserver(() => resize());
      ro.observe(host);

      let raf = 0;
      let lastCameraDriveKey = cameraDriveKeyFromScene3d(scene3dRef.current);
      /** Previous frame's GLB camera drive winner; used to detect handoff back to `scene3d` rig. */
      let prevGlbCamActive = false;
      let lastPerfMs = performance.now();
      const loop = () => {
        const nowMs = performance.now();
        const deltaSec = Math.min(0.05, Math.max(0, (nowMs - lastPerfMs) / 1000));
        lastPerfMs = nowMs;

        const s = scene3dRef.current;

        // Apply live renderer + light knobs without re-init.
        if (renderer == null) {
          raf = requestAnimationFrame(loop);
          return;
        }
        renderer.toneMappingExposure =
          s.renderer.toneMappingExposure ?? ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
        renderer.setClearColor(parseHexToThreeColor(s.renderer.clearColorHex), 1);

        ambient.color.copy(parseHexToThreeColor(s.lights.ambient.colorHex));
        ambient.intensity = s.lights.ambient.intensity;
        syncStudioDirectionals(s.lights.directionals);
        syncShadowRendering(modelRoot);

        applyGlbPartVisibilityByPathMap(glbPathIndex, glbPartsRef.current, partVisibilityDriveState);
        applyGlbMorphWeightsToModelRoot(modelRoot, glbMorphRef.current);
        applyGlbMaterialPbrByName(modelRoot, glbMaterialPbrRef.current, materialPbrDriveState);
        applyGlbMaterialTexturesByName(
          modelRoot,
          glbMaterialTexturesRef.current,
          materialTextureDriveState,
        );
        applyGlbLightIntensityOverrides(modelRoot, glbLightsRef.current);
        if (animationMixer != null && clipActions.size > 0) {
          const structuredDrives = glbAnimDrivesRef.current;
          const driveKeys = Object.keys(structuredDrives);
          if (driveKeys.length > 0) {
            const playbackMode = glbAnimPlaybackModeRef.current;
            const clipOrder = glbAnimClipOrderRef.current;
            const drivesForMixer = filterGlbAnimationDrivesForPreview({
              drives: structuredDrives,
              playbackMode,
              clipOrder,
              sequenceState: glbAnimSequenceStateRef.current,
            });
            applyStudioGlbAnimationMixerDrives({
              clipActions,
              drives: drivesForMixer,
              state: animationMixerState,
            });
            if (playbackMode === "sequence") {
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
            for (const [nm, ac] of clipActions) {
              const t = drives[nm];
              if (typeof t === "number" && Number.isFinite(t)) {
                ac.enabled = true;
                ac.paused = false;
                ac.time = Math.max(0, t);
                const ts = scales[nm];
                ac.timeScale =
                  typeof ts === "number" && Number.isFinite(ts) && Math.abs(ts) < 1e6 ? ts : 1;
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
                  typeof w === "number" && Number.isFinite(w) ? Math.min(1, Math.max(0, w)) : 1;
              } else {
                ac.paused = true;
                ac.time = 0;
                ac.timeScale = 1;
                ac.weight = 1;
              }
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
        const glbCamBlend = resolveGlbCameraBlendWeights(glbCamerasRef.current);
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
        if (glbCamActive) {
          applyStudioCameraFromBlendedGlbCameras(modelRoot, glbCamBlend, camera, controls);
        }

        const mk = modelLoadKey(s);
        if (mk !== loadedModelKey && inflightModelKey == null) {
          beginModelLoad(mk);
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
        }
        // Intentionally do not scale the model after load.

        maybeUpdateGrid();
        maybeUpdateAxesHelper();
        maybeUpdateCameraHelper();
        maybeUpdateDirectionalLightHelper();
        directionalLightHelper?.update();
        cameraHelper?.update();

        controls.update(deltaSec);
        renderer?.render(scene, camera);
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
      renderer.domElement.addEventListener("webglcontextlost", onContextLost, false);
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored, false);

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
        resetAnimationMixer();
        resetGlbPartVisibilityDriveState(partVisibilityDriveState);
        resetGlbMaterialPbrDriveState(materialPbrDriveState);
        resetGlbMaterialTextureDriveState(materialTextureDriveState);
        resetGlbAnimationSequencePlaybackState(glbAnimSequenceStateRef.current);
        glbPathIndex = null;
        if (modelRoot != null) {
          root.remove(modelRoot);
          disposeObject3D(modelRoot);
          modelRoot = null;
        }
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
        scene.remove(ambient);
        ambient.dispose();
        if (cubeTexture != null) {
          cubeTexture.dispose();
          cubeTexture = null;
        }
        renderer?.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer?.domElement.removeEventListener("webglcontextrestored", onContextRestored);
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
      if (initRaf != null) {
        cancelAnimationFrame(initRaf);
        initRaf = null;
      }
      roInit.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <ReadingPanel className="relative flex min-h-0 flex-1 flex-col space-y-1">
      <div className="flex items-center justify-between gap-2">
        <ReadingLabel className="block">{props.title}</ReadingLabel>
      </div>
      <div className="min-h-0 w-full flex-1">
        <div
          ref={viewportRef}
          className="nodrag nopan nowheel relative h-full w-full overflow-hidden rounded border border-zinc-700/70 bg-black/50 cursor-default"
          style={{ touchAction: "none" }}
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
          <Suspense fallback={null}>
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
              style={{ width: "100%", height: "100%" }}
            />
          </Suspense>
        </div>
      </div>
    </ReadingPanel>
  );
}

