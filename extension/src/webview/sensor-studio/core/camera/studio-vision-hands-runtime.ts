import { studioCameraRuntime } from "./studio-camera-runtime";
import {
  detectHandLandmarkerForVideo,
  resetVisionMediapipeRuntimeCaches,
} from "./studio-vision-mediapipe";
import {
  studioVisionHandsWorkerBridge,
} from "./studio-vision-expansion-worker-bridge";
import {
  applyVisionDetectionEdge,
  consumeVisionTriggerEdge,
  visionMinInferIntervalMs,
} from "./studio-vision-runtime-utils";
import { getVisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import {
  emptyVisionHandsSnapshot,
  mapHandLandmarksToSnapshot,
  readVisionHandsConfig,
  type VisionHandsConfig,
  type VisionHandsSnapshot,
} from "./vision-hands-config";

type NodeRuntimeState = {
  config: VisionHandsConfig;
  cameraNodeId: string;
  lastInferMs: number;
  inferInFlight: boolean;
  wasDetected: boolean;
  pendingTriggerEdge: boolean;
  snapshot: VisionHandsSnapshot;
};

class StudioVisionHandsRuntime {
  private nodeById = new Map<string, NodeRuntimeState>();
  private workerBackendDisabled = false;

  private ensureNodeState(nodeId: string): NodeRuntimeState {
    let st = this.nodeById.get(nodeId);
    if (st == null) {
      st = {
        config: readVisionHandsConfig({}),
        cameraNodeId: "",
        lastInferMs: 0,
        inferInFlight: false,
        wasDetected: false,
        pendingTriggerEdge: false,
        snapshot: emptyVisionHandsSnapshot("idle"),
      };
      this.nodeById.set(nodeId, st);
    }
    return st;
  }

  getSnapshot(nodeId: string): VisionHandsSnapshot {
    return this.ensureNodeState(nodeId).snapshot;
  }

  releaseNode(nodeId: string): void {
    this.nodeById.delete(nodeId);
  }

  tickNode(args: {
    nodeId: string;
    config: Record<string, unknown>;
    enabled: boolean;
    cameraNodeId: string | null;
    nowMs: number;
  }): VisionHandsSnapshot {
    const st = this.ensureNodeState(args.nodeId);
    const config = readVisionHandsConfig(args.config);
    config.enabled = args.enabled;
    st.config = config;

    if (!config.enabled || args.cameraNodeId == null || args.cameraNodeId.length === 0) {
      st.cameraNodeId = "";
      st.snapshot = emptyVisionHandsSnapshot("idle");
      st.wasDetected = false;
      return consumeVisionTriggerEdge(st);
    }

    st.cameraNodeId = args.cameraNodeId;
    const video = studioCameraRuntime.getVideoElement(args.cameraNodeId);
    const camUi = studioCameraRuntime.getCameraUiState(args.cameraNodeId);
    if (video == null || camUi.status !== "active") {
      st.snapshot = emptyVisionHandsSnapshot("idle");
      st.wasDetected = false;
      return consumeVisionTriggerEdge(st);
    }

    if (st.snapshot.status === "idle" || st.snapshot.status === "error") {
      st.snapshot = { ...st.snapshot, status: "loading" };
    }

    const minIntervalMs = visionMinInferIntervalMs(config.targetFps);
    if (!st.inferInFlight && args.nowMs - st.lastInferMs >= minIntervalMs) {
      st.inferInFlight = true;
      void this.runInference(args.nodeId, st, video, args.nowMs, config);
    }

    return consumeVisionTriggerEdge(st);
  }

  private useWorkerBackend(config: VisionHandsConfig): boolean {
    if (this.workerBackendDisabled) {
      return false;
    }
    return config.inferenceBackend === "worker";
  }

  private recoverFromWorkerFailure(): void {
    resetVisionMediapipeRuntimeCaches();
    studioVisionHandsWorkerBridge.release();
  }

  private async runInference(
    nodeId: string,
    st: NodeRuntimeState,
    video: HTMLVideoElement,
    nowMs: number,
    config: VisionHandsConfig,
  ): Promise<void> {
    try {
      let landmarks: ReadonlyArray<readonly import("./vision-pose-config").PoseLandmarkLike[]> | undefined;
      let handedness: ReadonlyArray<readonly { categoryName?: string; score?: number }[]> | undefined;

      if (this.useWorkerBackend(config)) {
        try {
          const endpoints = getVisionMediapipeEndpoints();
          await studioVisionHandsWorkerBridge.ensureReady({
            endpoints,
            minDetectionConfidence: config.minDetectionConfidence,
            maxResults: 2,
            scoreThreshold: 0,
          });
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const payload = await studioVisionHandsWorkerBridge.inferFromVideoFrame(video);
          landmarks = payload.landmarks;
          handedness = payload.handedness;
        } catch {
          this.workerBackendDisabled = true;
          this.recoverFromWorkerFailure();
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const result = await detectHandLandmarkerForVideo(
            { minDetectionConfidence: config.minDetectionConfidence },
            video,
          );
          landmarks = result.landmarks;
          handedness = result.handedness;
        }
      } else {
        const result = await detectHandLandmarkerForVideo(
          { minDetectionConfidence: config.minDetectionConfidence },
          video,
        );
        if (!this.nodeById.has(nodeId)) {
          return;
        }
        landmarks = result.landmarks;
        handedness = result.handedness;
      }

      const mapped = mapHandLandmarksToSnapshot({
        landmarks,
        handedness,
        minDetectionConfidence: config.minDetectionConfidence,
      });
      const edge = applyVisionDetectionEdge({
        prevDetected: st.wasDetected,
        nextDetected: mapped.detected,
        triggerOnEnter: config.triggerOnEnter,
        triggerOnExit: config.triggerOnExit,
        pendingTriggerEdge: st.pendingTriggerEdge,
      });
      st.wasDetected = edge.wasDetected;
      st.pendingTriggerEdge = edge.pendingTriggerEdge;
      st.snapshot = {
        status: "ready",
        detected: mapped.detected,
        score: mapped.score,
        leftIndex: mapped.leftIndex,
        rightIndex: mapped.rightIndex,
        triggerEdge: false,
      };
      st.lastInferMs = nowMs;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/wasm|fetch|404|timed out|bundled|model/i.test(message)) {
        this.recoverFromWorkerFailure();
      }
      st.snapshot = emptyVisionHandsSnapshot("error", message);
      st.wasDetected = false;
    } finally {
      st.inferInFlight = false;
    }
  }
}

export const studioVisionHandsRuntime = new StudioVisionHandsRuntime();
