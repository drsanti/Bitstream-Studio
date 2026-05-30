/**
 * Offline GLB inspector for Project 4 — prints hierarchy, mesh stats, materials,
 * animations, and checks names expected by PROJECT_INFO.md.
 *
 * Run from extension repo root:
 *   npx tsx src/webview/project4/scripts/analyze-glb.ts
 *   npx tsx src/webview/project4/scripts/analyze-glb.ts path/to/other.glb
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Names documented in `project4/PROJECT_INFO.md` for twin lookups. */
const EXPECTED_NAMED_OBJECTS = [
  "Body",
  "Ultrasonic_F",
  "Ultrasonic_R",
  "Wheel_FL",
  "Wheel_FR",
  "Wheel_RL",
  "Wheel_RR",
  "Ground",
] as const;

/** Matches extension-wide asset layout (`vite` **serve-extension-local-assets**). */
const DEFAULT_GLB_REL = path.join(
  "src",
  "assets",
  "models",
  "robot-4th-project",
  "robot-4th-project.glb",
);

interface MeshStatRow {
  name: string;
  vertices: number;
  triangles: number;
  materials: string;
  boxSize: string;
}

function parseGlb(buffer: ArrayBuffer): Promise<{
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      "",
      (gltf) => {
        resolve({ scene: gltf.scene, animations: gltf.animations });
      },
      (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

function countTriangles(geometry: THREE.BufferGeometry): number {
  const idx = geometry.index;
  if (idx) {
    return Math.floor(idx.count / 3);
  }
  const pos = geometry.attributes.position;
  return pos ? Math.floor(pos.count / 3) : 0;
}

function formatVec3(v: THREE.Vector3): string {
  return `${v.x.toFixed(4)} × ${v.y.toFixed(4)} × ${v.z.toFixed(4)}`;
}

function collectNamedObjects(root: THREE.Object3D): Map<string, THREE.Object3D> {
  const byName = new Map<string, THREE.Object3D>();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj.name && obj.name.length > 0) {
      const prev = byName.get(obj.name);
      if (prev && prev !== obj) {
        console.warn(
          `[warn] Duplicate object name "${obj.name}" — keeping first occurrence.`,
        );
      } else if (!prev) {
        byName.set(obj.name, obj);
      }
    }
  });
  return byName;
}

function meshMaterialLabel(mesh: THREE.Mesh): string {
  const mats = mesh.material;
  if (Array.isArray(mats)) {
    return mats
      .map((m) =>
        "name" in m && m.name ? m.name : m.type ?? "unnamed",
      )
      .join(", ");
  }
  const m = mats;
  return "name" in m && m.name ? m.name : m.type ?? "unnamed";
}

function collectMeshStats(root: THREE.Object3D): MeshStatRow[] {
  const rows: MeshStatRow[] = [];
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const geom = obj.geometry;
    if (!geom) {
      return;
    }
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    rows.push({
      name: obj.name.length > 0 ? obj.name : "(unnamed mesh)",
      vertices: geom.attributes.position?.count ?? 0,
      triangles: countTriangles(geom),
      materials: meshMaterialLabel(obj),
      boxSize: formatVec3(size),
    });
  });
  return rows;
}

function printTree(obj: THREE.Object3D, depth: number): void {
  const pad = "  ".repeat(depth);
  let suffix = "";
  if (obj instanceof THREE.Mesh) {
    const g = obj.geometry;
    const vc = g.attributes.position?.count ?? 0;
    suffix = ` [Mesh vertices=${vc}]`;
  }
  const label = obj.name.length > 0 ? `"${obj.name}"` : "(no name)";
  console.log(`${pad}${obj.type} ${label}${suffix}`);
  for (const child of obj.children) {
    printTree(child, depth + 1);
  }
}

async function main(): Promise<void> {
  const argPath = process.argv[2];
  const glbPath = path.resolve(
    process.cwd(),
    argPath ?? DEFAULT_GLB_REL,
  );

  if (!fs.existsSync(glbPath)) {
    console.error(`File not found: ${glbPath}`);
    process.exitCode = 1;
    return;
  }

  const buf = fs.readFileSync(glbPath);
  console.log(`File: ${glbPath}`);
  console.log(`Size: ${buf.length} bytes\n`);

  let scene: THREE.Object3D;
  let animations: THREE.AnimationClip[];
  try {
    const parsed = await parseGlb(buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ));
    scene = parsed.scene;
    animations = parsed.animations;
  } catch (e) {
    console.error("Failed to parse GLB:", e);
    process.exitCode = 1;
    return;
  }

  const rootBox = new THREE.Box3().setFromObject(scene);
  const rootSize = new THREE.Vector3();
  rootBox.getSize(rootSize);
  console.log("Scene root AABB size (world):", formatVec3(rootSize));
  console.log("");

  console.log("--- Hierarchy ---");
  printTree(scene, 0);
  console.log("");

  console.log("--- Animations ---");
  if (animations.length === 0) {
    console.log("(none)");
  } else {
    for (const clip of animations) {
      console.log(
        `- "${clip.name}" duration=${clip.duration.toFixed(3)}s tracks=${clip.tracks.length}`,
      );
    }
  }
  console.log("");

  const named = collectNamedObjects(scene);
  console.log("--- Named objects (unique names) ---");
  const sortedNames = [...named.keys()].sort((a, b) => a.localeCompare(b));
  if (sortedNames.length === 0) {
    console.log("(no named objects)");
  } else {
    for (const n of sortedNames) {
      const obj = named.get(n);
      if (!obj) {
        continue;
      }
      console.log(`- ${n} (${obj.type})`);
    }
  }
  console.log("");

  console.log("--- PROJECT_INFO.md contract check ---");
  const foundSet = new Set(named.keys());
  const missing = EXPECTED_NAMED_OBJECTS.filter((n) => !foundSet.has(n));
  const unexpected = sortedNames.filter(
    (n) =>
      !EXPECTED_NAMED_OBJECTS.includes(
        n as (typeof EXPECTED_NAMED_OBJECTS)[number],
      ),
  );
  if (missing.length === 0) {
    console.log("All expected names present.");
  } else {
    console.log("Missing expected names:");
    for (const n of missing) {
      console.log(`  - ${n}`);
    }
  }
  if (unexpected.length > 0) {
    console.log("Other named objects (not in expected list):");
    for (const n of unexpected) {
      console.log(`  - ${n}`);
    }
  }
  console.log("");

  console.log("--- Mesh inventory ---");
  const meshRows = collectMeshStats(scene);
  if (meshRows.length === 0) {
    console.log("(no meshes)");
  } else {
    for (const row of meshRows) {
      console.log(
        `[${row.name}] verts=${row.vertices} tris=${row.triangles} size=${row.boxSize} mat=${row.materials}`,
      );
    }
  }
}

void main();
