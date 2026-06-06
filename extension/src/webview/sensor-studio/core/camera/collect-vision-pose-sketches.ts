import type { FlowWireVideoBusV1 } from "./flow-wire-video";
import { isFlowWireVideoBusV1, makeFlowWireVideoBusV1 } from "./flow-wire-video";

export type VisionPoseSketchSpec = {
  visionNodeId: string;
  cameraNodeId: string;
  mirrorPreview: boolean;
  minVisibility: number;
};

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveVideoBusWire?: FlowWireVideoBusV1;
  };
};

type FlowEdgeLike = {
  source: string;
  target: string;
  targetHandle?: string | null;
  sourceHandle?: string | null;
};

export function resolveVisionVideoBusWire(
  node: FlowNodeLike,
  nodes: readonly FlowNodeLike[],
  edges?: readonly FlowEdgeLike[],
): FlowWireVideoBusV1 | null {
  const live = node.data.liveVideoBusWire;
  if (isFlowWireVideoBusV1(live)) {
    return live;
  }
  if (edges == null) {
    return null;
  }
  const inEdge = edges.find(
    (edge) => edge.target === node.id && (edge.targetHandle === "in" || edge.targetHandle == null),
  );
  if (inEdge == null) {
    return null;
  }
  const sourceNode = nodes.find((candidate) => candidate.id === inEdge.source);
  if (sourceNode == null) {
    return null;
  }
  if (sourceNode.data.nodeId === "camera-input") {
    return makeFlowWireVideoBusV1(sourceNode.id);
  }
  if (sourceNode.data.nodeId === "video-texture") {
    const texEdge = edges.find(
      (edge) =>
        edge.target === sourceNode.id && (edge.targetHandle === "in" || edge.targetHandle == null),
    );
    const camNode = texEdge != null ? nodes.find((n) => n.id === texEdge.source) : null;
    if (camNode != null && camNode.data.nodeId === "camera-input") {
      return makeFlowWireVideoBusV1(camNode.id);
    }
  }
  return null;
}

function readDrawSketchOverlay(cfg: Record<string, unknown>): boolean {
  return cfg.drawSketchOverlay !== false;
}

export function readMinSketchVisibility(cfg: Record<string, unknown>): number {
  const raw = cfg.minSketchVisibility;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return 0.35;
  }
  return Math.max(0, Math.min(1, n));
}

export function collectVisionPoseSketchSpecs(
  nodes: readonly FlowNodeLike[],
  edges?: readonly FlowEdgeLike[],
): VisionPoseSketchSpec[] {
  const specs: VisionPoseSketchSpec[] = [];
  for (const node of nodes) {
    const catalogId = node.data.nodeId;
    if (catalogId !== "vision-pose" && catalogId !== "vision-landmarks-debug") {
      continue;
    }
    const cfg = node.data.defaultConfig;
    if (!readDrawSketchOverlay(cfg)) {
      continue;
    }
    const bus = resolveVisionVideoBusWire(node, nodes, edges);
    if (bus == null) {
      continue;
    }
    const cameraNode = nodes.find((n) => n.id === bus.sourceNodeId);
    const camCfg = cameraNode?.data.defaultConfig ?? {};
    specs.push({
      visionNodeId: node.id,
      cameraNodeId: bus.sourceNodeId,
      mirrorPreview: camCfg.mirrorPreview !== false,
      minVisibility: readMinSketchVisibility(cfg),
    });
  }
  return specs;
}

export function collectVisionPoseSketchSpecsForCamera(
  nodes: readonly FlowNodeLike[],
  cameraNodeId: string,
  edges?: readonly FlowEdgeLike[],
): VisionPoseSketchSpec[] {
  return collectVisionPoseSketchSpecs(nodes, edges).filter(
    (spec) => spec.cameraNodeId === cameraNodeId,
  );
}

export function graphHasVisionPoseSketch(nodes: readonly { data: { nodeId: string; defaultConfig: Record<string, unknown> } }[]): boolean {
  return nodes.some((node) => {
    const id = node.data.nodeId;
    if (id !== "vision-pose" && id !== "vision-landmarks-debug") {
      return false;
    }
    return readDrawSketchOverlay(node.data.defaultConfig);
  });
}
