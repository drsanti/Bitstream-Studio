import { studioVisionFaceRuntime } from "./studio-vision-face-runtime";
import { studioVisionHandsRuntime } from "./studio-vision-hands-runtime";
import { studioVisionLandmarksDebugRuntime } from "./studio-vision-landmarks-debug-runtime";
import { studioVisionObjectRuntime } from "./studio-vision-object-runtime";
import { studioVisionPoseRuntime } from "./studio-vision-pose-runtime";

export const VISION_INFERENCE_NODE_IDS = new Set([
  "vision-pose",
  "vision-hands",
  "vision-face",
  "vision-object",
  "vision-landmarks-debug",
]);

export type VisionFlowEvalResult = {
  pinValues: Record<string, unknown>;
  triggerEdge: boolean;
};

function readVisionEnabled(
  config: Record<string, unknown>,
  enabledIncoming: unknown,
): boolean {
  return typeof enabledIncoming === "boolean" ? enabledIncoming : config.enabled !== false;
}

export function evaluateVisionFlowNode(args: {
  catalogNodeId: string;
  nodeInstanceId: string;
  config: Record<string, unknown>;
  cameraNodeId: string | null;
  enabledIncoming: unknown;
  nowMs: number;
}): VisionFlowEvalResult | null {
  const enabled = readVisionEnabled(args.config, args.enabledIncoming);
  const tickArgs = {
    nodeId: args.nodeInstanceId,
    config: args.config,
    enabled,
    cameraNodeId: args.cameraNodeId,
    nowMs: args.nowMs,
  };

  switch (args.catalogNodeId) {
    case "vision-pose": {
      const snapshot = studioVisionPoseRuntime.tickNode(tickArgs);
      return {
        triggerEdge: snapshot.triggerEdge,
        pinValues: {
          detected: snapshot.detected,
          score: snapshot.score,
          nose: snapshot.nose,
          leftWrist: snapshot.leftWrist,
          rightWrist: snapshot.rightWrist,
        },
      };
    }
    case "vision-hands": {
      const snapshot = studioVisionHandsRuntime.tickNode(tickArgs);
      return {
        triggerEdge: snapshot.triggerEdge,
        pinValues: {
          detected: snapshot.detected,
          score: snapshot.score,
          leftIndex: snapshot.leftIndex,
          rightIndex: snapshot.rightIndex,
        },
      };
    }
    case "vision-face": {
      const snapshot = studioVisionFaceRuntime.tickNode(tickArgs);
      return {
        triggerEdge: snapshot.triggerEdge,
        pinValues: {
          detected: snapshot.detected,
          score: snapshot.score,
          nose: snapshot.nose,
          leftEye: snapshot.leftEye,
          rightEye: snapshot.rightEye,
        },
      };
    }
    case "vision-object": {
      const snapshot = studioVisionObjectRuntime.tickNode(tickArgs);
      return {
        triggerEdge: snapshot.triggerEdge,
        pinValues: {
          detected: snapshot.detected,
          count: snapshot.count,
          label: snapshot.label,
          score: snapshot.score,
        },
      };
    }
    case "vision-landmarks-debug": {
      const snapshot = studioVisionLandmarksDebugRuntime.tickNode(tickArgs);
      return {
        triggerEdge: false,
        pinValues: {
          count: snapshot.count,
          json: snapshot.json,
        },
      };
    }
    default:
      return null;
  }
}

export function isVisionInferenceNodeId(nodeId: string): boolean {
  return VISION_INFERENCE_NODE_IDS.has(nodeId);
}
