import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

/** Object path from root (named segments), matching {@link extractStudioGltfComponents} part refs. */
export function studioGlbObjectPath(obj: THREE.Object3D): string {
  const segments: string[] = [];
  let cur: THREE.Object3D | null = obj;
  while (cur != null) {
    if (typeof cur.name === "string" && cur.name.trim().length > 0) {
      segments.unshift(cur.name.trim());
    }
    cur = cur.parent;
  }
  return segments.length > 0 ? segments.join("/") : obj.uuid;
}

/** Map {@link studioGlbObjectPath} → object for the loaded model root. */
export function buildStudioGlbPathIndex(root: THREE.Object3D): Map<string, THREE.Object3D> {
  const m = new Map<string, THREE.Object3D>();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    m.set(studioGlbObjectPath(obj), obj);
  });
  return m;
}

export type GlbPartVisibilityDriveState = {
  lastKeys: Set<string>;
};

export function resetGlbPartVisibilityDriveState(st: GlbPartVisibilityDriveState): void {
  st.lastKeys.clear();
}

/**
 * Part rows: numeric **> 0.5** means visible; otherwise hidden. Keys are full object paths.
 * Objects no longer listed are restored to **visible**.
 */
export function applyGlbPartVisibilityByPathMap(
  pathToObject: Map<string, THREE.Object3D> | null,
  visibility: Record<string, number> | undefined,
  st: GlbPartVisibilityDriveState,
): void {
  if (pathToObject == null || pathToObject.size === 0) {
    return;
  }
  const next = new Set(Object.keys(visibility ?? {}));
  for (const k of st.lastKeys) {
    if (!next.has(k)) {
      const o = pathToObject.get(k);
      if (o != null) {
        o.visible = true;
      }
    }
  }
  if (visibility != null) {
    for (const [p, v] of Object.entries(visibility)) {
      const o = pathToObject.get(p);
      if (o != null) {
        o.visible = typeof v === "number" && Number.isFinite(v) && v > 0.5;
      }
    }
  }
  st.lastKeys = next;
}

export type GlbMaterialEmissiveDriveState = {
  baseline: Map<string, number>;
  lastMaterialNames: Set<string>;
};

export function resetGlbMaterialEmissiveDriveState(st: GlbMaterialEmissiveDriveState): void {
  st.baseline.clear();
  st.lastMaterialNames.clear();
}

/**
 * Material rows: drive **emissiveIntensity** on Standard/Physical materials whose **name** matches
 * the GLB extraction ref. Values are clamped ≥ 0. When a drive disappears, intensity restores
 * from the first-seen baseline captured per material **uuid**.
 */
export function applyGlbMaterialEmissiveByName(
  root: THREE.Object3D | null,
  intensities: Record<string, number> | undefined,
  st: GlbMaterialEmissiveDriveState,
): void {
  if (root == null) {
    return;
  }
  const nextNames = new Set(Object.keys(intensities ?? {}));
  for (const name of st.lastMaterialNames) {
    if (!nextNames.has(name)) {
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) {
          return;
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (
            mat instanceof THREE.MeshStandardMaterial ||
            mat instanceof THREE.MeshPhysicalMaterial
          ) {
            const nm = typeof mat.name === "string" ? mat.name.trim() : "";
            if (nm !== name) {
              continue;
            }
            const base = st.baseline.get(mat.uuid);
            if (typeof base === "number" && Number.isFinite(base)) {
              mat.emissiveIntensity = base;
            }
            mat.needsUpdate = true;
          }
        }
      });
    }
  }
  st.lastMaterialNames = nextNames;
  if (intensities == null || Object.keys(intensities).length === 0) {
    return;
  }
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (
        !(mat instanceof THREE.MeshStandardMaterial) &&
        !(mat instanceof THREE.MeshPhysicalMaterial)
      ) {
        continue;
      }
      const nm = typeof mat.name === "string" ? mat.name.trim() : "";
      if (nm.length === 0 || intensities[nm] === undefined) {
        continue;
      }
      const v = intensities[nm];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        continue;
      }
      if (!st.baseline.has(mat.uuid)) {
        st.baseline.set(mat.uuid, mat.emissiveIntensity);
      }
      mat.emissiveIntensity = Math.max(0, v);
      mat.needsUpdate = true;
    }
  });
}

