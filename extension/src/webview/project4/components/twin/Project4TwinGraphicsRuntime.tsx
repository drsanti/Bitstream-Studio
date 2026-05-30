import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { toneMappingKeyToThree } from "../../settings/project4-graphics.normalize";
import { useProject4GraphicsStore } from "../../settings/project4-graphics.store";

/**
 * Applies persisted renderer settings (tone mapping, exposure, output color space, shadow map gate).
 */
export function Project4TwinGraphicsRuntime() {
  const toneMappingKey = useProject4GraphicsStore((s) => s.toneMappingKey);
  const toneMappingExposure = useProject4GraphicsStore((s) => s.toneMappingExposure);
  const outputColorSpaceKey = useProject4GraphicsStore((s) => s.outputColorSpaceKey);
  const shadowsEnabled = useProject4GraphicsStore((s) => s.shadowsEnabled);
  const gl = useThree((st) => st.gl);

  useLayoutEffect(() => {
    gl.toneMapping = toneMappingKeyToThree(toneMappingKey);
    gl.toneMappingExposure = toneMappingExposure;
    gl.outputColorSpace =
      outputColorSpaceKey === "srgb" ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
    gl.shadowMap.enabled = shadowsEnabled;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl, toneMappingKey, toneMappingExposure, outputColorSpaceKey, shadowsEnabled]);

  return null;
}
