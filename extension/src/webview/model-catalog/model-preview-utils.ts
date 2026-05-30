import * as THREE from 'three';
import { getAssetSourceStrategy, joinAssetBase } from '../asset-source-strategy';
import type { AnimationClipLoop } from './persisted-settings';

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const meshLike = obj as THREE.Mesh;
    if (meshLike.geometry) {
      meshLike.geometry.dispose?.();
    }

    const material = (meshLike as { material?: unknown }).material;
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach((m) => {
        (m as THREE.Material).dispose?.();
      });
    } else {
      (material as THREE.Material).dispose?.();
    }
  });
}

export function computeMeshBounds(root: THREE.Object3D): THREE.Box3 | null {
  const box = new THREE.Box3();
  box.makeEmpty();

  const tmpBox = new THREE.Box3();
  const tmpVec = new THREE.Vector3();
  const corners: THREE.Vector3[] = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];

  let found = false;

  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const meshLike = obj as unknown as {
      isMesh?: boolean;
      geometry?: THREE.BufferGeometry;
      matrixWorld?: THREE.Matrix4;
    };
    if (!meshLike.isMesh || !meshLike.geometry || !meshLike.matrixWorld) return;

    const geom = meshLike.geometry;
    if (!geom.boundingBox) {
      geom.computeBoundingBox?.();
    }
    if (!geom.boundingBox) return;

    tmpBox.copy(geom.boundingBox);
    const min = tmpBox.min;
    const max = tmpBox.max;

    corners[0].set(min.x, min.y, min.z);
    corners[1].set(min.x, min.y, max.z);
    corners[2].set(min.x, max.y, min.z);
    corners[3].set(min.x, max.y, max.z);
    corners[4].set(max.x, min.y, min.z);
    corners[5].set(max.x, min.y, max.z);
    corners[6].set(max.x, max.y, min.z);
    corners[7].set(max.x, max.y, max.z);

    for (const c of corners) {
      tmpVec.copy(c).applyMatrix4(meshLike.matrixWorld);
      box.expandByPoint(tmpVec);
    }
    found = true;
  });

  return found ? box : null;
}

export function applyLoopToAction(
  action: THREE.AnimationAction,
  loop: AnimationClipLoop
): void {
  if (loop === 'once') {
    action.setLoop(THREE.LoopOnce, 1);
  } else if (loop === 'loop') {
    action.setLoop(THREE.LoopRepeat, Infinity);
  } else if (typeof loop === 'number' && loop >= 1) {
    action.setLoop(THREE.LoopRepeat, loop);
  }
}

/**
 * T3D presets use `textures/cubemap/<name>`. The extension webview ships those files from
 * `src/assets/free/textures/cubemap/` to `out/webview/assets/free/textures/cubemap/` (see Vite copy).
 */
function cubeMapFolderPathForExtensionWebview(folderPath: string): string {
  const trimmed = folderPath.startsWith("/") ? folderPath.slice(1) : folderPath;
  if (trimmed.startsWith("textures/cubemap/")) {
    return `free/textures/cubemap/${trimmed.slice("textures/cubemap/".length)}`;
  }
  return trimmed;
}

export function buildCubeMapFaceUrls(folderPath: string): string[] {
  const win = typeof window !== "undefined" ? window : undefined;
  const strategy = getAssetSourceStrategy();

  const trimmed = folderPath.startsWith('/') ? folderPath.slice(1) : folderPath;
  const isCubemap = trimmed.startsWith('textures/cubemap/');

  const free = win?.FREE_ASSETS_BASE_URI?.trim();
  const local = win?.LOCAL_ASSETS_BASE_URI?.trim();
  const online = win?.ONLINE_ASSETS_BASE_URI?.trim();

  let base = local ?? '/assets';
  let relativeFolder = cubeMapFolderPathForExtensionWebview(folderPath);

  if (strategy === 'online-only') {
    if (online) {
      base = online;
      relativeFolder = trimmed;
    } else if (free && isCubemap) {
      base = free;
      relativeFolder = trimmed;
    }
  } else {
    if (free && isCubemap) {
      base = free;
      relativeFolder = trimmed;
    } else if (strategy === 'local-first' && online) {
      // Local bundle may omit heavy texture packs in VSIX; allow explicit online strategy fallback source.
      // Keep folder path untouched (`textures/cubemap/...`) for online mirrors.
      base = online;
      relativeFolder = trimmed;
    }
  }

  return [
    joinAssetBase(base, `${relativeFolder}/posx.jpg`),
    joinAssetBase(base, `${relativeFolder}/negx.jpg`),
    joinAssetBase(base, `${relativeFolder}/posy.jpg`),
    joinAssetBase(base, `${relativeFolder}/negy.jpg`),
    joinAssetBase(base, `${relativeFolder}/posz.jpg`),
    joinAssetBase(base, `${relativeFolder}/negz.jpg`),
  ];
}
