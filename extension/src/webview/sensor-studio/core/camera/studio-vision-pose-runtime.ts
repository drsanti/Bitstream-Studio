import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { studioCameraRuntime } from "./studio-camera-runtime";
import { detectPoseLandmarkerForVideo, resetVisionMediapipeRuntimeCaches } from "./studio-vision-mediapipe";
import { studioVisionLandmarkCache } from "./studio-vision-landmark-cache";
import {
  isVisionPoseWorkerBackendEnabled,
  studioVisionPoseWorkerBridge,
} from "./studio-vision-pose-worker-bridge";
import {
  applyVisionDetectionEdge,
  consumeVisionTriggerEdge,
  visionMinInferIntervalMs,
} from "./studio-vision-runtime-utils";
import {
  getVisionMediapipeEndpoints,
} from "./vision-mediapipe-endpoints";
import {
  visionMediapipeLoadProgress,
} from "./vision-mediapipe-asset-loader";
import {
  emptyVisionPoseSnapshot,
  mapPoseLandmarksToSnapshot,
  readVisionPoseConfig,
  type VisionPoseConfig,
  type VisionPoseSnapshot,
} from "./vision-pose-config";

type NodeRuntimeState = {
  config: VisionPoseConfig;
  cameraNodeId: string;
  lastInferMs: number;
  inferInFlight: boolean;
  wasDetected: boolean;
  pendingTriggerEdge: boolean;
  snapshot: VisionPoseSnapshot;
};

class StudioVisionPoseRuntime {
  private nodeById = new Map<string, NodeRuntimeState>();
  /** When worker init fails (e.g. WASM load), fall back to main-thread inference. */
  private workerBackendDisabled = false;

  private ensureNodeState(nodeId: string): NodeRuntimeState {
    let st = this.nodeById.get(nodeId);
    if (st == null) {
      st = {
        config: readVisionPoseConfig({}),
        cameraNodeId: "",
        lastInferMs: 0,
        inferInFlight: false,
        wasDetected: false,
        pendingTriggerEdge: false,
        snapshot: emptyVisionPoseSnapshot("idle"),
      };
      this.nodeById.set(nodeId, st);
    }
    return st;
  }

  getSnapshot(nodeId: string): VisionPoseSnapshot {
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
  }): VisionPoseSnapshot {
    const st = this.ensureNodeState(args.nodeId);
    const config = readVisionPoseConfig(args.config);
    config.enabled = args.enabled;
    st.config = config;

    if (!config.enabled || args.cameraNodeId == null || args.cameraNodeId.length === 0) {
      st.cameraNodeId = "";
      st.snapshot = emptyVisionPoseSnapshot("idle");
      st.wasDetected = false;
      studioVisionLandmarkCache.setLandmarks(args.nodeId, undefined);
      return consumeVisionTriggerEdge(st);
    }

    st.cameraNodeId = args.cameraNodeId;
    const video = studioCameraRuntime.getVideoElement(args.cameraNodeId);
    const camUi = studioCameraRuntime.getCameraUiState(args.cameraNodeId);
    if (video == null || camUi.status !== "active") {
      st.snapshot = emptyVisionPoseSnapshot("idle");
      st.wasDetected = false;
      studioVisionLandmarkCache.setLandmarks(args.nodeId, undefined);
      return consumeVisionTriggerEdge(st);
    }

    if (st.snapshot.status === "idle" || st.snapshot.status === "error") {
      st.snapshot = { ...st.snapshot, status: "loading", loadProgressPercent: 0 };
    } else if (st.snapshot.status === "loading") {
      const progress = visionMediapipeLoadProgress.getState().percent;
      if (st.snapshot.loadProgressPercent !== progress) {
        st.snapshot = { ...st.snapshot, loadProgressPercent: progress };
      }
    }

    const minIntervalMs = visionMinInferIntervalMs(config.targetFps);
    if (!st.inferInFlight && args.nowMs - st.lastInferMs >= minIntervalMs) {
      st.inferInFlight = true;
      void this.runInference(args.nodeId, st, video, args.nowMs, config);
    }

    return consumeVisionTriggerEdge(st);
  }

  private useWorkerBackend(config: VisionPoseConfig): boolean {
    if (this.workerBackendDisabled) {
      return false;
    }
    return config.inferenceBackend === "worker" || isVisionPoseWorkerBackendEnabled();
  }

  private async inferPoseOnMainThread(
    config: VisionPoseConfig,
    video: HTMLVideoElement,
  ): Promise<PoseLandmarkerResult["landmarks"][number] | undefined> {
    const result = await detectPoseLandmarkerForVideo(
      config.modelVariant,
      {
        minDetectionConfidence: config.minDetectionConfidence,
        minTrackingConfidence: config.minTrackingConfidence,
      },
      video,
    );
    return result.landmarks?.[0];
  }

  private recoverFromMediapipeFailure(): void {
    resetVisionMediapipeRuntimeCaches();
    studioVisionPoseWorkerBridge.release();
  }

  private async runInference(
    nodeId: string,
    st: NodeRuntimeState,
    video: HTMLVideoElement,
    nowMs: number,
    config: VisionPoseConfig,
  ): Promise<void> {
    try {
      let pose: PoseLandmarkerResult["landmarks"][number] | undefined;
      if (this.useWorkerBackend(config)) {
        try {
          const endpoints = getVisionMediapipeEndpoints();
          await studioVisionPoseWorkerBridge.ensureReady({
            endpoints,
            modelVariant: config.modelVariant,
            minDetectionConfidence: config.minDetectionConfidence,
            minTrackingConfidence: config.minTrackingConfidence,
          });
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          const progress = visionMediapipeLoadProgress.getState().percent;
          if (st.snapshot.status === "loading") {
            st.snapshot = { ...st.snapshot, loadProgressPercent: progress };
          }
          pose = await studioVisionPoseWorkerBridge.inferFromVideoFrame(video);
        } catch {
          this.workerBackendDisabled = true;
          this.recoverFromMediapipeFailure();
          if (!this.nodeById.has(nodeId)) {
            return;
          }
          pose = await this.inferPoseOnMainThread(config, video);
        }
      } else {
        if (!this.nodeById.has(nodeId)) {
          return;
        }
        pose = await this.inferPoseOnMainThread(config, video);
      }
      const mapped = mapPoseLandmarksToSnapshot({
        landmarks: pose,
        minDetectionConfidence: config.minDetectionConfidence,
      });
      studioVisionLandmarkCache.setLandmarks(nodeId, pose);
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
        loadProgressPercent: 100,
        detected: mapped.detected,
        score: mapped.score,
        nose: mapped.nose,
        leftWrist: mapped.leftWrist,
        rightWrist: mapped.rightWrist,
        triggerEdge: false,
      };
      st.lastInferMs = nowMs;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/wasm|fetch|404|timed out|bundled|model/i.test(message)) {
        this.recoverFromMediapipeFailure();
      }
      st.snapshot = emptyVisionPoseSnapshot("error", message);
      st.wasDetected = false;
      studioVisionLandmarkCache.setLandmarks(nodeId, undefined);
    } finally {
      st.inferInFlight = false;
    }
  }
}

export const studioVisionPoseRuntime = new StudioVisionPoseRuntime();
