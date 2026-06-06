import type { VisionMediapipeEndpoints } from "./vision-mediapipe-endpoints";
import type { VisionPoseModelVariant } from "./vision-pose-config";

const WASM_FILES = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
] as const;

const ESTIMATED_WASM_FILE_BYTES = 2_125_000;
const ESTIMATED_POSE_LITE_BYTES = 5_800_000;
const ESTIMATED_POSE_FULL_BYTES = 9_500_000;
const ESTIMATED_POSE_HEAVY_BYTES = 29_000_000;

export type VisionMediapipeLoadPhase = "idle" | "assets" | "init" | "ready";

export type VisionMediapipeLoadProgressState = {
  active: boolean;
  phase: VisionMediapipeLoadPhase;
  percent: number | null;
  label: string;
};

const IDLE: VisionMediapipeLoadProgressState = {
  active: false,
  phase: "idle",
  percent: null,
  label: "",
};

type AssetEntry = {
  url: string;
  totalBytes: number;
  loadedBytes: number;
  done: boolean;
};

function joinUrl(base: string, file: string): string {
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}${file}`;
}

function estimatedModelBytes(variant: VisionPoseModelVariant): number {
  switch (variant) {
    case "full":
      return ESTIMATED_POSE_FULL_BYTES;
    case "heavy":
      return ESTIMATED_POSE_HEAVY_BYTES;
    default:
      return ESTIMATED_POSE_LITE_BYTES;
  }
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

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function formatVisionMediapipeLoadPercent(percent: number | null | undefined): string {
  if (percent == null || !Number.isFinite(percent)) {
    return "Loading…";
  }
  return `${clampPercent(percent).toFixed(2)}%`;
}

class VisionMediapipeLoadProgressHub {
  private state: VisionMediapipeLoadProgressState = { ...IDLE };
  private listeners = new Set<() => void>();

  getState(): VisionMediapipeLoadProgressState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(next: VisionMediapipeLoadProgressState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener();
    }
  }

  reportAssets(ratio: number | null): void {
    this.setState({
      active: true,
      phase: "assets",
      percent: ratio == null ? null : clampPercent(ratio * 92),
      label: "Downloading MediaPipe assets",
    });
  }

  reportInit(ratio: number): void {
    this.setState({
      active: true,
      phase: "init",
      percent: clampPercent(92 + ratio * 8),
      label: "Starting pose model",
    });
  }

  markReady(): void {
    this.setState({
      active: false,
      phase: "ready",
      percent: 100,
      label: "",
    });
  }

  reset(): void {
    this.setState({ ...IDLE });
  }
}

export const visionMediapipeLoadProgress = new VisionMediapipeLoadProgressHub();

const warmedUrls = new Set<string>();
const loadPromises = new Map<string, Promise<void>>();

async function headOrEstimate(url: string, fallback: number): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      return fallback;
    }
    const raw = res.headers.get("content-length");
    const n = raw != null ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

async function prefetchBinary(
  url: string,
  onChunk: (loadedBytes: number) => void,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (${res.status})`);
  }
  const reader = res.body?.getReader();
  if (reader == null) {
    await res.arrayBuffer();
    return;
  }
  let loaded = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    loaded += chunk.value.byteLength;
    onChunk(loaded);
  }
}

export function resetVisionMediapipeAssetWarmCache(): void {
  warmedUrls.clear();
  loadPromises.clear();
  visionMediapipeLoadProgress.reset();
}

