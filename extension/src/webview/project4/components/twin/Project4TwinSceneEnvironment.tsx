import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { buildProject4TwinCubemapFaceUrls } from "../../lib/project4-cubemap-urls";
import {
  PROJECT4_TWIN_CUBEMAP_NONE,
  PROJECT4_TWIN_SCENE_BACKGROUND_HEX,
} from "../../lib/project4-twin-environments";
import { useProject4GraphicsStore } from "../../settings/project4-graphics.store";

/**
 * Sets **`scene.background`** + **`scene.environment`** from a JPEG cubemap (IBL + visible backdrop).
 * **`scene.environmentIntensity`** follows **`ternion.project4.graphics.v1`**.
 */
export function Project4TwinSceneEnvironment(props: { cubemapSetId: string }) {
  const { scene } = useThree();
  const textureRef = useRef<THREE.CubeTexture | null>(null);
  const environmentIntensity = useProject4GraphicsStore((s) => s.environmentIntensity);
  const intensityRef = useRef(environmentIntensity);
  intensityRef.current = environmentIntensity;

  const applySolidFallback = useCallback(() => {
    scene.background = new THREE.Color(PROJECT4_TWIN_SCENE_BACKGROUND_HEX);
    scene.environment = null;
    scene.environmentIntensity = intensityRef.current;
  }, [scene]);

  useEffect(() => {
    scene.environmentIntensity = environmentIntensity;
  }, [scene, environmentIntensity]);

  useEffect(() => {
    const id = props.cubemapSetId.trim();

    if (id.length === 0 || id === PROJECT4_TWIN_CUBEMAP_NONE) {
      textureRef.current?.dispose();
      textureRef.current = null;
      applySolidFallback();
      return;
    }

    applySolidFallback();

    let cancelled = false;
    const urls = buildProject4TwinCubemapFaceUrls(id);
    const loader = new THREE.CubeTextureLoader();
    loader.load(
      urls,
      (cubeTexture) => {
        if (cancelled) {
          cubeTexture.dispose();
          return;
        }
        textureRef.current?.dispose();
        textureRef.current = cubeTexture;
        cubeTexture.colorSpace = THREE.LinearSRGBColorSpace;
        cubeTexture.needsUpdate = true;
        scene.background = cubeTexture;
        scene.environment = cubeTexture;
        scene.environmentIntensity = intensityRef.current;
      },
      undefined,
      () => {
        if (!cancelled) {
          textureRef.current?.dispose();
          textureRef.current = null;
          applySolidFallback();
        }
      },
    );

    return () => {
      cancelled = true;
      textureRef.current?.dispose();
      textureRef.current = null;
      applySolidFallback();
    };
  }, [scene, props.cubemapSetId, applySolidFallback]);

  return null;
}
