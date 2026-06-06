import type { VisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import type {
  ExpansionWorkerHandPayload,
  ExpansionWorkerFacePayload,
  ExpansionWorkerObjectPayload,
  ExpansionWorkerInferResultMessage,
  ExpansionWorkerReadyMessage,
  VisionExpansionWorkerTask,
} from "./studio-vision-expansion-inference.worker";
import { captureCameraInferenceCanvas } from "./studio-camera-inference-surface";
import { ensureExpansionTaskAssetsLoaded } from "./vision-mediapipe-asset-loader";

type PendingInfer<T> = {
  resolve: (value: T) => void;
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

export type ExpansionWorkerInitArgs = {
  endpoints: VisionMediapipeEndpoints;
  minDetectionConfidence: number;
  maxResults: number;
  scoreThreshold: number;
};

class StudioVisionExpansionWorkerBridge<TPayload> {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private initKey = "";
  private seq = 0;
  private pending = new Map<number, PendingInfer<TPayload>>();

  constructor(private readonly task: VisionExpansionWorkerTask) {}

  private spawnWorker(): Worker {
    return new Worker(new URL("./studio-vision-expansion-inference.worker.ts", import.meta.url));
  }

  private extractPayload(message: ExpansionWorkerInferResultMessage): TPayload {
    if (message.error != null) {
      throw new Error(message.error);
    }
    if (this.task === "hands") {
      return (message.hands ?? {}) as TPayload;
    }
    if (this.task === "face") {
      return (message.face ?? {}) as TPayload;
    }
    return (message.object ?? {}) as TPayload;
  }

  private attachHandlers(worker: Worker): void {
    worker.onmessage = (event: MessageEvent<ExpansionWorkerInferResultMessage | ExpansionWorkerReadyMessage>) => {
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
      try {
        pending.resolve(this.extractPayload(data));
      } catch (err) {
        pending.reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    worker.onerror = () => {
      for (const [, p] of this.pending) {
        p.reject(new Error(`${this.task} inference worker crashed`));
      }
      this.pending.clear();
      this.worker?.terminate();
      this.worker = null;
      this.readyPromise = null;
    };
  }

  release(): void {
    for (const [, p] of this.pending) {
      p.reject(new Error(`${this.task} worker released`));
    }
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.initKey = "";
  }

  async ensureReady(args: ExpansionWorkerInitArgs): Promise<void> {
    const nextKey = JSON.stringify({ task: this.task, ...args });
    if (this.worker != null && this.initKey === nextKey && this.readyPromise != null) {
      return this.readyPromise;
    }
    this.worker?.terminate();
    this.worker = this.spawnWorker();
    this.attachHandlers(this.worker);
    this.initKey = nextKey;
    await ensureExpansionTaskAssetsLoaded({ task: this.task, endpoints: args.endpoints });
    this.readyPromise = new Promise<void>((resolve, reject) => {
      const worker = this.worker;
      if (worker == null) {
        reject(new Error(`Failed to spawn ${this.task} worker`));
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
        task: this.task,
        endpoints: args.endpoints,
        minDetectionConfidence: args.minDetectionConfidence,
        maxResults: args.maxResults,
        scoreThreshold: args.scoreThreshold,
      });
    });
    await withTimeout(this.readyPromise, WORKER_INIT_TIMEOUT_MS, `${this.task} worker init`);
  }

  async inferFromVideoFrame(video: HTMLVideoElement): Promise<TPayload> {
    if (this.worker == null || this.readyPromise == null) {
      throw new Error(`${this.task} worker not ready`);
    }
    await this.readyPromise;
    const frame = captureCameraInferenceCanvas(video);
    const bitmap = await createImageBitmap(frame);
    const id = ++this.seq;
    return new Promise<TPayload>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ type: "infer", id, bitmap }, [bitmap]);
    });
  }
}

export const studioVisionHandsWorkerBridge =
  new StudioVisionExpansionWorkerBridge<ExpansionWorkerHandPayload>("hands");
export const studioVisionFaceWorkerBridge =
  new StudioVisionExpansionWorkerBridge<ExpansionWorkerFacePayload>("face");
export const studioVisionObjectWorkerBridge =
  new StudioVisionExpansionWorkerBridge<ExpansionWorkerObjectPayload>("object");

export function releaseAllVisionExpansionWorkers(): void {
  studioVisionHandsWorkerBridge.release();
  studioVisionFaceWorkerBridge.release();
  studioVisionObjectWorkerBridge.release();
}
