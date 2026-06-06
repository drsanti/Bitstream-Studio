import { studioCameraRuntime } from "./studio-camera-runtime";
import {
  detectFaceLandmarkerForVideo,
  resetVisionMediapipeRuntimeCaches,
} from "./studio-vision-mediapipe";
import { studioVisionFaceWorkerBridge } from "./studio-vision-expansion-worker-bridge";
import {
  applyVisionDetectionEdge,
  consumeVisionTriggerEdge,
  visionMinInferIntervalMs,
} from "./studio-vision-runtime-utils";
import { getVisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import {
  emptyVisionFaceSnapshot,
  mapFaceLandmarksToSnapshot,
  readVisionFaceConfig,
  type VisionFaceConfig,
  type VisionFaceSnapshot,
} from "./vision-face-config";

type NodeRuntimeState = {
  config: VisionFaceConfig;
  cameraNodeId: string;
  lastInferMs: number;
  inferInFlight: boolean;
  wasDetected: boolean;
  pendingTriggerEdge: boolean;
  snapshot: VisionFaceSnapshot;
};

class StudioVisionFaceRuntime {
  private nodeById = new Map<string, NodeRuntimeState>();
  private workerBackendDisabled = false;

  private ensureNodeState(nodeId: string): NodeRuntimeState {
    let st = this.nodeById.get(nodeId);
    if (st == null) {
      st = {
        config: readVisionFaceConfig({}),
        cameraNodeId: "",
        lastInferMs: 0,
        inferInFlight: false,
        wasDetected: false,
        pendingTriggerEdge: false,
        snapshot: emptyVisionFaceSnapshot("idle"),
      };
      this.nodeById.set(nodeId, st);
    }
    return st;
  }

  getSnapshot(nodeId: string): VisionFaceSnapshot {
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
  }): VisionFaceSnapshot {
    const st = this.ensureNodeState(args.nodeId);
    const config = readVisionFaceConfig(args.config);
    config.enabled = args.enabled;
    st.config = config;

    if (!config.enabled || args.cameraNodeId == null || args.cameraNodeId.length === 0) {
      st.cameraNodeId = "";
      st.snapshot = emptyVisionFaceSnapshot("idle");
      st.wasDetected = false;
      return consumeVisionTriggerEdge(st);
    }

    st.cameraNodeId = args.cameraNodeId;
    const video = studioCameraRuntime.getVideoElement(args.cameraNodeId);
    const camUi = studioCameraRuntime.getCameraUiState(args.cameraNodeId);
    if (video == null || camUi.status !== "active") {
      st.snapshot = emptyVisionFaceSnapshot("idle");
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

  private useWorkerBackend(config: VisionFaceConfig): boolean {
    if (this.workerBackendDisabled) {
      return false;
    }
    return config.inferenceBackend === "worker";
  }

  private recoverFromWorkerFailure(): void {
    resetVisionMediapipeRuntimeCaches();
    studioVisionFaceWorkerBridge.release();
  }

  private async runInference(
    nodeId: string,
    st: NodeRuntimeState,
    video: HTMLVideoElement,
    nowMs: number,
    config: VisionFaceConfig,
  ): Promise<void> {
    try {
      let faceLandmarks:
        | ReadonlyArray<readonly import("./vision-pose-config").PoseLandmarkLike[]>
        | undefined;

      if (this.useWorkerBackend(config)) {
        try {
          const endpoints = getVisionMediapipeEndpoints();
          await studioVisionFaceWorkerBridge.ensureReady({
            endpoints,
            minDetectionConfidence: config.minDetectionConfidence,
            maxResults: 1,
            scoreThreshold: 0,
          });
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const payload = await studioVisionFaceWorkerBridge.inferFromVideoFrame(video);
          faceLandmarks = payload.faceLandmarks;
        } catch {
          this.workerBackendDisabled = true;
          this.recoverFromWorkerFailure();
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const result = await detectFaceLandmarkerForVideo(
            { minDetectionConfidence: config.minDetectionConfidence },
            video,
          );
          faceLandmarks = result.faceLandmarks;
        }
      } else {
        const result = await detectFaceLandmarkerForVideo(
          { minDetectionConfidence: config.minDetectionConfidence },
          video,
        );
        if (!this.nodeById.has(nodeId)) {
          return;
        }
        faceLandmarks = result.faceLandmarks;
      }

      const mapped = mapFaceLandmarksToSnapshot({
        landmarks: faceLandmarks,
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
        nose: mapped.nose,
        leftEye: mapped.leftEye,
        rightEye: mapped.rightEye,
        triggerEdge: false,
      };
      st.lastInferMs = nowMs;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/wasm|fetch|404|timed out|bundled|model/i.test(message)) {
        this.recoverFromWorkerFailure();
      }
      st.snapshot = emptyVisionFaceSnapshot("error", message);
      st.wasDetected = false;
    } finally {
      st.inferInFlight = false;
    }
  }
}

export const studioVisionFaceRuntime = new StudioVisionFaceRuntime();
