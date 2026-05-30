import type {
  ModelLoaderConfig,
  ModelLoaderDownloadResult,
  ModelLoaderJobEvent,
  ModelLoaderJobState,
  ModelLoaderListResult,
  ModelLoaderLocalEntry,
  ModelLoaderModelProperties,
  ModelLoaderRuntimeStatus,
} from "../types";

export interface ModelLoaderRuntimePort {
  status: ModelLoaderRuntimeStatus;
  loading: boolean;
  error: string | null;
  /** Clears the last runtime error (e.g. after showing a dialog). */
  clearError: () => void;
  downloadProgressPercent: number | null;
  latestJobEvent: ModelLoaderJobEvent | null;
  loadConfig: () => Promise<ModelLoaderConfig>;
  saveConfig: (config: ModelLoaderConfig) => Promise<void>;
  listModels: (
    config: ModelLoaderConfig,
    page: number,
    limit: number
  ) => Promise<ModelLoaderListResult>;
  getModelInfo: (
    config: ModelLoaderConfig,
    productId: string
  ) => Promise<unknown>;
  downloadModel: (
    config: ModelLoaderConfig,
    productId: string,
    outputDir: string,
    includeSourceZip?: boolean
  ) => Promise<ModelLoaderDownloadResult>;
  downloadModelInfoJson: (
    config: ModelLoaderConfig,
    productId: string,
    outputDir: string
  ) => Promise<ModelLoaderDownloadResult>;
  startDownloadJob: (
    config: ModelLoaderConfig,
    productId: string,
    outputDir: string,
    includeSourceZip?: boolean
  ) => Promise<string>;
  getDownloadJobStatus: (jobId: string) => Promise<ModelLoaderJobState>;
  cancelDownloadJob: (jobId: string) => Promise<boolean>;
  pickFolder: () => Promise<string | undefined>;
  /** Open a folder in the OS file manager (extension); browser may copy path instead. */
  revealFolder: (absolutePath: string) => Promise<void>;
  /** GLB/GLTF under globalStorage `tesaiot/models` and dev scan roots (`src/assets/...`). */
  listLocalDownloadedModels: () => Promise<ModelLoaderLocalEntry[]>;
  /** Reads properties directly from local model file content (.glb/.gltf). */
  getLocalModelProperties: (webPath: string) => Promise<ModelLoaderModelProperties>;
}