const glbCamScratch = {
  pos: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  dir: new THREE.Vector3(),
};

/** Pick the GLB camera name with the strongest drive value (must be **> 0.5** to activate). */
export function pickActiveGlbCameraName(cameras: Record<string, number> | undefined): string | null {
  if (cameras == null || Object.keys(cameras).length === 0) {
    return null;
  }
  let best: string | null = null;
  let bestV = 0.5;
  for (const [name, v] of Object.entries(cameras)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0.5) {
      continue;
    }
    if (v > bestV) {
      bestV = v;
      best = name;
    }
  }
  return best;
}

/**
 * Copy pose (+ perspective params when applicable) from a named GLB camera into the studio orbit
 * camera. Returns **true** when a matching embedded camera was found.
 */
export function applyStudioCameraFromNamedGlbCamera(
  modelRoot: THREE.Object3D | null,
  cameraName: string | null,
  studioCamera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): boolean {
  if (modelRoot == null || cameraName == null || cameraName.trim().length === 0) {
    return false;
  }
  const want = cameraName.trim();
  let foundCam: THREE.Camera | undefined;
  modelRoot.traverse((o) => {
    if (foundCam != null) {
      return;
    }
    if (!(o instanceof THREE.Camera)) {
      return;
    }
    const n = typeof o.name === "string" ? o.name.trim() : "";
    if (n === want) {
      foundCam = o;
    }
  });
  if (foundCam == null) {
    return false;
  }
  foundCam.getWorldPosition(glbCamScratch.pos);
  foundCam.getWorldQuaternion(glbCamScratch.quat);
  studioCamera.position.copy(glbCamScratch.pos);
  studioCamera.quaternion.copy(glbCamScratch.quat);
  studioCamera.scale.set(1, 1, 1);
  if (foundCam instanceof THREE.PerspectiveCamera) {
    studioCamera.fov = foundCam.fov;
    studioCamera.near = foundCam.near;
    studioCamera.far = foundCam.far;
  }
  foundCam.getWorldDirection(glbCamScratch.dir);
  controls.target.copy(glbCamScratch.pos).add(glbCamScratch.dir);
  studioCamera.updateProjectionMatrix();
  controls.update();
  return true;
}

/**
 * Apply morph target influences for keys shaped like GLB extraction refs (`meshKey:morphName`).
 * Only indices listed in `weights` are written; other morphs are left unchanged for this frame.
 */
export function applyGlbMorphWeightsToModelRoot(
  root: THREE.Object3D | null,
  weights: Record<string, number> | undefined,
): void {
  if (root == null || weights == null || Object.keys(weights).length === 0) {
    return;
  }
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    if (obj.morphTargetDictionary == null || obj.morphTargetInfluences == null) {
      return;
    }
    const meshKey =
      typeof obj.name === "string" && obj.name.trim().length > 0 ? obj.name.trim() : obj.uuid;
    for (const morphName of Object.keys(obj.morphTargetDictionary)) {
      const ref = `${meshKey}:${morphName}`;
      const w = weights[ref];
      if (typeof w !== "number" || !Number.isFinite(w)) {
        continue;
      }
      const idx = obj.morphTargetDictionary[morphName];
      if (typeof idx === "number" && idx >= 0 && idx < obj.morphTargetInfluences.length) {
        obj.morphTargetInfluences[idx] = w;
      }
    }
  });
}

/** Drive named GLB lights by `THREE.Light` object name (matches extraction list). */
export function applyGlbLightIntensityOverrides(
  root: THREE.Object3D | null,
  intensitiesByLightName: Record<string, number> | undefined,
): void {
  if (root == null || intensitiesByLightName == null || Object.keys(intensitiesByLightName).length === 0) {
    return;
  }
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Light)) {
      return;
    }
    const n = typeof obj.name === "string" ? obj.name.trim() : "";
    if (n.length === 0) {
      return;
    }
    const v = intensitiesByLightName[n];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return;
    }
    obj.intensity = Math.max(0, v);
  });
}
