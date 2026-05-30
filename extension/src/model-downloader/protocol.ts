/**
 * Model Downloader WebSocket bridge protocol.
 * Types and topic constants for UI ↔ Bridge communication over the T3D WebSocket broker.
 * Platform-agnostic (no Node deps) so the hook can import from webview.
 */

/** Config sent with each request. */
export interface ModelDownloaderRequestConfig {
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
}

/** Request: list models. */
export interface ListRequest {
  requestId: string;
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
  page?: number;
  limit?: number;
}

/** Response: list models. */
export interface ListResponse {
  requestId: string;
  data?: unknown[];
  pagination?: Record<string, unknown>;
  error?: string;
}

/** Request: get model info. */
export interface InfoRequest {
  requestId: string;
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
  productId: string;
}

/** Response: get model info. */
export interface InfoResponse {
  requestId: string;
  modelInfo?: unknown;
  error?: string;
}

/** Request: download model. */
export interface DownloadRequest {
  requestId: string;
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
  productId: string;
  outputDir: string;
  metadataOnly?: boolean;
  includeSourceZip?: boolean;
}

/** Request: download model for browser (returns file contents, no disk write). */
export interface DownloadBrowserRequest {
  requestId: string;
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
  productId: string;
}

/** File content for browser download. */
export interface DownloadedFileContent {
  label: string;
  filename: string;
  contentBase64: string;
  size: number;
}

/** Response: download model for browser. */
export interface DownloadBrowserResponse {
  requestId: string;
  downloadResult?: {
    productId: string;
    files: DownloadedFileContent[];
    totalSize: number;
  };
  error?: string;
}

/** Downloaded file entry. */
export interface DownloadedFile {
  label: string;
  filepath: string;
  size: number;
}

/** Response: download model. */
export interface DownloadResponse {
  requestId: string;
  downloadResult?: {
    productId: string;
    downloadedFiles: DownloadedFile[];
    totalSize: number;
    outputDir: string;
  };
  error?: string;
}

/** Error payload. */
export interface ErrorPayload {
  requestId: string;
  error: string;
}

/** Download progress (bridge → client). */
export interface DownloadProgressPayload {
  requestId: string;
  phase: "listing" | "downloading" | "writing" | "done";
  percent: number;
  label?: string;
  fileIndex?: number;
  totalFiles?: number;
}

/** One file in browser download (bridge → client). Avoids single huge message. */
export interface DownloadBrowserFilePayload {
  requestId: string;
  productId: string;
  fileIndex: number;
  totalFiles: number;
  file: DownloadedFileContent;
}

/** Browser download complete (bridge → client). */
export interface DownloadBrowserCompletePayload {
  requestId: string;
  productId: string;
  totalSize: number;
  error?: string;
}

export type DownloadJobState =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type DownloadJobEventType =
  | "started"
  | "progress"
  | "fileSaved"
  | "completed"
  | "failed"
  | "cancelled";

export interface DownloadJobStartRequest {
  requestId: string;
  baseUrl: string;
  apiKey: string;
  caCertPath?: string;
  productId: string;
  outputDir?: string;
  includeSourceZip?: boolean;
}

export interface DownloadJobStartResponse {
  requestId: string;
  jobId?: string;
  state?: DownloadJobState;
  error?: string;
}

export interface DownloadJobStatusRequest {
  requestId: string;
  jobId: string;
}

export interface DownloadJobStatusResponse {
  requestId: string;
  jobId: string;
  state?: DownloadJobState;
  progress?: DownloadProgressPayload;
  result?: {
    productId: string;
    downloadedFiles: DownloadedFile[];
    totalSize: number;
    outputDir: string;
  };
  error?: string;
}

export interface DownloadJobCancelRequest {
  requestId: string;
  jobId: string;
}

export interface DownloadJobCancelResponse {
  requestId: string;
  jobId: string;
  cancelled: boolean;
  error?: string;
}

export interface DownloadJobEventPayload {
  jobId: string;
  state: DownloadJobState;
  eventType: DownloadJobEventType;
  progress?: DownloadProgressPayload;
  result?: {
    productId: string;
    downloadedFiles: DownloadedFile[];
    totalSize: number;
    outputDir: string;
  };
  error?: string;
  message?: string;
}

/** Local catalog: list GLB/GLTF under `src/assets/tesaiot/models` (and monorepo `assets/tesaiot/models` when scanned by the bridge). */
export interface CatalogListDownloadedRequest {
  requestId: string;
}

export interface CatalogListDownloadedEntry {
  id: string;
  productId: string;
  name: string;
  category: string;
  fileType: "glb" | "gltf";
  fileName: string;
  sizeBytes?: number;
  updatedAtMs?: number;
  metadataJson?: unknown;
  modelWebPath?: string;
  thumbnailWebPath?: string;
  /** Project-relative posix path (for dev URL and dedupe). */
  webPath: string;
  dedupeKey: string;
}

export interface CatalogListDownloadedResponse {
  requestId: string;
  models?: CatalogListDownloadedEntry[];
  error?: string;
}

export interface CatalogModelPropertiesRequest {
  requestId: string;
  webPath: string;
}

export interface CatalogModelProperties {
  cameraCount: number;
  lightCount: number;
  clipCount: number;
}

export interface CatalogModelPropertiesResponse {
  requestId: string;
  properties?: CatalogModelProperties;
  error?: string;
}

