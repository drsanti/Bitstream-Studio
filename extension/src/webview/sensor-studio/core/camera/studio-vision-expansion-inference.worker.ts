import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  ObjectDetector,
  type FaceLandmarkerResult,
  type HandLandmarkerResult,
  type ObjectDetectorResult,
} from "@mediapipe/tasks-vision";
import { VisionMediaPipeTimestampCounter } from "./studio-vision-mediapipe-detect-queue";
import type { VisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";

export type VisionExpansionWorkerTask = "hands" | "face" | "object";

export type ExpansionWorkerInitMessage = {
  type: "init";
  task: VisionExpansionWorkerTask;
  endpoints: VisionMediapipeEndpoints;
  minDetectionConfidence: number;
  maxResults: number;
  scoreThreshold: number;
};

export type ExpansionWorkerInferMessage = {
  type: "infer";
  id: number;
  bitmap: ImageBitmap;
};

export type ExpansionWorkerHandPayload = {
  landmarks?: HandLandmarkerResult["landmarks"];
  handedness?: HandLandmarkerResult["handedness"];
};

export type ExpansionWorkerFacePayload = {
  faceLandmarks?: FaceLandmarkerResult["faceLandmarks"];
};

export type ExpansionWorkerObjectPayload = {
  detections?: ObjectDetectorResult["detections"];
};

export type ExpansionWorkerInferResultMessage = {
  type: "result";
  id: number;
  hands?: ExpansionWorkerHandPayload;
  face?: ExpansionWorkerFacePayload;
  object?: ExpansionWorkerObjectPayload;
  error?: string;
};

export type ExpansionWorkerReadyMessage = {
  type: "ready";
};

export type ExpansionWorkerErrorMessage = {
  type: "error";
  message: string;
};

let activeTask: VisionExpansionWorkerTask | null = null;
let sessionKey = "";
let handLandmarker: HandLandmarker | null = null;
let faceLandmarker: FaceLandmarker | null = null;
let objectDetector: ObjectDetector | null = null;
const inferTimestamp = new VisionMediaPipeTimestampCounter();
let inferChain: Promise<unknown> = Promise.resolve();

function bitmapToFrameCanvas(bitmap: ImageBitmap): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (ctx != null) {
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  }
  return canvas;
}

async function ensureTaskLandmarker(msg: ExpansionWorkerInitMessage): Promise<void> {
  const nextKey = JSON.stringify(msg);
  if (activeTask === msg.task && sessionKey === nextKey) {
    return;
  }

  handLandmarker?.close();
  faceLandmarker?.close();
  objectDetector?.close();
  handLandmarker = null;
  faceLandmarker = null;
  objectDetector = null;
  inferTimestamp.reset();
  inferChain = Promise.resolve();

  const vision = await FilesetResolver.forVisionTasks(msg.endpoints.wasmBase);
  const createWithFallback = async <T>(
    gpuFactory: () => Promise<T>,
    cpuFactory: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await gpuFactory();
    } catch {
      return cpuFactory();
    }
  };

  if (msg.task === "hands") {
    handLandmarker = await createWithFallback(
      () =>
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: msg.endpoints.handUrl, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: msg.minDetectionConfidence,
          minHandPresenceConfidence: msg.minDetectionConfidence,
          minTrackingConfidence: msg.minDetectionConfidence,
        }),
      () =>
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: msg.endpoints.handUrl, delegate: "CPU" },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: msg.minDetectionConfidence,
          minHandPresenceConfidence: msg.minDetectionConfidence,
          minTrackingConfidence: msg.minDetectionConfidence,
        }),
    );
  } else if (msg.task === "face") {
    faceLandmarker = await createWithFallback(
      () =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: msg.endpoints.faceUrl, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: msg.minDetectionConfidence,
          minFacePresenceConfidence: msg.minDetectionConfidence,
          minTrackingConfidence: msg.minDetectionConfidence,
        }),
      () =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: msg.endpoints.faceUrl, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: msg.minDetectionConfidence,
          minFacePresenceConfidence: msg.minDetectionConfidence,
          minTrackingConfidence: msg.minDetectionConfidence,
        }),
    );
  } else {
    objectDetector = await createWithFallback(
      () =>
        ObjectDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: msg.endpoints.objectUrl, delegate: "GPU" },
          runningMode: "VIDEO",
          maxResults: msg.maxResults,
          scoreThreshold: msg.scoreThreshold,
        }),
      () =>
        ObjectDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: msg.endpoints.objectUrl, delegate: "CPU" },
          runningMode: "VIDEO",
          maxResults: msg.maxResults,
          scoreThreshold: msg.scoreThreshold,
        }),
    );
  }

  activeTask = msg.task;
  sessionKey = nextKey;
}

self.onmessage = (event: MessageEvent<ExpansionWorkerInitMessage | ExpansionWorkerInferMessage>) => {
  const data = event.data;
  if (data.type === "init") {
    void (async () => {
      try {
        await ensureTaskLandmarker(data);
        (self as DedicatedWorkerGlobalScope).postMessage({
          type: "ready",
        } satisfies ExpansionWorkerReadyMessage);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        (self as DedicatedWorkerGlobalScope).postMessage({
          type: "error",
          message,
        } satisfies ExpansionWorkerErrorMessage);
      }
    })();
    return;
  }

  if (data.type === "infer") {
    const inferJob = inferChain.then(async () => {
      try {
        const timestampMs = inferTimestamp.next();
        const frameCanvas = bitmapToFrameCanvas(data.bitmap);
        data.bitmap.close();

        if (activeTask === "hands" && handLandmarker != null) {
          const result = handLandmarker.detectForVideo(frameCanvas, timestampMs);
          (self as DedicatedWorkerGlobalScope).postMessage({
            type: "result",
            id: data.id,
            hands: {
              landmarks: result.landmarks,
              handedness: result.handedness,
            },
          } satisfies ExpansionWorkerInferResultMessage);
          return;
        }
        if (activeTask === "face" && faceLandmarker != null) {
          const result = faceLandmarker.detectForVideo(frameCanvas, timestampMs);
          (self as DedicatedWorkerGlobalScope).postMessage({
            type: "result",
            id: data.id,
            face: { faceLandmarks: result.faceLandmarks },
          } satisfies ExpansionWorkerInferResultMessage);
          return;
        }
        if (activeTask === "object" && objectDetector != null) {
          const result = objectDetector.detectForVideo(frameCanvas, timestampMs);
          (self as DedicatedWorkerGlobalScope).postMessage({
            type: "result",
            id: data.id,
            object: { detections: result.detections },
          } satisfies ExpansionWorkerInferResultMessage);
          return;
        }
        throw new Error("Expansion worker not initialized");
      } catch (err) {
        data.bitmap.close();
        const message = err instanceof Error ? err.message : String(err);
        (self as DedicatedWorkerGlobalScope).postMessage({
          type: "result",
          id: data.id,
          error: message,
        } satisfies ExpansionWorkerInferResultMessage);
      }
    });
    inferChain = inferJob.then(
      () => undefined,
      () => undefined,
    );
  }
};

export {};
