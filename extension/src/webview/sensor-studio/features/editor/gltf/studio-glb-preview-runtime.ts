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
  /** Material uuid → opacity captured before part-opacity drives. */
  materialOpacityBaseline: Map<string, number>;
  /** Material uuid → transparent flag captured before part-opacity drives. */
  materialTransparentBaseline: Map<string, boolean>;
};

export function resetGlbPartVisibilityDriveState(st: GlbPartVisibilityDriveState): void {
  st.lastKeys.clear();
  st.materialOpacityBaseline.clear();
  st.materialTransparentBaseline.clear();
}

function restoreMaterialOpacityBaselines(
  obj: THREE.Object3D,
  st: GlbPartVisibilityDriveState,
): void {
  if (!(obj instanceof THREE.Mesh)) {
    return;
  }
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  for (const mat of mats) {
    if (!(mat instanceof THREE.Material)) {
      continue;
    }
    const baseOpacity = st.materialOpacityBaseline.get(mat.uuid);
    if (typeof baseOpacity === "number" && Number.isFinite(baseOpacity)) {
      mat.opacity = baseOpacity;
    }
    const baseTransparent = st.materialTransparentBaseline.get(mat.uuid);
    if (typeof baseTransparent === "boolean") {
      mat.transparent = baseTransparent;
    }
    mat.needsUpdate = true;
  }
}

function applyPartOpacityToObjectTree(obj: THREE.Object3D, opacity: number, st: GlbPartVisibilityDriveState): void {
  const clamped = Math.min(1, Math.max(0, opacity));
  obj.visible = clamped > 0;
  obj.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) {
      return;
    }
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.Material)) {
        continue;
      }
      if (!st.materialOpacityBaseline.has(mat.uuid)) {
        st.materialOpacityBaseline.set(mat.uuid, mat.opacity);
      }
      if (!st.materialTransparentBaseline.has(mat.uuid)) {
        st.materialTransparentBaseline.set(mat.uuid, mat.transparent);
      }
      if (clamped >= 1) {
        const baseOpacity = st.materialOpacityBaseline.get(mat.uuid);
        mat.opacity = typeof baseOpacity === "number" ? baseOpacity : 1;
        const baseTransparent = st.materialTransparentBaseline.get(mat.uuid);
        mat.transparent = typeof baseTransparent === "boolean" ? baseTransparent : false;
      } else if (clamped > 0) {
        mat.opacity = clamped;
        mat.transparent = true;
      }
      mat.needsUpdate = true;
    }
  });
}

/**
 * Part rows: **0** hides the subtree; **(0, 1)** sets mesh material opacity; **1** restores
 * baseline visibility/opacity. Keys are full object paths.
 * Objects no longer listed are restored to **visible** with captured material baselines.
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
        o.traverse((node) => restoreMaterialOpacityBaselines(node, st));
      }
    }
  }
  if (visibility != null) {
    for (const [p, v] of Object.entries(visibility)) {
      const o = pathToObject.get(p);
      if (o == null || typeof v !== "number" || !Number.isFinite(v)) {
        continue;
      }
      if (v <= 0) {
        o.visible = false;
        continue;
      }
      if (v >= 1) {
        o.visible = true;
        o.traverse((node) => restoreMaterialOpacityBaselines(node, st));
        continue;
      }
      applyPartOpacityToObjectTree(o, v, st);
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
  const blend = resolveGlbCameraBlendWeights(cameras);
  if (blend.length === 0) {
    return null;
  }
  return blend[0]?.name ?? null;
}

export type GlbCameraBlendEntry = { name: string; weight: number };

/**
 * Normalized weights for embedded GLB cameras with drive **> 0.5**.
 * Used for single-camera pick (highest weight) and multi-camera pose blend.
 */
