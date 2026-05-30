export interface ModelLoaderConfig {
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
  /**
   * VS Code only: true when a secret exists in the extension host (the key is never sent to the webview).
   */
  hasStoredApiKey?: boolean;
}

export interface ModelLoaderModelEntry {
  productId: string;
  name: string;
  category: string;
  fileType?: "glb" | "gltf";
  sizeBytes?: number;
  updatedAtMs?: number;
  modelUrl?: string;
  thumbnailUrl?: string;
  raw: unknown;
}

/** GLB/GLTF on disk under downloads roots (extension or bridge scan). */
export interface ModelLoaderLocalEntry {
  id: string;
  productId: string;
  name: string;
  category: string;
  fileName: string;
  fileType: "glb" | "gltf";
  sizeBytes?: number;
  updatedAtMs?: number;
  metadataJson?: unknown;
  modelUrl?: string;
  modelWebPath?: string;
  thumbnailUrl?: string;
  thumbnailWebPath?: string;
  /** Project-relative path (posix-style). */
  webPath: string;
}

export interface ModelLoaderDetailsSelection {
  source: "local" | "online";
  id: string;
  productId: string;
  name: string;
  category: string;
  fileType?: "glb" | "gltf";
  sizeBytes?: number;
  updatedAtMs?: number;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  metadataJson?: unknown;
  thumbnailUrl?: string;
  modelUrl?: string;
  hasAnimations?: string;
  clipCount?: string;
  clips?: string;
}

export interface ModelLoaderModelProperties {
  cameraCount: number;
  lightCount: number;
  clipCount: number;
}

export interface ModelLoaderListResult {
  data: ModelLoaderModelEntry[];
  pagination: Record<string, unknown>;
}

export interface ModelLoaderDownloadFile {
  label: string;
  filepath: string;
  size: number;
}

export interface ModelLoaderDownloadResult {
  productId: string;
  downloadedFiles: ModelLoaderDownloadFile[];
  totalSize: number;
  outputDir: string;
}

export interface ModelLoaderDownloadProgress {
  phase: "listing" | "downloading" | "writing" | "done";
  percent: number;
  label?: string;
  fileIndex?: number;
  totalFiles?: number;
}

export type ModelLoaderJobStateValue =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ModelLoaderJobState {
  jobId: string;
  state: ModelLoaderJobStateValue;
  progress?: ModelLoaderDownloadProgress;
  result?: ModelLoaderDownloadResult;
  error?: string;
}

export interface ModelLoaderJobEvent {
  jobId: string;
  state: ModelLoaderJobStateValue;
  eventType:
    | "started"
    | "progress"
    | "fileSaved"
    | "completed"
    | "failed"
    | "cancelled";
  progress?: ModelLoaderDownloadProgress;
  result?: ModelLoaderDownloadResult;
  error?: string;
  message?: string;
}

export interface ModelLoaderRuntimeStatus {
  isExtension: boolean;
  supportsFolderPicker: boolean;
  defaultOutputDir: string;
  /** Runtime connection state used for auto-list readiness. */
  connectionState: "connected" | "connecting" | "disconnected" | "error";
  /** True when list/get requests can be sent immediately. */
  isReady: boolean;
}
