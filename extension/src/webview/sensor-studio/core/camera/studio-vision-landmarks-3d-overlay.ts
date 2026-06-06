import * as THREE from "three";
import type { VisionLandmarks3dSpec } from "./collect-vision-landmarks-3d-specs";
import { studioVisionLandmarkCache } from "./studio-vision-landmark-cache";
import { readPoseLandmarkConfidence, type PoseLandmarkLike } from "./vision-pose-config";
import { VISION_POSE_SKETCH_CONNECTIONS } from "./vision-pose-sketch";

const PLANE_HEIGHT = 1.6;
const CAMERA_DEPTH = 2.2;
const DEPTH_SCALE = 0.35;

type NodeMeshes = {
  group: THREE.Group;
  lines: THREE.LineSegments;
  points: THREE.Points;
  linePositions: Float32Array;
  pointPositions: Float32Array;
};

function disposeNodeMeshes(meshes: NodeMeshes): void {
  meshes.group.remove(meshes.lines);
  meshes.group.remove(meshes.points);
  meshes.lines.geometry.dispose();
  (meshes.lines.material as THREE.Material).dispose();
  meshes.points.geometry.dispose();
  (meshes.points.material as THREE.Material).dispose();
}

function landmarkToLocal(
  lm: PoseLandmarkLike,
  args: {
    mirror: boolean;
    planeWidth: number;
    minVisibility: number;
  },
): THREE.Vector3 | null {
  const visibility = readPoseLandmarkConfidence(lm);
  if (visibility < args.minVisibility) {
    return null;
  }
  const nxRaw = typeof lm.x === "number" && Number.isFinite(lm.x) ? lm.x : 0;
  const nyRaw = typeof lm.y === "number" && Number.isFinite(lm.y) ? lm.y : 0;
  const nzRaw = typeof lm.z === "number" && Number.isFinite(lm.z) ? lm.z : 0;
  const nx = args.mirror ? 1 - nxRaw : nxRaw;
  const x = (nx - 0.5) * args.planeWidth;
  const y = (0.5 - nyRaw) * PLANE_HEIGHT;
  const z = -CAMERA_DEPTH - nzRaw * DEPTH_SCALE;
  return new THREE.Vector3(x, y, z);
}

class StudioVisionLandmarks3dOverlay {
  private byVisionId = new Map<string, NodeMeshes>();

  sync(camera: THREE.PerspectiveCamera, specs: readonly VisionLandmarks3dSpec[]): void {
    const active = new Set(specs.map((spec) => spec.visionNodeId));
    for (const [visionNodeId, meshes] of this.byVisionId) {
      if (!active.has(visionNodeId)) {
        camera.remove(meshes.group);
        disposeNodeMeshes(meshes);
        this.byVisionId.delete(visionNodeId);
      }
    }

    const aspect = camera.aspect > 0 ? camera.aspect : 1;
    const planeWidth = PLANE_HEIGHT * aspect;

    specs.forEach((spec, index) => {
      let meshes = this.byVisionId.get(spec.visionNodeId);
      if (meshes == null) {
        const linePositions = new Float32Array(VISION_POSE_SKETCH_CONNECTIONS.length * 6);
        const pointPositions = new Float32Array(33 * 3);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
        const pointGeometry = new THREE.BufferGeometry();
        pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
        const lines = new THREE.LineSegments(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: 0x34d399,
            transparent: true,
            opacity: 0.85,
            depthTest: false,
          }),
        );
        const points = new THREE.Points(
          pointGeometry,
          new THREE.PointsMaterial({
            color: 0x6ee7b7,
            size: 0.028,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
          }),
        );
        const group = new THREE.Group();
        group.name = `vision-landmarks-3d:${spec.visionNodeId}`;
        group.renderOrder = 10_000;
        group.add(lines);
        group.add(points);
        camera.add(group);
        meshes = { group, lines, points, linePositions, pointPositions };
        this.byVisionId.set(spec.visionNodeId, meshes);
      }

      meshes.group.position.set(index * 0.08, 0, 0);
      const landmarks = studioVisionLandmarkCache.getLandmarks(spec.visionNodeId);
      const localPoints: Array<THREE.Vector3 | null> =
        landmarks != null && landmarks.length > 0
          ? landmarks.map((lm) =>
              landmarkToLocal(lm, {
                mirror: spec.mirrorPreview,
                planeWidth,
                minVisibility: spec.minVisibility,
              }),
            )
          : [];

      let lineOffset = 0;
      for (const [a, b] of VISION_POSE_SKETCH_CONNECTIONS) {
        const pa = localPoints[a];
        const pb = localPoints[b];
        if (pa != null && pb != null) {
          meshes.linePositions[lineOffset] = pa.x;
          meshes.linePositions[lineOffset + 1] = pa.y;
          meshes.linePositions[lineOffset + 2] = pa.z;
          meshes.linePositions[lineOffset + 3] = pb.x;
          meshes.linePositions[lineOffset + 4] = pb.y;
          meshes.linePositions[lineOffset + 5] = pb.z;
        } else {
          meshes.linePositions[lineOffset] = 0;
          meshes.linePositions[lineOffset + 1] = 0;
          meshes.linePositions[lineOffset + 2] = 0;
          meshes.linePositions[lineOffset + 3] = 0;
          meshes.linePositions[lineOffset + 4] = 0;
          meshes.linePositions[lineOffset + 5] = 0;
        }
        lineOffset += 6;
      }
      meshes.lines.geometry.attributes.position.needsUpdate = true;

      for (let i = 0; i < 33; i += 1) {
        const p = localPoints[i];
        const base = i * 3;
        if (p != null) {
          meshes.pointPositions[base] = p.x;
          meshes.pointPositions[base + 1] = p.y;
          meshes.pointPositions[base + 2] = p.z;
        } else {
          meshes.pointPositions[base] = 0;
          meshes.pointPositions[base + 1] = 0;
          meshes.pointPositions[base + 2] = 0;
        }
      }
      meshes.points.geometry.attributes.position.needsUpdate = true;
    });
  }

  dispose(camera: THREE.Camera): void {
    for (const meshes of this.byVisionId.values()) {
      camera.remove(meshes.group);
      disposeNodeMeshes(meshes);
    }
    this.byVisionId.clear();
  }
}

export const studioVisionLandmarks3dOverlay = new StudioVisionLandmarks3dOverlay();