export async function ensurePoseLandmarkerAssetsLoaded(args: {
  endpoints: VisionMediapipeEndpoints;
  modelVariant: VisionPoseModelVariant;
}): Promise<void> {
  const modelUrl = poseModelUrl(args.modelVariant, args.endpoints);
  const sessionKey = `${args.endpoints.wasmBase}|${modelUrl}`;
  let promise = loadPromises.get(sessionKey);
  if (promise != null) {
    return promise;
  }

  promise = (async () => {
    const wasmUrls = WASM_FILES.map((file) => joinUrl(args.endpoints.wasmBase, file));
    const assets: AssetEntry[] = [];
    for (const url of wasmUrls) {
      assets.push({
        url,
        totalBytes: await headOrEstimate(url, ESTIMATED_WASM_FILE_BYTES),
        loadedBytes: warmedUrls.has(url) ? await headOrEstimate(url, ESTIMATED_WASM_FILE_BYTES) : 0,
        done: warmedUrls.has(url),
      });
    }
    assets.push({
      url: modelUrl,
      totalBytes: await headOrEstimate(modelUrl, estimatedModelBytes(args.modelVariant)),
      loadedBytes: warmedUrls.has(modelUrl)
        ? await headOrEstimate(modelUrl, estimatedModelBytes(args.modelVariant))
        : 0,
      done: warmedUrls.has(modelUrl),
    });

    const report = () => {
      let loaded = 0;
      let total = 0;
      for (const asset of assets) {
        total += asset.totalBytes;
        loaded += asset.done ? asset.totalBytes : Math.min(asset.loadedBytes, asset.totalBytes);
      }
      visionMediapipeLoadProgress.reportAssets(total > 0 ? loaded / total : null);
    };

    report();

    for (const asset of assets) {
      if (asset.done) {
        continue;
      }
      await prefetchBinary(asset.url, (loadedBytes) => {
        asset.loadedBytes = loadedBytes;
        report();
      });
      asset.loadedBytes = asset.totalBytes;
      asset.done = true;
      warmedUrls.add(asset.url);
      report();
    }

    visionMediapipeLoadProgress.reportAssets(1);
  })().catch((err) => {
    loadPromises.delete(sessionKey);
    visionMediapipeLoadProgress.reset();
    throw err;
  });

  loadPromises.set(sessionKey, promise);
  return promise;
}

export async function runPoseLandmarkerInitProgress<T>(run: () => Promise<T>): Promise<T> {
  visionMediapipeLoadProgress.reportInit(0.1);
  try {
    const result = await run();
    visionMediapipeLoadProgress.reportInit(1);
    visionMediapipeLoadProgress.markReady();
    return result;
  } catch (err) {
    visionMediapipeLoadProgress.reset();
    throw err;
  }
}

const ESTIMATED_HAND_MODEL_BYTES = 3_800_000;
const ESTIMATED_FACE_MODEL_BYTES = 3_600_000;
const ESTIMATED_OBJECT_MODEL_BYTES = 4_200_000;

export async function ensureExpansionTaskAssetsLoaded(args: {
  task: "hands" | "face" | "object";
  endpoints: VisionMediapipeEndpoints;
}): Promise<void> {
  const modelUrl =
    args.task === "hands"
      ? args.endpoints.handUrl
      : args.task === "face"
        ? args.endpoints.faceUrl
        : args.endpoints.objectUrl;
  const estimatedBytes =
    args.task === "hands"
      ? ESTIMATED_HAND_MODEL_BYTES
      : args.task === "face"
        ? ESTIMATED_FACE_MODEL_BYTES
        : ESTIMATED_OBJECT_MODEL_BYTES;
  const sessionKey = `${args.endpoints.wasmBase}|${args.task}|${modelUrl}`;
  let promise = loadPromises.get(sessionKey);
  if (promise != null) {
    return promise;
  }

  promise = (async () => {
    const wasmUrls = WASM_FILES.map((file) => joinUrl(args.endpoints.wasmBase, file));
    const assets: AssetEntry[] = [];
    for (const url of wasmUrls) {
      assets.push({
        url,
        totalBytes: await headOrEstimate(url, ESTIMATED_WASM_FILE_BYTES),
        loadedBytes: warmedUrls.has(url) ? await headOrEstimate(url, ESTIMATED_WASM_FILE_BYTES) : 0,
        done: warmedUrls.has(url),
      });
    }
    assets.push({
      url: modelUrl,
      totalBytes: await headOrEstimate(modelUrl, estimatedBytes),
      loadedBytes: warmedUrls.has(modelUrl)
        ? await headOrEstimate(modelUrl, estimatedBytes)
        : 0,
      done: warmedUrls.has(modelUrl),
    });

    const report = () => {
      let loaded = 0;
      let total = 0;
      for (const asset of assets) {
        total += asset.totalBytes;
        loaded += asset.done ? asset.totalBytes : Math.min(asset.loadedBytes, asset.totalBytes);
      }
      visionMediapipeLoadProgress.reportAssets(total > 0 ? loaded / total : null);
    };

    report();
    for (const asset of assets) {
      if (asset.done) {
        continue;
      }
      await prefetchBinary(asset.url, (loadedBytes) => {
        asset.loadedBytes = loadedBytes;
        report();
      });
      asset.loadedBytes = asset.totalBytes;
      asset.done = true;
      warmedUrls.add(asset.url);
      report();
    }
    visionMediapipeLoadProgress.reportAssets(1);
  })().catch((err) => {
    loadPromises.delete(sessionKey);
    visionMediapipeLoadProgress.reset();
    throw err;
  });

  loadPromises.set(sessionKey, promise);
  return promise;
}
