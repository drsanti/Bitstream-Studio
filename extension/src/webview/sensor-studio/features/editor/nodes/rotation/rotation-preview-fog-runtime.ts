import * as THREE from "three";

import type { Scene3DConfigV1 } from "./scene3d-config";
import { parseHexToThreeColor } from "./scene3d-config";

export type PreviewFogRuntimeState = {
  instance: THREE.Fog | THREE.FogExp2 | null;
  layoutKey: string;
};

export function createPreviewFogRuntimeState(): PreviewFogRuntimeState {
  return { instance: null, layoutKey: "" };
}

function fogLayoutKey(fog: Scene3DConfigV1["fog"]): string {
  if (fog == null || !fog.enabled) {
    return "off";
  }
  return `${fog.mode}|${fog.near}|${fog.far}|${fog.density}|${fog.colorHex}`;
}

/**
 * Sync Three.js scene fog from coerced `scene3d.fog`. Reuses instances when layout is unchanged.
 */
export function syncPreviewSceneFog(
  scene: THREE.Scene,
  state: PreviewFogRuntimeState,
  fogConfig: Scene3DConfigV1["fog"],
): void {
  const key = fogLayoutKey(fogConfig);
  if (key === "off") {
    if (state.instance != null) {
      scene.fog = null;
      state.instance = null;
      state.layoutKey = "";
    }
    return;
  }
  if (state.instance != null && state.layoutKey === key) {
    scene.fog = state.instance;
    return;
  }
  const fog = fogConfig!;
  const color = parseHexToThreeColor(fog.colorHex);
  state.instance =
    fog.mode === "exp2"
      ? new THREE.FogExp2(color.getHex(), fog.density)
      : new THREE.Fog(color.getHex(), fog.near, fog.far);
  state.layoutKey = key;
  scene.fog = state.instance;
}