/** Resolve default on-disk base folder for Model Loader (extension globalStorage or dev tree). */
export interface ModelDownloaderDefaultOutputRequest {
  requestId: string;
}

export interface ModelDownloaderDefaultOutputResponse {
  requestId: string;
  /** Absolute FS path of the base downloads folder (same semantics as optional job `outputDir`). */
  defaultOutputBaseDir?: string;
  error?: string;
}

/** One row from GitHub tree (under `assets/`). */
export interface FreeAssetIndexEntry {
  repoPath: string;
  relativePath: string;
  sizeBytes: number | null;
}

/** List blobs under `assets/` (no download). */
export interface FreeAssetsListRequest {
  requestId: string;
}

export interface FreeAssetsListResponse {
  requestId: string;
  entries?: FreeAssetIndexEntry[];
  /** Bridge default download root (same as sync when outputDir omitted). */
  defaultOutputRootDir?: string;
  error?: string;
}

/** Fast: resolve default output dir without listing GitHub. */
export interface FreeAssetsDefaultPathRequest {
  requestId: string;
}

export interface FreeAssetsDefaultPathResponse {
  requestId: string;
  defaultOutputRootDir?: string;
  error?: string;
}

/** One file on disk under the Free pack root (extension globalStorage `assets/free` or bridge dev tree). */
export interface FreeLocalAssetEntry {
  relativePath: string;
  sizeBytes: number;
  modifiedAtMs: number;
}

export interface FreeAssetsLocalListRequest {
  requestId: string;
}

export interface FreeAssetsLocalListResponse {
  requestId: string;
  /** Absolute root that was scanned (for display). */
  rootFs?: string;
  entries?: FreeLocalAssetEntry[];
  error?: string;
}

/** Free GitHub pack sync (ternion-3d-assets-free → local dir). */
export interface FreeAssetsSyncRequest {
  requestId: string;
  /** Optional override; default from bridge resolves monorepo **assets/tesaiot/models** or **TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR** (no **t3d-extension/src/assets** fallback). */
  outputDir?: string;
  /** If set, download only these full repo paths (`assets/...`). */
  onlyRepoPaths?: string[];
}

export interface FreeAssetsSyncProgressPayload {
  requestId: string;
  phase: "listing" | "downloading" | "done" | "error";
  percent: number;
  currentPath?: string;
  fileIndex?: number;
  totalFiles?: number;
}

export interface FreeAssetsSyncResponse {
  requestId: string;
  downloaded?: number;
  totalBytes?: number;
  totalFiles?: number;
  outputRootDir?: string;
  errors?: string[];
  error?: string;
}

export const FREE_ASSETS_SYNC_TOPICS = {
  LIST: "free-assets-sync/list",
  LIST_RESPONSE: "free-assets-sync/list-response",
  LOCAL_LIST: "free-assets-sync/local-list",
  LOCAL_LIST_RESPONSE: "free-assets-sync/local-list-response",
  DEFAULT_PATH: "free-assets-sync/default-path",
  DEFAULT_PATH_RESPONSE: "free-assets-sync/default-path-response",
  REQUEST: "free-assets-sync/request",
  PROGRESS: "free-assets-sync/progress",
  RESPONSE: "free-assets-sync/response",
} as const;

export const MODEL_DOWNLOADER_TOPICS = {
  LIST: "model-downloader/list",
  LIST_RESPONSE: "model-downloader/list-response",
  CATALOG_LIST_DOWNLOADED: "model-downloader/catalog-list-downloaded",
  CATALOG_LIST_DOWNLOADED_RESPONSE: "model-downloader/catalog-list-downloaded-response",
  CATALOG_MODEL_PROPERTIES: "model-downloader/catalog-model-properties",
  CATALOG_MODEL_PROPERTIES_RESPONSE: "model-downloader/catalog-model-properties-response",
  DEFAULT_OUTPUT: "model-downloader/default-output",
  DEFAULT_OUTPUT_RESPONSE: "model-downloader/default-output-response",
  INFO: "model-downloader/info",
  INFO_RESPONSE: "model-downloader/info-response",
  DOWNLOAD: "model-downloader/download",
  DOWNLOAD_RESPONSE: "model-downloader/download-response",
  DOWNLOAD_PROGRESS: "model-downloader/download-progress",
  DOWNLOAD_BROWSER: "model-downloader/download-browser",
  DOWNLOAD_BROWSER_RESPONSE: "model-downloader/download-browser-response",
  DOWNLOAD_BROWSER_FILE: "model-downloader/download-browser-file",
  DOWNLOAD_BROWSER_COMPLETE: "model-downloader/download-browser-complete",
  DOWNLOAD_JOB_START: "model-downloader/download-job-start",
  DOWNLOAD_JOB_START_RESPONSE: "model-downloader/download-job-start-response",
  DOWNLOAD_JOB_STATUS: "model-downloader/download-job-status",
  DOWNLOAD_JOB_STATUS_RESPONSE: "model-downloader/download-job-status-response",
  DOWNLOAD_JOB_CANCEL: "model-downloader/download-job-cancel",
  DOWNLOAD_JOB_CANCEL_RESPONSE: "model-downloader/download-job-cancel-response",
  DOWNLOAD_JOB_EVENT: "model-downloader/download-job-event",
  ERROR: "model-downloader/error",
} as const;

export type ModelDownloaderTopic =
  (typeof MODEL_DOWNLOADER_TOPICS)[keyof typeof MODEL_DOWNLOADER_TOPICS];
