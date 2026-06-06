import {
  readMinSketchVisibility,
  resolveVisionVideoBusWire,
  type VisionPoseSketchSpec,
} from "./collect-vision-pose-sketches";

export type VisionLandmarks3dSpec = VisionPoseSketchSpec;

function readDrawLandmarks3d(cfg: Record<string, unknown>): boolean {
  return cfg.drawLandmarks3d === true;
}

export function collectVisionLandmarks3dSpecs(
  nodes: readonly {
    id: string;
    data: {
      nodeId: string;
      defaultConfig: Record<string, unknown>;
      liveVideoBusWire?: import("./flow-wire-video").FlowWireVideoBusV1;
    };
  }[],
  edges?: readonly {
    source: string;
    target: string;
    targetHandle?: string | null;
    sourceHandle?: string | null;
  }[],
): VisionLandmarks3dSpec[] {
  const specs: VisionLandmarks3dSpec[] = [];
  for (const node of nodes) {
    const catalogId = node.data.nodeId;
    if (catalogId !== "vision-pose" && catalogId !== "vision-landmarks-debug") {
      continue;
    }
    const cfg = node.data.defaultConfig;
    if (!readDrawLandmarks3d(cfg)) {
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

export function graphHasVisionLandmarks3d(
  nodes: readonly { data: { nodeId: string; defaultConfig: Record<string, unknown> } }[],
): boolean {
  return nodes.some((node) => {
    const id = node.data.nodeId;
    if (id !== "vision-pose" && id !== "vision-landmarks-debug") {
      return false;
    }
    return readDrawLandmarks3d(node.data.defaultConfig);
  });
}
