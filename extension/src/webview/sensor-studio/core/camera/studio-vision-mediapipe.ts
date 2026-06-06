import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  ObjectDetector,
  PoseLandmarker,
  type FaceLandmarkerResult,
  type HandLandmarkerResult,
  type ObjectDetectorResult,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { VisionPoseModelVariant } from "./vision-pose-config";
import {
  getVisionMediapipeEndpoints,
  type VisionMediapipeEndpoints,
} from "./vision-mediapipe-endpoints";
import {
  ensurePoseLandmarkerAssetsLoaded,
  resetVisionMediapipeAssetWarmCache,
  runPoseLandmarkerInitProgress,
} from "./vision-mediapipe-asset-loader";
import { releaseAllVisionExpansionWorkers } from "./studio-vision-expansion-worker-bridge";
import { captureCameraInferenceCanvas } from "./studio-camera-inference-surface";
import { visionMediaPipeDetectQueue } from "./studio-vision-mediapipe-detect-queue";

export const VISION_MEDIAPIPE_WASM_BASE = getVisionMediapipeEndpoints().wasmBase;

let visionFilesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null =
  null;
let visionFilesetBase: string | null = null;

function endpoints(): VisionMediapipeEndpoints {
  return getVisionMediapipeEndpoints();
}

function visionFileset(): ReturnType<typeof FilesetResolver.forVisionTasks> {
  const wasmBase = endpoints().wasmBase;
  if (visionFilesetPromise == null || visionFilesetBase !== wasmBase) {
    visionFilesetBase = wasmBase;
    visionFilesetPromise = FilesetResolver.forVisionTasks(wasmBase);
  }
  return visionFilesetPromise;
}

function poseModelUrl(variant: VisionPoseModelVariant, ep: VisionMediapipeEndpoints): string {
  switch (variant) {
    case "full":
      return ep.poseFullUrl;
    case "heavy":
      return ep.poseHeavyUrl;
    default:
      return ep.poseLiteUrl;
  }
}

/** CPU on main thread avoids WebGL context fights with Three.js; worker keeps GPU. */
type MediapipeDelegate = "GPU" | "CPU";

const MAIN_THREAD_DELEGATE: MediapipeDelegate = "CPU";

export type PoseLandmarkerRuntimeOptions = {
  minDetectionConfidence: number;
  minTrackingConfidence: number;
};

const poseLandmarkerByKey = new Map<string, Promise<PoseLandmarker>>();

function poseLandmarkerCacheKey(
  variant: VisionPoseModelVariant,
  options: PoseLandmarkerRuntimeOptions,
): string {
  return `${variant}|${options.minDetectionConfidence}|${options.minTrackingConfidence}`;
}

async function createPoseLandmarker(
  variant: VisionPoseModelVariant,
  options: PoseLandmarkerRuntimeOptions,
  delegate: MediapipeDelegate,
): Promise<PoseLandmarker> {
  const ep = endpoints();
  await ensurePoseLandmarkerAssetsLoaded({ endpoints: ep, modelVariant: variant });
  return runPoseLandmarkerInitProgress(async () => {
    const vision = await visionFileset();
    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: poseModelUrl(variant, ep),
        delegate,
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: options.minDetectionConfidence,
      minPosePresenceConfidence: options.minDetectionConfidence,
      minTrackingConfidence: options.minTrackingConfidence,
    });
  });
}

export async function acquirePoseLandmarkerForVideo(
  variant: VisionPoseModelVariant,
  options: PoseLandmarkerRuntimeOptions,
): Promise<PoseLandmarker> {
  const key = poseLandmarkerCacheKey(variant, options);
  let promise = poseLandmarkerByKey.get(key);
  if (promise == null) {
    promise = createPoseLandmarker(variant, options, MAIN_THREAD_DELEGATE);
    poseLandmarkerByKey.set(key, promise);
  }
  return promise;
}

export async function detectPoseLandmarkerForVideo(
  variant: VisionPoseModelVariant,
  options: PoseLandmarkerRuntimeOptions,
  video: HTMLVideoElement,
): Promise<PoseLandmarkerResult> {
  const landmarker = await acquirePoseLandmarkerForVideo(variant, options);
  const scopeId = `pose:${poseLandmarkerCacheKey(variant, options)}`;
  return visionMediaPipeDetectQueue(scopeId).run(video, (timestampMs) => {
    const frame = captureCameraInferenceCanvas(video);
    return landmarker.detectForVideo(frame, timestampMs);
  });
}

export type HandLandmarkerRuntimeOptions = {
  minDetectionConfidence: number;
};

const handLandmarkerByKey = new Map<string, Promise<HandLandmarker>>();

async function createHandLandmarker(
  options: HandLandmarkerRuntimeOptions,
): Promise<HandLandmarker> {
  const ep = endpoints();
  const vision = await visionFileset();
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: ep.handUrl,
      delegate: MAIN_THREAD_DELEGATE,
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: options.minDetectionConfidence,
    minHandPresenceConfidence: options.minDetectionConfidence,
    minTrackingConfidence: options.minDetectionConfidence,
  });
}

