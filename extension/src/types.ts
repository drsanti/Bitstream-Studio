export interface MqttMessage {
  topic: string;
  payload: string;
}

export interface WebviewMessage {
  type:
  | 'mqtt-publish'
  | 'mqtt-subscribe'
  | 'mqtt-unsubscribe'
  | 'mqtt-connect'
  | 'mqtt-restart'
  | 'mqtt-get-status'
  | 'mqtt-update-ports'
  | 'mqtt-get-clients'
  | 'mqtt-save-config'
  | 'mqtt-load-config'
  | 'mqtt-clear-config'
  | 'open-panel'
  | 'reload-webview'
  | 'reload-window'
  | 'toggle-dev-tools'
  | 'ca-cert-install'
  | 'asset-get-base-url'
  | 'asset-update-base-url'
  | 'asset-reload'
  | 'asset-config'
  | 'asset-sync-free-pack-start'
  | 'asset-free-pack-list'
  | 'asset-free-local-list'
  | 'reveal-path-in-os'
  | 'asset-get-default-download-paths'
  | 'serial-bridge-start'
  | 'serial-bridge-stop'
  | 'serial-bridge-get-status'
  | 'ai-bridge-start'
  | 'ai-bridge-stop'
  | 'ai-bridge-get-status'
  | 'model-downloader-list'
  | 'model-downloader-info'
  | 'model-downloader-download'
  | 'model-downloader-set-config'
  | 'model-downloader-get-config'
  | 'model-downloader-pick-folder'
  | 'model-loader-list'
  | 'model-loader-info'
  | 'model-loader-download'
  | 'model-loader-download-start'
  | 'model-loader-download-status'
  | 'model-loader-download-cancel'
  | 'model-loader-list-local-models'
  | 'model-loader-model-properties'
  | 'model-catalog-get-downloaded-models'
  | 'get-local-ips'
  | 'system-settings-get'
  | 'system-settings-update'
  | 'bitstream-dashboard-config-pull'
  | 'bitstream-dashboard-config-push'
  | 'ternion-quick-action-toggle'
  | 'bitstream-simulator-start'
  | 'bitstream-simulator-stop';
  topic?: string;
  payload?: string;
  brokerUrl?: string;
  options?: Record<string, unknown>;
  mqttPort?: number;
  wsPort?: number;
  config?: unknown;
  certContent?: string;
  certPath?: string;
  baseUrl?: string;
  portPath?: string;
  data?: string | Buffer;
  productId?: string;
  page?: number;
  limit?: number;
  outputDir?: string;
  metadataOnly?: boolean;
  includeSourceZip?: boolean;
  apiKey?: string;
  caCertPath?: string;
  requestId?: string;
  jobId?: string;
  webPath?: string;
  /** Subset sync: full repo paths `assets/...` */
  onlyRepoPaths?: string[];
  /** Absolute directory to reveal in OS file manager (validated server-side). */
  absolutePath?: string;
  /** JSON string of persisted Bitstream dashboard fields (mirror file in extension global storage). */
  configJson?: string;
  /** When true (default), host starts serial bridge before launching external simulator. */
  ensureBackends?: boolean;
}

