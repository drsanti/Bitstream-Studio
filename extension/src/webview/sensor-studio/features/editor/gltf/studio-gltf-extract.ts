import * as THREE from "three";
import { fetchAndParseGltfFromUrl } from "./load-gltf-from-url.js";
import {
  STUDIO_GLB_MATERIAL_TEXTURE_SLOTS,
  type StudioGlbMaterialTextureSlotV1,
} from "./studio-glb-material-texture.js";

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

export type StudioGltfSceneTreeNodeType =
  | "group"
  | "mesh"
  | "bone"
  | "light"
  | "camera"
  | "other";

export type StudioGltfSceneTreeNode = {
  /** Stable object path (slash-separated names from root). */
  path: string;
  label: string;
  nodeType: StudioGltfSceneTreeNodeType;
  children: StudioGltfSceneTreeNode[];
};

export type StudioGltfVec3 = {
  x: number;
  y: number;
  z: number;
};

/** Local transform + mesh material slot names for Model Outliner detail strip. */
export type StudioGltfObjectDetail = {
  path: string;
  nodeType: StudioGltfSceneTreeNodeType;
  transform: {
    position: StudioGltfVec3;
    rotationDeg: StudioGltfVec3;
    scale: StudioGltfVec3;
  };
  materialSlotNames: string[];
  morphTargetNames: string[];
};

/** Aggregated GLB material info for Model Outliner detail strip. */
export type StudioGltfMaterialDetail = {
  name: string;
  usedOnMeshPaths: string[];
  occupiedTextureSlots: StudioGlbMaterialTextureSlotV1[];
  metalness?: number;
  roughness?: number;
};