export async function acquireHandLandmarkerForVideo(
  options: HandLandmarkerRuntimeOptions,
): Promise<HandLandmarker> {
  const key = String(options.minDetectionConfidence);
  let promise = handLandmarkerByKey.get(key);
  if (promise == null) {
    promise = createHandLandmarker(options);
    handLandmarkerByKey.set(key, promise);
  }
  return promise;
}

export async function detectHandLandmarkerForVideo(
  options: HandLandmarkerRuntimeOptions,
  video: HTMLVideoElement,
): Promise<HandLandmarkerResult> {
  const landmarker = await acquireHandLandmarkerForVideo(options);
  const scopeId = `hand:${options.minDetectionConfidence}`;
  return visionMediaPipeDetectQueue(scopeId).run(video, (timestampMs) => {
    const frame = captureCameraInferenceCanvas(video);
    return landmarker.detectForVideo(frame, timestampMs);
  });
}

export type FaceLandmarkerRuntimeOptions = {
  minDetectionConfidence: number;
};

const faceLandmarkerByKey = new Map<string, Promise<FaceLandmarker>>();

async function createFaceLandmarker(
  options: FaceLandmarkerRuntimeOptions,
): Promise<FaceLandmarker> {
  const ep = endpoints();
  const vision = await visionFileset();
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: ep.faceUrl,
      delegate: MAIN_THREAD_DELEGATE,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: options.minDetectionConfidence,
    minFacePresenceConfidence: options.minDetectionConfidence,
    minTrackingConfidence: options.minDetectionConfidence,
  });
}

export async function acquireFaceLandmarkerForVideo(
  options: FaceLandmarkerRuntimeOptions,
): Promise<FaceLandmarker> {
  const key = String(options.minDetectionConfidence);
  let promise = faceLandmarkerByKey.get(key);
  if (promise == null) {
    promise = createFaceLandmarker(options);
    faceLandmarkerByKey.set(key, promise);
  }
  return promise;
}

export async function detectFaceLandmarkerForVideo(
  options: FaceLandmarkerRuntimeOptions,
  video: HTMLVideoElement,
): Promise<FaceLandmarkerResult> {
  const landmarker = await acquireFaceLandmarkerForVideo(options);
  const scopeId = `face:${options.minDetectionConfidence}`;
  return visionMediaPipeDetectQueue(scopeId).run(video, (timestampMs) => {
    const frame = captureCameraInferenceCanvas(video);
    return landmarker.detectForVideo(frame, timestampMs);
  });
}

export type ObjectDetectorRuntimeOptions = {
  maxResults: number;
  scoreThreshold: number;
};

const objectDetectorByKey = new Map<string, Promise<ObjectDetector>>();

async function createObjectDetector(
  options: ObjectDetectorRuntimeOptions,
): Promise<ObjectDetector> {
  const ep = endpoints();
  const vision = await visionFileset();
  return ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: ep.objectUrl,
      delegate: MAIN_THREAD_DELEGATE,
    },
    runningMode: "VIDEO",
    maxResults: options.maxResults,
    scoreThreshold: options.scoreThreshold,
    categoryAllowlist: undefined,
  });
}

export async function acquireObjectDetectorForVideo(
  options: ObjectDetectorRuntimeOptions,
): Promise<ObjectDetector> {
  const key = `${options.maxResults}|${options.scoreThreshold}`;
  let promise = objectDetectorByKey.get(key);
  if (promise == null) {
    promise = createObjectDetector(options);
    objectDetectorByKey.set(key, promise);
  }
  return promise;
}

export async function detectObjectDetectorForVideo(
  options: ObjectDetectorRuntimeOptions,
  video: HTMLVideoElement,
): Promise<ObjectDetectorResult> {
  const detector = await acquireObjectDetectorForVideo(options);
  const scopeId = `object:${options.maxResults}|${options.scoreThreshold}`;
  return visionMediaPipeDetectQueue(scopeId).run(video, (timestampMs) => {
    const frame = captureCameraInferenceCanvas(video);
    return detector.detectForVideo(frame, timestampMs);
  });
}

/** @deprecated Use acquirePoseLandmarkerForVideo — kept for tests / legacy imports. */
export function loadPoseLandmarker(variant: VisionPoseModelVariant): Promise<PoseLandmarker> {
  return acquirePoseLandmarkerForVideo(variant, {
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/** Clears cached WASM fileset + landmarkers (e.g. after CDN fallback). */
export function resetVisionMediapipeRuntimeCaches(): void {
  visionFilesetPromise = null;
  visionFilesetBase = null;
  resetVisionMediapipeAssetWarmCache();
  for (const promise of poseLandmarkerByKey.values()) {
    void promise.then((lm) => lm.close()).catch(() => undefined);
  }
  poseLandmarkerByKey.clear();
  for (const promise of handLandmarkerByKey.values()) {
    void promise.then((lm) => lm.close()).catch(() => undefined);
  }
  handLandmarkerByKey.clear();
  for (const promise of faceLandmarkerByKey.values()) {
    void promise.then((lm) => lm.close()).catch(() => undefined);
  }
  faceLandmarkerByKey.clear();
  for (const promise of objectDetectorByKey.values()) {
    void promise.then((lm) => lm.close()).catch(() => undefined);
  }
  objectDetectorByKey.clear();
  releaseAllVisionExpansionWorkers();
}
