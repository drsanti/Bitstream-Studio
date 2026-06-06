import { studioCameraRuntime } from "./studio-camera-runtime";
import {
  detectObjectDetectorForVideo,
  resetVisionMediapipeRuntimeCaches,
} from "./studio-vision-mediapipe";
import { studioVisionObjectWorkerBridge } from "./studio-vision-expansion-worker-bridge";
import {
  applyVisionDetectionEdge,
  consumeVisionTriggerEdge,
  visionMinInferIntervalMs,
} from "./studio-vision-runtime-utils";
import { getVisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import {
  emptyVisionObjectSnapshot,
  mapObjectDetectionsToSnapshot,
  readVisionObjectConfig,
  type VisionObjectConfig,
  type VisionObjectSnapshot,
} from "./vision-object-config";

type NodeRuntimeState = {
  config: VisionObjectConfig;
  cameraNodeId: string;
  lastInferMs: number;
  inferInFlight: boolean;
  wasDetected: boolean;
  pendingTriggerEdge: boolean;
  snapshot: VisionObjectSnapshot;
};

class StudioVisionObjectRuntime {
  private nodeById = new Map<string, NodeRuntimeState>();
  private workerBackendDisabled = false;

  private ensureNodeState(nodeId: string): NodeRuntimeState {
    let st = this.nodeById.get(nodeId);
    if (st == null) {
      st = {
        config: readVisionObjectConfig({}),
        cameraNodeId: "",
        lastInferMs: 0,
        inferInFlight: false,
        wasDetected: false,
        pendingTriggerEdge: false,
        snapshot: emptyVisionObjectSnapshot("idle"),
      };
      this.nodeById.set(nodeId, st);
    }
    return st;
  }

  getSnapshot(nodeId: string): VisionObjectSnapshot {
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
  }): VisionObjectSnapshot {
    const st = this.ensureNodeState(args.nodeId);
    const config = readVisionObjectConfig(args.config);
    config.enabled = args.enabled;
    st.config = config;

    if (!config.enabled || args.cameraNodeId == null || args.cameraNodeId.length === 0) {
      st.cameraNodeId = "";
      st.snapshot = emptyVisionObjectSnapshot("idle");
      st.wasDetected = false;
      return consumeVisionTriggerEdge(st);
    }

    st.cameraNodeId = args.cameraNodeId;
    const video = studioCameraRuntime.getVideoElement(args.cameraNodeId);
    const camUi = studioCameraRuntime.getCameraUiState(args.cameraNodeId);
    if (video == null || camUi.status !== "active") {
      st.snapshot = emptyVisionObjectSnapshot("idle");
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

  private useWorkerBackend(config: VisionObjectConfig): boolean {
    if (this.workerBackendDisabled) {
      return false;
    }
    return config.inferenceBackend === "worker";
  }

  private recoverFromWorkerFailure(): void {
    resetVisionMediapipeRuntimeCaches();
    studioVisionObjectWorkerBridge.release();
  }

  private async runInference(
    nodeId: string,
    st: NodeRuntimeState,
    video: HTMLVideoElement,
    nowMs: number,
    config: VisionObjectConfig,
  ): Promise<void> {
    try {
      let detections:
        | ReadonlyArray<{ categories?: ReadonlyArray<{ categoryName?: string; score?: number }> }>
        | undefined;

      if (this.useWorkerBackend(config)) {
        try {
          const endpoints = getVisionMediapipeEndpoints();
          await studioVisionObjectWorkerBridge.ensureReady({
            endpoints,
            minDetectionConfidence: config.minDetectionConfidence,
            maxResults: config.maxResults,
            scoreThreshold: config.scoreThreshold,
          });
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const payload = await studioVisionObjectWorkerBridge.inferFromVideoFrame(video);
          detections = payload.detections;
        } catch {
          this.workerBackendDisabled = true;
          this.recoverFromWorkerFailure();
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const result = await detectObjectDetectorForVideo(
            {
              maxResults: config.maxResults,
              scoreThreshold: config.scoreThreshold,
            },
            video,
          );
          detections = result.detections;
        }
      } else {
        const result = await detectObjectDetectorForVideo(
          {
            maxResults: config.maxResults,
            scoreThreshold: config.scoreThreshold,
          },
          video,
        );
        if (!this.nodeById.has(nodeId)) {
          return;
        }
        detections = result.detections;
      }

      const mapped = mapObjectDetectionsToSnapshot({
        detections,
        scoreThreshold: config.scoreThreshold,
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
        count: mapped.count,
        label: mapped.label,
        score: mapped.score,
        triggerEdge: false,
      };
      st.lastInferMs = nowMs;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/wasm|fetch|404|timed out|bundled|model/i.test(message)) {
        this.recoverFromWorkerFailure();
      }
      st.snapshot = emptyVisionObjectSnapshot("error", message);
      st.wasDetected = false;
    } finally {
      st.inferInFlight = false;
    }
  }
}

export const studioVisionObjectRuntime = new StudioVisionObjectRuntime();
