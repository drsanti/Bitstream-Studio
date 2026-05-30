import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import {
  getEngineEnvironmentCubeMaps,
  getEngineEnvironmentDefaultCubeMapIndex,
  getEngineEnvironmentIntensity,
} from "@/engine-environment/t3dEngineEnvironment";
import * as THREE from "three";
import { buildCubeMapFaceUrls } from "../../../../model-catalog/model-preview-utils.js";
import {
  ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
  ROTATION_PREVIEW_ENV_INTENSITY_SCALE,
  ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC,
  SCENE_BACKGROUND_FALLBACK_HEX,
} from "./rotationPreviewConstants.js";

/**
 * Loads a T3D cubemap for `scene.background` and **always** `scene.environment` when the texture
 * exists (required for metallic / glossy PBR). Sparkles scales `environmentIntensity`, not on/off.
 */
export function RotationPreviewSceneEnvironment(props: {
  showBackgroundTexture?: boolean;
  useCubemapIbl?: boolean;
  environmentPresetIndex?: number;
}) {
  const {
    showBackgroundTexture = true,
    useCubemapIbl = ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
    environmentPresetIndex,
  } = props;
  const { scene } = useThree();
  const textureRef = useRef<THREE.CubeTexture | null>(null);
  const showBgRef = useRef(showBackgroundTexture);
  const useIblRef = useRef(useCubemapIbl);
  showBgRef.current = showBackgroundTexture;
  useIblRef.current = useCubemapIbl;

  const syncCubemapToScene = useCallback(() => {
    const tex = textureRef.current;
    if (tex == null) {
      return;
    }
    scene.background = showBgRef.current
      ? tex
      : new THREE.Color(SCENE_BACKGROUND_FALLBACK_HEX);
    const base = getEngineEnvironmentIntensity();
    const fullIntensity = base * ROTATION_PREVIEW_ENV_INTENSITY_SCALE;
    /** Same cubemap as background; omitting this makes full-metal meshes black. */
    scene.environment = tex;
    scene.environmentIntensity = useIblRef.current
      ? fullIntensity
      : fullIntensity * ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC;
  }, [scene]);

  const syncCubemapRef = useRef(syncCubemapToScene);
  syncCubemapRef.current = syncCubemapToScene;

  useEffect(() => {
    const previousBackground = scene.background;
    const previousEnvironment = scene.environment;
    const previousEnvironmentIntensity = scene.environmentIntensity;

    scene.background = new THREE.Color(SCENE_BACKGROUND_FALLBACK_HEX);

    const cubeMaps = getEngineEnvironmentCubeMaps();
    const configIdx = getEngineEnvironmentDefaultCubeMapIndex();
    const idx = Math.min(
      Math.max(
        0,
        environmentPresetIndex !== undefined
          ? environmentPresetIndex
          : configIdx,
      ),
      Math.max(0, cubeMaps.length - 1),
    );
    const preset = cubeMaps[idx];
    if (!preset) {
      return () => {
        scene.background = previousBackground;
        scene.environment = previousEnvironment;
        scene.environmentIntensity = previousEnvironmentIntensity;
      };
    }

    let cancelled = false;
    const urls = buildCubeMapFaceUrls(preset.path);
    const loader = new THREE.CubeTextureLoader();
    loader.load(
      urls,
      (cubeTexture) => {
        if (cancelled) {
          cubeTexture.dispose();
          return;
        }
        const prevTex = textureRef.current;
        textureRef.current = cubeTexture;
        prevTex?.dispose();
        /** Linear input for PMREM / IBL; matches typical Three.js env-map expectations. */
        cubeTexture.colorSpace = THREE.LinearSRGBColorSpace;
        cubeTexture.generateMipmaps = true;
        cubeTexture.needsUpdate = true;
        syncCubemapRef.current();
      },
      undefined,
      () => {
        if (!cancelled) {
          scene.background = new THREE.Color(SCENE_BACKGROUND_FALLBACK_HEX);
          scene.environment = null;
          scene.environmentIntensity = previousEnvironmentIntensity;
        }
      },
    );

    return () => {
      cancelled = true;
      const tex = textureRef.current;
      textureRef.current = null;
      tex?.dispose();
      scene.background = previousBackground;
      scene.environment = previousEnvironment;
      scene.environmentIntensity = previousEnvironmentIntensity;
    };
  }, [scene, environmentPresetIndex]);

  useEffect(() => {
    syncCubemapToScene();
  }, [syncCubemapToScene, showBackgroundTexture, useCubemapIbl]);

  return null;
}
