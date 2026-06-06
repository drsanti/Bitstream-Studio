import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { VisionMediaPipeTimestampCounter } from "./studio-vision-mediapipe-detect-queue";
import type { VisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import type { VisionPoseModelVariant } from "./vision-pose-config";

export type PoseWorkerInitMessage = {
  type: "init";
  endpoints: VisionMediapipeEndpoints;
  modelVariant: VisionPoseModelVariant;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
};

export type PoseWorkerInferMessage = {
  type: "infer";
  id: number;
  bitmap: ImageBitmap;
};

export type PoseWorkerInferResultMessage = {
  type: "result";
  id: number;
  landmarks?: PoseLandmarkerResult["landmarks"][number];
  error?: string;
};

export type PoseWorkerReadyMessage = {
  type: "ready";
};

export type PoseWorkerErrorMessage = {
  type: "error";
  message: string;
};

let landmarker: PoseLandmarker | null = null;
let landmarkerSessionKey = "";
const inferTimestamp = new VisionMediaPipeTimestampCounter();
let inferChain: Promise<unknown> = Promise.resolve();

function poseModelPath(
  variant: VisionPoseModelVariant,
  endpoints: VisionMediapipeEndpoints,
): string {
  switch (variant) {
    case "full":
      return endpoints.poseFullUrl;
    case "heavy":
      return endpoints.poseHeavyUrl;
    default:
      return endpoints.poseLiteUrl;
  }
}

async function ensureLandmarker(msg: PoseWorkerInitMessage): Promise<void> {
  const modelPath = poseModelPath(msg.modelVariant, msg.endpoints);
  const sessionKey = `${msg.endpoints.wasmBase}|${modelPath}|${msg.minDetectionConfidence}|${msg.minTrackingConfidence}`;

  if (landmarker != null && landmarkerSessionKey === sessionKey) {
    return;
  }

  landmarker?.close();
  landmarker = null;
  inferTimestamp.reset();
  inferChain = Promise.resolve();

  const vision = await FilesetResolver.forVisionTasks(msg.endpoints.wasmBase);
  const createOptions = (delegate: "GPU" | "CPU") => ({
    baseOptions: {
      modelAssetPath: modelPath,
      delegate,
    },
    runningMode: "VIDEO" as const,
    numPoses: 1,
    minPoseDetectionConfidence: msg.minDetectionConfidence,
    minPosePresenceConfidence: msg.minDetectionConfidence,
    minTrackingConfidence: msg.minTrackingConfidence,
  });
  try {
    landmarker = await PoseLandmarker.createFromOptions(vision, createOptions("GPU"));
  } catch {
    landmarker = await PoseLandmarker.createFromOptions(vision, createOptions("CPU"));
  }
  landmarkerSessionKey = sessionKey;
}

function bitmapToFrameCanvas(bitmap: ImageBitmap): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (ctx != null) {
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  }
  return canvas;
}

self.onmessage = (event: MessageEvent<PoseWorkerInitMessage | PoseWorkerInferMessage>) => {
  const data = event.data;
  if (data.type === "init") {
    void (async () => {
      try {
        await ensureLandmarker(data);
        (self as DedicatedWorkerGlobalScope).postMessage({ type: "ready" } satisfies PoseWorkerReadyMessage);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        (self as DedicatedWorkerGlobalScope).postMessage({
          type: "error",
          message,
        } satisfies PoseWorkerErrorMessage);
      }
    })();
    return;
  }
  if (data.type === "infer") {
    const inferJob = inferChain.then(async () => {
      try {
        if (landmarker == null) {
          throw new Error("Pose worker not initialized");
        }
        const timestampMs = inferTimestamp.next();
        const frameCanvas = bitmapToFrameCanvas(data.bitmap);
        data.bitmap.close();
        const result = landmarker.detectForVideo(frameCanvas, timestampMs);
        const landmarks = result.landmarks?.[0];
        (self as DedicatedWorkerGlobalScope).postMessage({
          type: "result",
          id: data.id,
          landmarks,
        } satisfies PoseWorkerInferResultMessage);
      } catch (err) {
        data.bitmap.close();
        const message = err instanceof Error ? err.message : String(err);
        (self as DedicatedWorkerGlobalScope).postMessage({
          type: "result",
          id: data.id,
          error: message,
        } satisfies PoseWorkerInferResultMessage);
      }
    });
    inferChain = inferJob.then(
      () => undefined,
      () => undefined,
    );
  }
};

export {};
