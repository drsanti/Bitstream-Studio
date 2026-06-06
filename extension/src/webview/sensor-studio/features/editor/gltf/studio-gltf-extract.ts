import * as THREE from "three";
import { fetchAndParseGltfFromUrl } from "./load-gltf-from-url.js";

/**
 * Heuristic keywords for “addressable” rig / mechanism parts (aligned with node-animator’s
 * `gltfParser` idea — narrows huge meshes lists to likely-controllable objects).
 */
const CONTROLLABLE_NAME_KEYWORDS = [
  "gimbal",
  "wing",
  "arm",
  "joint",
  "servo",
  "rotor",
  "motor",
  "camera",
  "main_body",
  "gripper",
] as const;

export type StudioGltfExtractKind =
  | "animation"
  | "part"
  | "material"
  | "morph"
  | "light"
  | "camera";

export type StudioGltfExtractRow = {
  kind: StudioGltfExtractKind;
  /** Stable ref: clip name, object path, material name, or `mesh:morph`. */
  ref: string;
  /** Short UI label (usually last path segment or clip name). */
  label: string;
  /** Populated for `kind === "animation"` when the GLB exposes a finite clip duration. */
  durationS?: number;
};

/** Stable key for UI + “already placed on graph” checks (must match spawn metadata). */
export function studioGlbExtractRowKey(row: Pick<StudioGltfExtractRow, "kind" | "ref">): string {
  return `${row.kind}:${row.ref}`;
}

export type StudioGltfExtractionResult = {
  animations: StudioGltfExtractRow[];
  parts: StudioGltfExtractRow[];
  materials: StudioGltfExtractRow[];
  morphs: StudioGltfExtractRow[];
  lights: StudioGltfExtractRow[];
  cameras: StudioGltfExtractRow[];
};

function objectPath(obj: THREE.Object3D): string {
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

/** Drop GPU geometry only — do not `material.dispose()` (revokes GLTF blob texture URLs). */
function disposeLoadedScene(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh === true) {
      mesh.geometry?.dispose();
    }
  });
}

function isControllablePart(obj: THREE.Object3D): boolean {
  if (typeof obj.name !== "string" || obj.name.trim().length === 0) {
    return false;
  }
  const exposed = (obj.userData as { exposeNode?: unknown } | undefined)?.exposeNode === true;
  if (exposed) {
    return true;
  }
  const lower = obj.name.toLowerCase();
  return CONTROLLABLE_NAME_KEYWORDS.some((k) => lower.includes(k));
}

/**
 * Load a GLB/GLTF from URL, walk the scene once, and return lists suitable for a Library-style
 * palette (animations, heuristic parts, materials, morphs, lights, cameras). The loaded scene
 * is disposed after introspection to avoid leaking GPU memory.
 */
export async function extractStudioGltfComponents(fetchUrl: string): Promise<StudioGltfExtractionResult> {
  const trimmed = fetchUrl.trim();
  if (trimmed.length === 0) {
    return {
      animations: [],
      parts: [],
      materials: [],
      morphs: [],
      lights: [],
      cameras: [],
    };
  }

  const gltf = await fetchAndParseGltfFromUrl(trimmed);
  const scene = gltf.scene;
  const animations = gltf.animations ?? [];

  const partRefs = new Set<string>();
  const materialRefs = new Set<string>();
  const morphRefs = new Set<string>();
  const lightRefs = new Set<string>();
  const cameraRefs = new Set<string>();

  scene.updateMatrixWorld(true);

  scene.traverse((obj) => {
    if (obj instanceof THREE.Light) {
      if (typeof obj.name === "string" && obj.name.trim().length > 0) {
        lightRefs.add(obj.name.trim());
      }
      return;
    }
    if (obj instanceof THREE.Camera) {
      if (typeof obj.name === "string" && obj.name.trim().length > 0) {
        cameraRefs.add(obj.name.trim());
      }
      return;
    }

    const mesh = obj instanceof THREE.Mesh ? obj : null;
    const isGroup = obj instanceof THREE.Group;
    const isBone = obj instanceof THREE.Bone;

    if ((mesh != null || isGroup || isBone) && isControllablePart(obj)) {
      partRefs.add(objectPath(obj));
    }

    if (mesh != null && mesh.material != null) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat != null && typeof mat.name === "string" && mat.name.trim().length > 0) {
          materialRefs.add(mat.name.trim());
        }
      }
    }

    if (mesh != null && mesh.morphTargetDictionary != null) {
      const meshKey =
        typeof mesh.name === "string" && mesh.name.trim().length > 0 ? mesh.name.trim() : mesh.uuid;
      for (const morphName of Object.keys(mesh.morphTargetDictionary)) {
        morphRefs.add(`${meshKey}:${morphName}`);
      }
    }
  });

  disposeLoadedScene(scene);

  const toRows = (kind: StudioGltfExtractKind, refs: Set<string>): StudioGltfExtractRow[] =>
    [...refs]
      .sort((a, b) => a.localeCompare(b))
      .map((ref) => ({
        kind,
        ref,
        label: ref.includes("/") ? ref.split("/").pop() ?? ref : ref,
      }));

  const animationRows: StudioGltfExtractRow[] = animations
    .filter((clip) => typeof clip.name === "string" && clip.name.trim().length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((clip) => {
      const name = clip.name.trim();
      const dur = typeof clip.duration === "number" && Number.isFinite(clip.duration) ? clip.duration : 0;
      return {
        kind: "animation" as const,
        ref: name,
        label: name,
        durationS: dur >= 0 ? dur : 0,
      };
    });

  return {
    animations: animationRows,
    parts: toRows("part", partRefs),
    materials: toRows("material", materialRefs),
    morphs: toRows("morph", morphRefs),
    lights: toRows("light", lightRefs),
    cameras: toRows("camera", cameraRefs),
  };
}

export function countStudioGltfExtractionRows(r: StudioGltfExtractionResult): number {
  return (
    r.animations.length +
    r.parts.length +
    r.materials.length +
    r.morphs.length +
    r.lights.length +
    r.cameras.length
  );
}