export function resolveGlbCameraBlendWeights(
  cameras: Record<string, number> | undefined,
): GlbCameraBlendEntry[] {
  if (cameras == null || Object.keys(cameras).length === 0) {
    return [];
  }
  const raw: GlbCameraBlendEntry[] = [];
  for (const [name, v] of Object.entries(cameras)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0.5) {
      continue;
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      continue;
    }
    raw.push({ name: trimmed, weight: v });
  }
  if (raw.length === 0) {
    return [];
  }
  raw.sort((a, b) => b.weight - a.weight);
  const sum = raw.reduce((acc, row) => acc + row.weight, 0);
  if (sum <= 0) {
    return [];
  }
  return raw.map((row) => ({ name: row.name, weight: row.weight / sum }));
}

function findNamedGlbCamera(modelRoot: THREE.Object3D, cameraName: string): THREE.Camera | null {
  const want = cameraName.trim();
  if (want.length === 0) {
    return null;
  }
  let foundCam: THREE.Camera | null = null;
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
  return foundCam;
}

/**
 * Blend pose (+ perspective FOV when applicable) from weighted GLB embedded cameras into the
 * studio orbit camera. Falls back to the highest-weight camera when only one entry is active.
 */
export function applyStudioCameraFromBlendedGlbCameras(
  modelRoot: THREE.Object3D | null,
  blend: readonly GlbCameraBlendEntry[],
  studioCamera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): boolean {
  if (modelRoot == null || blend.length === 0) {
    return false;
  }
  if (blend.length === 1) {
    return applyStudioCameraFromNamedGlbCamera(modelRoot, blend[0]?.name ?? null, studioCamera, controls);
  }

  const posAcc = new THREE.Vector3();
  const targetAcc = new THREE.Vector3();
  let fovAcc = 0;
  let fovWeight = 0;
  const quatSum = new THREE.Vector4(0, 0, 0, 0);
  let matched = 0;

  for (const row of blend) {
    const cam = findNamedGlbCamera(modelRoot, row.name);
    if (cam == null) {
      continue;
    }
    matched += 1;
    cam.getWorldPosition(glbCamScratch.pos);
    posAcc.addScaledVector(glbCamScratch.pos, row.weight);
    cam.getWorldQuaternion(glbCamScratch.quat);
    if (quatSum.lengthSq() > 0) {
      const dot =
        quatSum.x * glbCamScratch.quat.x +
        quatSum.y * glbCamScratch.quat.y +
        quatSum.z * glbCamScratch.quat.z +
        quatSum.w * glbCamScratch.quat.w;
      if (dot < 0) {
        glbCamScratch.quat.x *= -1;
        glbCamScratch.quat.y *= -1;
        glbCamScratch.quat.z *= -1;
        glbCamScratch.quat.w *= -1;
      }
    }
    quatSum.x += glbCamScratch.quat.x * row.weight;
    quatSum.y += glbCamScratch.quat.y * row.weight;
    quatSum.z += glbCamScratch.quat.z * row.weight;
    quatSum.w += glbCamScratch.quat.w * row.weight;
    cam.getWorldDirection(glbCamScratch.dir);
    targetAcc.addScaledVector(glbCamScratch.pos.clone().add(glbCamScratch.dir), row.weight);
    if (cam instanceof THREE.PerspectiveCamera) {
      fovAcc += cam.fov * row.weight;
      fovWeight += row.weight;
    }
  }

  if (matched === 0) {
    return false;
  }

  quatSum.normalize();
  const quatAcc = new THREE.Quaternion(quatSum.x, quatSum.y, quatSum.z, quatSum.w);
  quatAcc.normalize();

  studioCamera.position.copy(posAcc);
  studioCamera.quaternion.copy(quatAcc);
  studioCamera.scale.set(1, 1, 1);
  if (fovWeight > 0) {
    studioCamera.fov = fovAcc / fovWeight;
  }
  controls.target.copy(targetAcc);
  studioCamera.updateProjectionMatrix();
  controls.update();
  return true;
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
  const foundCam = findNamedGlbCamera(modelRoot, cameraName);
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