export interface ExtensionMessage {
  type:
  | 'mqtt-message'
  | 'mqtt-connected'
  | 'mqtt-disconnected'
  | 'mqtt-error'
  | 'mqtt-status'
  | 'mqtt-clients'
  | 'mqtt-ports-changed'
  | 'mqtt-config-loaded'
  | 'ca-cert-install-result'
  | 'asset-base-url-changed'
  | 'asset-base-url-response'
  | 'asset-config-response'
  | 'serial-bridge-status'
  | 'serial-bridge-status-changed'
  | 'ai-bridge-status'
  | 'model-downloader-list-response'
  | 'model-downloader-info-response'
  | 'model-downloader-download-response'
  | 'model-downloader-config-response'
  | 'model-downloader-pick-folder-response'
  | 'model-downloader-error'
  | 'model-loader-list-response'
  | 'model-loader-info-response'
  | 'model-loader-download-response'
  | 'model-loader-download-start-response'
  | 'model-loader-download-status-response'
  | 'model-loader-download-cancel-response'
  | 'model-loader-list-local-models-response'
  | 'model-loader-model-properties-response'
  | 'model-catalog-downloaded-models-response'
  | 'model-loader-error'
  | 'get-local-ips-response'
  | 'asset-sync-free-pack-progress'
  | 'asset-sync-free-pack-complete'
  | 'asset-free-pack-list-response'
  | 'asset-free-local-list-response'
  | 'asset-reveal-path-result'
  | 'asset-default-download-paths-response'
  | 'bitstream-dashboard-config-response'
  | 'bitstream-simulator-start-response'
  | 'bitstream-simulator-stop-response';
  topic?: string;
  localIps?: string[];
  payload?: string;
  error?: string;
  mqttPort?: number;
  wsPort?: number;
  config?: unknown;
  success?: boolean;
  message?: string;
  baseUrl?: string;
  requestId?: string;
  listData?: unknown[];
  pagination?: Record<string, unknown>;
  modelInfo?: unknown;
  downloadResult?: {
    productId: string;
    downloadedFiles: Array<{ label: string; filepath: string; size: number }>;
    totalSize: number;
    outputDir: string;
  };
  jobId?: string;
  jobState?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  cancelled?: boolean;
  progress?: {
    phase: 'listing' | 'downloading' | 'writing' | 'done';
    percent: number;
    label?: string;
    fileIndex?: number;
    totalFiles?: number;
  };
  downloadedModels?: Array<{
    id: string;
    productId: string;
    name: string;
    category: string;
    fileType: "glb" | "gltf";
    fileName?: string;
    sizeBytes?: number;
    updatedAtMs?: number;
    url: string;
    catalogCategory: "downloaded";
    dedupeKey: string;
    modelSource: "dynamic";
  }>;
  localModels?: Array<{
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
    webPath: string;
  }>;
  modelProperties?: {
    cameraCount: number;
    lightCount: number;
    clipCount: number;
  };
  modelDownloaderConfig?: {
    baseUrl: string;
    hasApiKey: boolean;
    caCertPath?: string;
  };
  selectedFolder?: string;
  assetConfig?: {
    localAssetsBaseUrl: string;
    freeAssetsBaseUrl?: string;
    tesaiotTexturesBaseUrl?: string;
    onlineAssetsBaseUrl: string;
    currentBaseUrl: string;
  };
  status?: {
    running: boolean;
    mqttPort: number | null;
    wsPort: number | null;
    uptime: number;
    connections: number;
  };
  clients?: Array<{
    id: string;
    connected: boolean;
    protocol: 'tcp' | 'ws';
  }>;
  timestamp?: number;
  /** Free-assets sync (GitHub → pack root under assets/) */
  assetSyncProgress?: {
    phase: 'listing' | 'downloading' | 'done' | 'error';
    percent: number;
    currentPath?: string;
    fileIndex?: number;
    totalFiles?: number;
  };
  assetSyncResult?: {
    downloaded: number;
    totalBytes: number;
    outputRootDir: string;
    errors: string[];
  };
  /** Free GitHub index rows (LIST) */
  freeAssetIndexEntries?: Array<{
    repoPath: string;
    relativePath: string;
    sizeBytes: number | null;
  }>;
  /** Files on disk under Free pack root */
  freeLocalAssetEntries?: Array<{
    relativePath: string;
    sizeBytes: number;
    modifiedAtMs: number;
  }>;
  /** Scanned directory for free local list */
  freeLocalRootFs?: string;
  revealPathOk?: boolean;
  revealPathError?: string;
  defaultDownloadPaths?: {
    freeGithubRootFs: string;
    modelDownloadsRootFs: string;
    tesaiotTexturesRootFs: string;
    userAssetsRootFs: string;
  };
  /** Present when list / paths request fails */
  listError?: string;
  /** Host mirror of `bitstream-dashboard-config-v2` JSON; null when file is missing. */
  configJson?: string | null;
}

