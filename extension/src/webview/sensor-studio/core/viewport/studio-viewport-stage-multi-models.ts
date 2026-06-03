import * as THREE from "three";
import {
  isFlowWireTransformV1,
  type FlowWireTransformV1,
} from "../../features/editor/nodes/transform/flow-wire-transform";
import type { EmbeddedRigPolicy } from "../scene3d/scene3d-config";
import { frameStudioViewportCamera } from "./studio-viewport-camera";

/** One GLB committed to the Stage workbench (Scene Output **Models** wires). */
export type StageViewportModelInstance = {
  modelUrl: string;
  studioAssetId?: string;
  sourceNodeId?: string;
  transformWire?: FlowWireTransformV1 | null | unknown;
};

export function applyFlowWireTransformToObject3D(
  obj: THREE.Object3D,
  wire: FlowWireTransformV1 | null | undefined | unknown,
): void {
  if (!isFlowWireTransformV1(wire)) {
    return;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  obj.position.set(wire.position.x, wire.position.y, wire.position.z);
  obj.rotation.set(
    toRad(wire.rotationDeg.x),
    toRad(wire.rotationDeg.y),
    toRad(wire.rotationDeg.z),
  );
  obj.scale.set(wire.scale.x, wire.scale.y, wire.scale.z);
}

export function stageMultiModelsLoadKey(
  instances: readonly StageViewportModelInstance[],
  embeddedRigPolicy: EmbeddedRigPolicy,
): string {
  const body = instances
    .map((i) => `${i.modelUrl}\u0001${i.studioAssetId ?? ""}`)
    .join("\u0000");
  return `${body}\u0000${embeddedRigPolicy}`;
}

/** Spread loaded roots along +X using each mesh bounding box (keeps GLB Y/Z as authored). */
export function layoutStageModelRootsAlongX(
  roots: readonly THREE.Object3D[],
  gapMeters = 0.35,
): void {
  let cursorX = 0;
  for (const root of roots) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    root.position.set(cursorX - center.x, root.position.y, root.position.z - center.z);
    cursorX += Math.max(1e-4, size.x) + gapMeters;
  }
}

/** Frame orbit camera on one root or a temporary union of several roots. */
export type StageViewportPickDetail = {
  button: number;
  modelIndex: number;
  sourceNodeId: string;
  hitPoint: { x: number; y: number; z: number };
  objectPath: string;
};

function objectPathUnderRoot(hit: THREE.Object3D, modelRoot: THREE.Object3D): string {
  const parts: string[] = [];
  let cur: THREE.Object3D | null = hit;
  while (cur != null && cur !== modelRoot) {
    const name = typeof cur.name === "string" ? cur.name.trim() : "";
    if (name.length > 0) {
      parts.unshift(name);
    }
    cur = cur.parent;
  }
  return parts.length > 0 ? parts.join("/") : "(mesh)";
}

/** Raycast pick on Stage canvas → Domain C (**on-stage-pick**). */
export function bindStageViewportPickHandler(params: {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  getPickTargets: () => Array<{
    root: THREE.Object3D;
    modelIndex: number;
    sourceNodeId: string;
  }>;
  onPick: (detail: StageViewportPickDetail) => void;
}): () => void {
  const { canvas, camera, getPickTargets, onPick } = params;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 2) {
      return;
    }
    const targets = getPickTargets();
    if (targets.length === 0) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const roots = targets.map((t) => t.root);
    const hits = raycaster.intersectObjects(roots, true);
    if (hits.length === 0) {
      return;
    }
    const first = hits[0]!;
    let hitObj: THREE.Object3D | null = first.object;
    while (hitObj != null) {
      const match = targets.find((t) => t.root === hitObj || hitObj!.uuid === t.root.uuid);
      if (match != null) {
        const pt = first.point;
        onPick({
          button: event.button,
          modelIndex: match.modelIndex,
          sourceNodeId: match.sourceNodeId,
          hitPoint: { x: pt.x, y: pt.y, z: pt.z },
          objectPath: objectPathUnderRoot(first.object, match.root),
        });
        return;
      }
      hitObj = hitObj.parent;
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  return () => canvas.removeEventListener("pointerdown", onPointerDown);
}

export function frameStudioViewportOnModelRoots(params: {
  camera: THREE.PerspectiveCamera;
  controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  roots: readonly THREE.Object3D[];
  margin?: number;
}): void {
  const { camera, controls, roots, margin } = params;
  if (roots.length === 0) {
    return;
  }
  if (roots.length === 1) {
    frameStudioViewportCamera({ camera, controls, object: roots[0]!, margin });
    return;
  }
  const union = new THREE.Group();
  for (const r of roots) {
    union.add(r);
  }
  frameStudioViewportCamera({ camera, controls, object: union, margin });
}
