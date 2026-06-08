import * as THREE from "three";
import {
  coerceFlowWireMeshV1,
  type FlowWireMeshV1,
} from "../../features/editor/nodes/mesh/flow-wire-mesh";
import type { FlowWireMaterialV1 } from "../../features/editor/nodes/material/flow-wire-material";
import { applyFlowWireTransformToObject3D } from "./studio-viewport-stage-multi-models";
import type { StageMeshEntryV1 } from "../stage/stage-mesh-entry";

export type StageProceduralMeshRuntimeState = {
  layoutKey: string;
  group: THREE.Group;
};

export function createStageProceduralMeshRuntimeState(): StageProceduralMeshRuntimeState {
  const group = new THREE.Group();
  group.name = "StageProceduralMeshes";
  return { layoutKey: "", group };
}

function disposeMeshMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    for (const m of material) {
      m.dispose?.();
    }
    return;
  }
  material.dispose?.();
}

export function disposeStageProceduralMeshRuntime(state: StageProceduralMeshRuntimeState): void {
  while (state.group.children.length > 0) {
    const child = state.group.children[0]!;
    state.group.remove(child);
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose?.();
    if (mesh.material != null) {
      disposeMeshMaterial(mesh.material);
    }
  }
  state.layoutKey = "";
}

export function stageProceduralMeshesLayoutKey(
  entries: readonly StageMeshEntryV1[],
): string {
  return entries
    .map((entry) => {
      const wire = coerceFlowWireMeshV1(entry.wire);
      const leafKey = entry.meshLeafIndex != null ? `:${entry.meshLeafIndex}` : "";
      return wire == null
        ? `${entry.sourceNodeId}${leafKey}:invalid`
        : `${entry.sourceNodeId}${leafKey}:${JSON.stringify(wire)}`;
    })
    .join("\u0000");
}

function parseHexColor(hex: string, fallback: number): number {
  const trimmed = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return fallback;
  }
  return Number.parseInt(trimmed.slice(1), 16);
}

function threeMaterialFromWire(
  wire: FlowWireMaterialV1 | undefined,
): THREE.Material {
  if (wire == null) {
    return new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.5,
      metalness: 0,
    });
  }
  const color = parseHexColor(wire.colorHex, 0xffffff);
  const transparent = wire.opacity < 0.999;
  if (wire.kind === "basic") {
    return new THREE.MeshBasicMaterial({
      color,
      opacity: wire.opacity,
      transparent,
      wireframe: wire.wireframe === true,
    });
  }
  if (wire.kind === "toon") {
    return new THREE.MeshToonMaterial({
      color,
      opacity: wire.opacity,
      transparent,
      wireframe: wire.wireframe === true,
    });
  }
  if (wire.kind === "normal") {
    return new THREE.MeshNormalMaterial({
      opacity: wire.opacity,
      transparent,
      wireframe: wire.wireframe === true,
    });
  }
  if (wire.kind === "physical") {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: wire.roughness ?? 0.5,
      metalness: wire.metalness ?? 0,
      opacity: wire.opacity,
      transparent,
      clearcoat: wire.clearcoat ?? 0,
      clearcoatRoughness: wire.clearcoatRoughness ?? 0,
      transmission: wire.transmission ?? 0,
    });
  }
  return new THREE.MeshStandardMaterial({
    color,
    roughness: wire.roughness ?? 0.5,
    metalness: wire.metalness ?? 0,
    opacity: wire.opacity,
    transparent,
  });
}

function geometryFromWire(wire: FlowWireMeshV1): THREE.BufferGeometry | null {
  if (wire.kind === "box" && wire.box != null) {
    return new THREE.BoxGeometry(wire.box.width, wire.box.height, wire.box.depth);
  }
  if (wire.kind === "sphere" && wire.sphere != null) {
    return new THREE.SphereGeometry(
      wire.sphere.radius,
      wire.sphere.widthSegments,
      wire.sphere.heightSegments,
    );
  }
  if (wire.kind === "plane" && wire.plane != null) {
    return new THREE.PlaneGeometry(wire.plane.width, wire.plane.height);
  }
  if (wire.kind === "cylinder" && wire.cylinder != null) {
    return new THREE.CylinderGeometry(
      wire.cylinder.radiusTop,
      wire.cylinder.radiusBottom,
      wire.cylinder.height,
      wire.cylinder.radialSegments,
    );
  }
  if (wire.kind === "cone" && wire.cone != null) {
    return new THREE.ConeGeometry(
      wire.cone.radius,
      wire.cone.height,
      wire.cone.radialSegments,
    );
  }
  if (wire.kind === "torus" && wire.torus != null) {
    return new THREE.TorusGeometry(
      wire.torus.radius,
      wire.torus.tube,
      wire.torus.radialSegments,
      wire.torus.tubularSegments,
    );
  }
  if (wire.kind === "capsule" && wire.capsule != null) {
    return new THREE.CapsuleGeometry(
      wire.capsule.radius,
      wire.capsule.length,
      wire.capsule.capSegments,
      wire.capsule.radialSegments,
    );
  }
  return null;
}

function stageObjectPathForEntry(entry: StageMeshEntryV1): string {
  if (entry.meshLeafIndex != null) {
    return `proc:${entry.sourceNodeId}:${entry.meshLeafIndex}`;
  }
  return `proc:${entry.sourceNodeId}`;
}

export function syncStageProceduralMeshes(args: {
  parent: THREE.Object3D;
  state: StageProceduralMeshRuntimeState;
  entries: readonly StageMeshEntryV1[] | undefined;
  shadowsEnabled: boolean;
  /** Keep the current mesh pool while the Stage gizmo is dragging (avoid fighting TransformControls). */
  freezeLayoutWhileGizmoDrag?: boolean;
}): THREE.Group {
  const entries = args.entries ?? [];
  const nextKey = stageProceduralMeshesLayoutKey(entries);

  if (nextKey === args.state.layoutKey && args.state.group.parent === args.parent) {
    return args.state.group;
  }

  if (
    args.freezeLayoutWhileGizmoDrag === true &&
    args.state.group.parent === args.parent &&
    args.state.layoutKey.length > 0
  ) {
    return args.state.group;
  }

  if (args.state.group.parent != null) {
    args.state.group.parent.remove(args.state.group);
  }
  disposeStageProceduralMeshRuntime(args.state);
  args.state.layoutKey = nextKey;

  for (const entry of entries) {
    const wire = coerceFlowWireMeshV1(entry.wire);
    if (wire == null) {
      continue;
    }
    const geometry = geometryFromWire(wire);
    if (geometry == null) {
      continue;
    }
    const material = threeMaterialFromWire(wire.material);
    const mesh = new THREE.Mesh(geometry, material);
    const label =
      entry.label.trim().length > 0 ? entry.label.trim() : entry.sourceNodeId;
    mesh.name = label;
    mesh.userData.stageSourceNodeId = entry.sourceNodeId;
    mesh.userData.stageObjectPath = stageObjectPathForEntry(entry);
    applyFlowWireTransformToObject3D(mesh, wire.transform);
    mesh.castShadow = args.shadowsEnabled;
    mesh.receiveShadow = args.shadowsEnabled;
    args.state.group.add(mesh);
  }

  args.parent.add(args.state.group);
  return args.state.group;
}
