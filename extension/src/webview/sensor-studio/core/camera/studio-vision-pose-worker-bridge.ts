import type { PoseLandmarkLike } from "./vision-pose-config";
import type { VisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import type { VisionPoseModelVariant } from "./vision-pose-config";
import type {
  PoseWorkerInferResultMessage,
  PoseWorkerReadyMessage,
} from "./studio-vision-pose-inference.worker";
import { captureCameraInferenceCanvas } from "./studio-camera-inference-surface";
import {
  ensurePoseLandmarkerAssetsLoaded,
  runPoseLandmarkerInitProgress,
} from "./vision-mediapipe-asset-loader";

type PendingInfer = {
  resolve: (landmarks: readonly PoseLandmarkLike[] | undefined) => void;
  reject: (err: Error) => void;
};

const WORKER_INIT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

class StudioVisionPoseWorkerBridge {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private initKey = "";
  private seq = 0;
  private pending = new Map<number, PendingInfer>();

  private spawnWorker(): Worker {
    // Classic worker (default) — MediaPipe WASM uses importScripts, which module workers forbid.
    return new Worker(new URL("./studio-vision-pose-inference.worker.ts", import.meta.url));
  }

  private attachHandlers(worker: Worker): void {
    worker.onmessage = (event: MessageEvent<PoseWorkerInferResultMessage | PoseWorkerReadyMessage>) => {
      const data = event.data;
      if (data.type === "ready") {
        return;
      }
      if (data.type !== "result") {
        return;
      }
      const pending = this.pending.get(data.id);
      if (pending == null) {
        return;
      }
      this.pending.delete(data.id);
      if (data.error != null) {
        pending.reject(new Error(data.error));
        return;
      }
      pending.resolve(data.landmarks ?? []);
    };
    worker.onerror = () => {
      for (const [, p] of this.pending) {
        p.reject(new Error("Pose inference worker crashed"));
      }
      this.pending.clear();
      this.worker?.terminate();
      this.worker = null;
      this.readyPromise = null;
    };
  }

  release(): void {
    for (const [, p] of this.pending) {
      p.reject(new Error("Pose worker released"));
    }
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.initKey = "";
  }

  async ensureReady(args: {
    endpoints: VisionMediapipeEndpoints;
    modelVariant: VisionPoseModelVariant;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): Promise<void> {
    const nextKey = JSON.stringify(args);
    if (this.worker != null && this.initKey === nextKey && this.readyPromise != null) {
      return this.readyPromise;
    }
    this.worker?.terminate();
    this.worker = this.spawnWorker();
    this.attachHandlers(this.worker);
    this.initKey = nextKey;
    await ensurePoseLandmarkerAssetsLoaded({
      endpoints: args.endpoints,
      modelVariant: args.modelVariant,
    });
    return runPoseLandmarkerInitProgress(async () => {
      this.readyPromise = new Promise<void>((resolve, reject) => {
        const worker = this.worker;
        if (worker == null) {
          reject(new Error("Failed to spawn pose worker"));
          return;
        }
        const onMessage = (event: MessageEvent) => {
          const data = event.data;
          if (data?.type === "ready") {
            worker.removeEventListener("message", onMessage);
            resolve();
          } else if (data?.type === "error") {
            worker.removeEventListener("message", onMessage);
            reject(new Error(String(data.message ?? "Worker init failed")));
          }
        };
        worker.addEventListener("message", onMessage);
        worker.postMessage({
          type: "init",
          endpoints: args.endpoints,
          modelVariant: args.modelVariant,
          minDetectionConfidence: args.minDetectionConfidence,
          minTrackingConfidence: args.minTrackingConfidence,
        });
      });
      await withTimeout(this.readyPromise, WORKER_INIT_TIMEOUT_MS, "Pose worker init");
    });
  }

  async inferFromVideoFrame(
    video: HTMLVideoElement,
  ): Promise<readonly PoseLandmarkLike[] | undefined> {
    if (this.worker == null || this.readyPromise == null) {
      throw new Error("Pose worker not ready");
    }
    await this.readyPromise;
    const frame = captureCameraInferenceCanvas(video);
    const bitmap = await createImageBitmap(frame);
    const id = ++this.seq;
    return new Promise<readonly PoseLandmarkLike[] | undefined>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ type: "infer", id, bitmap }, [bitmap]);
    });
  }
}

export const studioVisionPoseWorkerBridge = new StudioVisionPoseWorkerBridge();

export function isVisionPoseWorkerBackendEnabled(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  return localStorage.getItem("trn_vision_pose_worker_v1") === "1";
}

export function setVisionPoseWorkerBackendEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  if (enabled) {
    localStorage.setItem("trn_vision_pose_worker_v1", "1");
  } else {
    localStorage.removeItem("trn_vision_pose_worker_v1");
  }
}
