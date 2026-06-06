import { studioCameraRuntime } from "./studio-camera-runtime";
import {
  detectPoseLandmarkerForVideo,
  resetVisionMediapipeRuntimeCaches,
} from "./studio-vision-mediapipe";
import { studioVisionLandmarkCache } from "./studio-vision-landmark-cache";
import { studioVisionPoseWorkerBridge } from "./studio-vision-pose-worker-bridge";
import { visionMinInferIntervalMs } from "./studio-vision-runtime-utils";
import { getVisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import {
  emptyVisionLandmarksDebugSnapshot,
  readVisionLandmarksDebugConfig,
  type VisionLandmarksDebugConfig,
  type VisionLandmarksDebugSnapshot,
} from "./vision-landmarks-debug-config";
import { serializePoseLandmarksCompact } from "./vision-landmarks-serialize";
import type { PoseLandmarkLike } from "./vision-pose-config";

type NodeRuntimeState = {
  config: VisionLandmarksDebugConfig;
  cameraNodeId: string;
  lastInferMs: number;
  inferInFlight: boolean;
  snapshot: VisionLandmarksDebugSnapshot;
};

class StudioVisionLandmarksDebugRuntime {
  private nodeById = new Map<string, NodeRuntimeState>();
  private workerBackendDisabled = false;

  private ensureNodeState(nodeId: string): NodeRuntimeState {
    let st = this.nodeById.get(nodeId);
    if (st == null) {
      st = {
        config: readVisionLandmarksDebugConfig({}),
        cameraNodeId: "",
        lastInferMs: 0,
        inferInFlight: false,
        snapshot: emptyVisionLandmarksDebugSnapshot("idle"),
      };
      this.nodeById.set(nodeId, st);
    }
    return st;
  }

  getSnapshot(nodeId: string): VisionLandmarksDebugSnapshot {
    return this.ensureNodeState(nodeId).snapshot;
  }

  releaseNode(nodeId: string): void {
    this.nodeById.delete(nodeId);
    studioVisionLandmarkCache.releaseNode(nodeId);
  }

  tickNode(args: {
    nodeId: string;
    config: Record<string, unknown>;
    enabled: boolean;
    cameraNodeId: string | null;
    nowMs: number;
  }): VisionLandmarksDebugSnapshot {
    const st = this.ensureNodeState(args.nodeId);
    const config = readVisionLandmarksDebugConfig(args.config);
    config.enabled = args.enabled;
    st.config = config;

    if (!config.enabled || args.cameraNodeId == null || args.cameraNodeId.length === 0) {
      st.cameraNodeId = "";
      st.snapshot = emptyVisionLandmarksDebugSnapshot("idle");
      studioVisionLandmarkCache.setLandmarks(args.nodeId, undefined);
      return st.snapshot;
    }

    st.cameraNodeId = args.cameraNodeId;
    const video = studioCameraRuntime.getVideoElement(args.cameraNodeId);
    const camUi = studioCameraRuntime.getCameraUiState(args.cameraNodeId);
    if (video == null || camUi.status !== "active") {
      st.snapshot = emptyVisionLandmarksDebugSnapshot("idle");
      studioVisionLandmarkCache.setLandmarks(args.nodeId, undefined);
      return st.snapshot;
    }

    if (st.snapshot.status === "idle" || st.snapshot.status === "error") {
      st.snapshot = { ...st.snapshot, status: "loading" };
    }

    const minIntervalMs = visionMinInferIntervalMs(config.targetFps);
    if (!st.inferInFlight && args.nowMs - st.lastInferMs >= minIntervalMs) {
      st.inferInFlight = true;
      void this.runInference(args.nodeId, st, video, args.nowMs, config);
    }

    return st.snapshot;
  }

  private useWorkerBackend(config: VisionLandmarksDebugConfig): boolean {
    if (this.workerBackendDisabled) {
      return false;
    }
    return config.inferenceBackend === "worker";
  }

  private recoverFromWorkerFailure(): void {
    resetVisionMediapipeRuntimeCaches();
    studioVisionPoseWorkerBridge.release();
  }

  private async inferPose(
    config: VisionLandmarksDebugConfig,
    video: HTMLVideoElement,
  ): Promise<readonly PoseLandmarkLike[] | undefined> {
    const detectOptions = {
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    if (this.useWorkerBackend(config)) {
      try {
        const endpoints = getVisionMediapipeEndpoints();
        await studioVisionPoseWorkerBridge.ensureReady({
          endpoints,
          modelVariant: "lite",
          minDetectionConfidence: detectOptions.minDetectionConfidence,
          minTrackingConfidence: detectOptions.minTrackingConfidence,
        });
        return studioVisionPoseWorkerBridge.inferFromVideoFrame(video);
      } catch {
        this.workerBackendDisabled = true;
        this.recoverFromWorkerFailure();
      }
    }
    const result = await detectPoseLandmarkerForVideo("lite", detectOptions, video);
    return result.landmarks?.[0];
  }

  private async runInference(
    nodeId: string,
    st: NodeRuntimeState,
    video: HTMLVideoElement,
    nowMs: number,
    config: VisionLandmarksDebugConfig,
  ): Promise<void> {
    try {
      const landmarks = await this.inferPose(config, video);
      if (!this.nodeById.has(nodeId)) {
        return;
      }
      const serialized = serializePoseLandmarksCompact({
        landmarks,
        maxPoints: config.maxPoints,
      });
      studioVisionLandmarkCache.setLandmarks(nodeId, landmarks);
      st.snapshot = {
        status: "ready",
        count: serialized.count,
        json: serialized.json,
      };
      st.lastInferMs = nowMs;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/wasm|fetch|404|timed out|bundled|model/i.test(message)) {
        this.recoverFromWorkerFailure();
      }
      st.snapshot = emptyVisionLandmarksDebugSnapshot("error", message);
      studioVisionLandmarkCache.setLandmarks(nodeId, undefined);
    } finally {
      st.inferInFlight = false;
    }
  }
}

export const studioVisionLandmarksDebugRuntime = new StudioVisionLandmarksDebugRuntime();