export type StudioGltfExtractionResult = {
  animations: StudioGltfExtractRow[];
  parts: StudioGltfExtractRow[];
  materials: StudioGltfExtractRow[];
  morphs: StudioGltfExtractRow[];
  lights: StudioGltfExtractRow[];
  cameras: StudioGltfExtractRow[];
  /** Full scene object hierarchy (root-level children of the loaded scene). */
  sceneTree: StudioGltfSceneTreeNode[];
  objectDetailsByPath: Record<string, StudioGltfObjectDetail>;
  materialDetailsByName: Record<string, StudioGltfMaterialDetail>;
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

function sceneTreeNodeType(obj: THREE.Object3D): StudioGltfSceneTreeNodeType {
  if (obj instanceof THREE.Light) {
    return "light";
  }
  if (obj instanceof THREE.Camera) {
    return "camera";
  }
  if (obj instanceof THREE.Bone) {
    return "bone";
  }
  if (obj instanceof THREE.Mesh) {
    return "mesh";
  }
  if (obj instanceof THREE.Group) {
    return "group";
  }
  return "other";
}

function sceneTreeLabel(obj: THREE.Object3D, path: string): string {
  if (typeof obj.name === "string" && obj.name.trim().length > 0) {
    return obj.name.trim();
  }
  const tail = path.includes("/") ? path.split("/").pop() : path;
  if (tail != null && tail.length > 0) {
    return tail;
  }
  return sceneTreeNodeType(obj);
}

function buildStudioGltfSceneTreeNode(obj: THREE.Object3D): StudioGltfSceneTreeNode {
  const path = objectPath(obj);
  return {
    path,
    label: sceneTreeLabel(obj, path),
    nodeType: sceneTreeNodeType(obj),
    children: obj.children.map((child) => buildStudioGltfSceneTreeNode(child)),
  };
}

const RAD_TO_DEG = 180 / Math.PI;

function vec3FromThree(v: THREE.Vector3): StudioGltfVec3 {
  return { x: v.x, y: v.y, z: v.z };
}

function readObjectLocalTransform(obj: THREE.Object3D): StudioGltfObjectDetail["transform"] {
  const euler = new THREE.Euler().setFromQuaternion(obj.quaternion, "XYZ");
  return {
    position: vec3FromThree(obj.position),
    rotationDeg: {
      x: euler.x * RAD_TO_DEG,
      y: euler.y * RAD_TO_DEG,
      z: euler.z * RAD_TO_DEG,
    },
    scale: vec3FromThree(obj.scale),
  };
}

function readOccupiedTextureSlots(mat: THREE.Material): StudioGlbMaterialTextureSlotV1[] {
  const std = mat as THREE.MeshStandardMaterial;
  const out: StudioGlbMaterialTextureSlotV1[] = [];
  for (const slot of STUDIO_GLB_MATERIAL_TEXTURE_SLOTS) {
    const tex = std[slot];
    if (tex != null) {
      out.push(slot);
    }
  }
  return out;
}

function upsertMaterialDetail(
  map: Record<string, StudioGltfMaterialDetail>,
  mat: THREE.Material,
  meshPath: string,
): void {
  const name = typeof mat.name === "string" ? mat.name.trim() : "";
  if (name.length === 0) {
    return;
  }
  const occupied = readOccupiedTextureSlots(mat);
  const std = mat as THREE.MeshStandardMaterial;
  const existing = map[name];
  if (existing == null) {
    map[name] = {
      name,
      usedOnMeshPaths: [meshPath],
      occupiedTextureSlots: [...occupied],
      metalness: typeof std.metalness === "number" ? std.metalness : undefined,
      roughness: typeof std.roughness === "number" ? std.roughness : undefined,
    };
    return;
  }
  if (!existing.usedOnMeshPaths.includes(meshPath)) {
    existing.usedOnMeshPaths.push(meshPath);
  }
  for (const slot of occupied) {
    if (!existing.occupiedTextureSlots.includes(slot)) {
      existing.occupiedTextureSlots.push(slot);
    }
  }
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
      sceneTree: [],
      objectDetailsByPath: {},
      materialDetailsByName: {},
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
  const objectDetailsByPath: Record<string, StudioGltfObjectDetail> = {};
  const materialDetailsByName: Record<string, StudioGltfMaterialDetail> = {};

  scene.updateMatrixWorld(true);

  scene.traverse((obj) => {
    const path = objectPath(obj);
    const morphTargetNames: string[] = [];
    const materialSlotNames: string[] = [];
    const mesh = obj instanceof THREE.Mesh ? obj : null;

    if (mesh != null && mesh.morphTargetDictionary != null) {
      morphTargetNames.push(...Object.keys(mesh.morphTargetDictionary));
    }

    if (mesh != null && mesh.material != null) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat == null) {
          continue;
        }
        const matName = typeof mat.name === "string" ? mat.name.trim() : "";
        if (matName.length > 0) {
          materialSlotNames.push(matName);
          upsertMaterialDetail(materialDetailsByName, mat, path);
        }
      }
    }

    objectDetailsByPath[path] = {
      path,
      nodeType: sceneTreeNodeType(obj),
      transform: readObjectLocalTransform(obj),
      materialSlotNames,
      morphTargetNames,
    };

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

    const isGroup = obj instanceof THREE.Group;
    const isBone = obj instanceof THREE.Bone;

    if ((mesh != null || isGroup || isBone) && isControllablePart(obj)) {
      partRefs.add(objectPath(obj));
    }

    if (mesh != null) {
      for (const matName of materialSlotNames) {
        materialRefs.add(matName);
      }
      if (mesh.morphTargetDictionary != null) {
        const meshKey =
          typeof mesh.name === "string" && mesh.name.trim().length > 0 ? mesh.name.trim() : mesh.uuid;
        for (const morphName of morphTargetNames) {
          morphRefs.add(`${meshKey}:${morphName}`);
        }
      }
    }
  });

  const sceneTree = scene.children.map((child) => buildStudioGltfSceneTreeNode(child));

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
    sceneTree,
    objectDetailsByPath,
    materialDetailsByName,
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
