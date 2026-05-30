import {
  FREE_MODELS_WEB_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
} from "../assetLayout";
import {
  getStandaloneModelCatalogScanRoots,
  resolveStandaloneModelLoaderBaseDir,
} from "../standaloneBridgeAssetLayout";
import {
  getBridgeModelDownloadsRoot,
  getBridgeUserAssetsRoot,
} from "./bridgeDefaultPaths";
import { T3DWebSocketClient } from "../websocket/T3DWebSocketClient";
import { T3D_MODEL_LOADER_WS_CLIENT_URL } from "../websocket/T3DWebSocketConfig";
import { createModelDownloaderService } from "./ModelDownloaderService";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  MODEL_DOWNLOADER_TOPICS,
  type ListRequest,
  type ListResponse,
  type InfoRequest,
  type InfoResponse,
  type DownloadRequest,
  type DownloadResponse,
  type DownloadProgressPayload,
  type DownloadBrowserRequest,
  type DownloadBrowserResponse,
  type DownloadBrowserFilePayload,
  type DownloadBrowserCompletePayload,
  type DownloadJobStartRequest,
  type DownloadJobStartResponse,
  type DownloadJobStatusRequest,
  type DownloadJobStatusResponse,
  type DownloadJobCancelRequest,
  type DownloadJobCancelResponse,
  type DownloadJobEventPayload,
  type DownloadJobState,
  type CatalogListDownloadedRequest,
  type CatalogListDownloadedResponse,
  type CatalogListDownloadedEntry,
  type CatalogModelPropertiesRequest,
  type CatalogModelPropertiesResponse,
  type ModelDownloaderDefaultOutputRequest,
  type ModelDownloaderDefaultOutputResponse,
} from "./protocol";
import { readLocalModelFileProperties } from "./local-model-properties";
import {
  syncTernionFreeAssets,
  resolveDefaultBridgeFreeAssetsOutputDir,
  getTernionFreeAssetsIndex,
} from "../asset-sync/syncTernionFreeAssets";
import {
  listFreeLocalAssetFiles,
  resolveBridgeFreeLocalPackRootDir,
} from "../asset-sync/listFreeLocalAssetFiles";
import {
  FREE_ASSETS_SYNC_TOPICS,
  type FreeAssetsDefaultPathRequest,
  type FreeAssetsDefaultPathResponse,
  type FreeAssetsListRequest,
  type FreeAssetsListResponse,
  type FreeAssetsLocalListRequest,
  type FreeAssetsLocalListResponse,
  type FreeAssetsSyncRequest,
  type FreeAssetsSyncProgressPayload,
  type FreeAssetsSyncResponse,
} from "./protocol";

export interface ModelDownloaderBridgeConfig {
  wsUrl?: string;
}

/** In-memory download job row (Map value); explicit type so async closure can assign optional fields. */
type ModelDownloaderBridgeJob = {
  jobId: string;
  requestId: string;
  productId: string;
  state: DownloadJobState;
  progress?: DownloadProgressPayload;
  result?: NonNullable<DownloadJobStatusResponse["result"]>;
  error?: string;
  outputDir: string;
  cancelRequested?: boolean;
};

let bridgeInstance: ModelDownloaderWebSocketBridge | null = null;

/**
 * Model Downloader WebSocket bridge.
 * Connects to T3D WebSocket broker, handles list/info/download requests via ModelDownloaderService.
 */
export class ModelDownloaderWebSocketBridge {
  private client: T3DWebSocketClient;
  private config: { wsUrl: string };
  private jobs = new Map<string, ModelDownloaderBridgeJob>();

  constructor(config: ModelDownloaderBridgeConfig = {}) {
    this.config = { wsUrl: config.wsUrl ?? T3D_MODEL_LOADER_WS_CLIENT_URL };
    this.client = new T3DWebSocketClient(
      {
        url: this.config.wsUrl,
        autoConnect: false,
        clientIdentity: {
          role: 'model-downloader-bridge',
          name: 'ModelDownloaderWebSocketBridge',
        },
      },
      {
        onConnect: () => this.onWsConnect(),
        onMessage: (topic, payload) => this.onWsMessage(topic, payload),
        onError: (err) =>
          console.error("[model-downloader-bridge] WS error:", err.message),
      }
    );
  }

  private async onWsConnect(): Promise<void> {
    await this.subscribeCommands();
    console.log("[model-downloader-bridge] Connected to broker");
  }

  private async subscribeCommands(): Promise<void> {
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.LIST, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.INFO, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_START, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.CATALOG_LIST_DOWNLOADED, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.CATALOG_MODEL_PROPERTIES, 0, "json");
    await this.client.subscribe(MODEL_DOWNLOADER_TOPICS.DEFAULT_OUTPUT, 0, "json");
    await this.client.subscribe(FREE_ASSETS_SYNC_TOPICS.LIST, 0, "json");
    await this.client.subscribe(FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST, 0, "json");
    await this.client.subscribe(FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH, 0, "json");
    await this.client.subscribe(FREE_ASSETS_SYNC_TOPICS.REQUEST, 0, "json");
  }

  private async onWsMessage(topic: string, payload: unknown): Promise<void> {
    if (topic === MODEL_DOWNLOADER_TOPICS.LIST) {
      await this.handleList(payload as ListRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.INFO) {
      await this.handleInfo(payload as InfoRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD) {
      await this.handleDownload(payload as DownloadRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER) {
      await this.handleDownloadBrowser(payload as DownloadBrowserRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_START) {
      await this.handleDownloadJobStart(payload as DownloadJobStartRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS) {
      await this.handleDownloadJobStatus(payload as DownloadJobStatusRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL) {
      await this.handleDownloadJobCancel(payload as DownloadJobCancelRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.CATALOG_LIST_DOWNLOADED) {
      await this.handleCatalogListDownloaded(payload as CatalogListDownloadedRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.CATALOG_MODEL_PROPERTIES) {
      await this.handleCatalogModelProperties(payload as CatalogModelPropertiesRequest);
      return;
    }
    if (topic === MODEL_DOWNLOADER_TOPICS.DEFAULT_OUTPUT) {
      await this.handleDefaultOutput(payload as ModelDownloaderDefaultOutputRequest);
      return;
    }
    if (topic === FREE_ASSETS_SYNC_TOPICS.LIST) {
      await this.handleFreeAssetsList(payload as FreeAssetsListRequest);
      return;
    }
    if (topic === FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST) {
      await this.handleFreeAssetsLocalList(payload as FreeAssetsLocalListRequest);
      return;
    }
    if (topic === FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH) {
      await this.handleFreeAssetsDefaultPath(payload as FreeAssetsDefaultPathRequest);
      return;
    }
    if (topic === FREE_ASSETS_SYNC_TOPICS.REQUEST) {
      await this.handleFreeAssetsSync(payload as FreeAssetsSyncRequest);
      return;
    }
  }

  private async handleFreeAssetsList(req: FreeAssetsListRequest): Promise<void> {
    const requestId = req.requestId;
    try {
      const defaultOutputRootDir = resolveDefaultBridgeFreeAssetsOutputDir();
      const rows = await getTernionFreeAssetsIndex({
        githubToken: process.env.GITHUB_TOKEN,
      });
      const response: FreeAssetsListResponse = {
        requestId,
        defaultOutputRootDir,
        entries: rows.map((r) => ({
          repoPath: r.repoPath,
          relativePath: r.relativePath,
          sizeBytes: r.sizeBytes,
        })),
      };
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.LIST_RESPONSE, response, 0);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const response: FreeAssetsListResponse = {
        requestId,
        error: errMsg,
      };
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.LIST_RESPONSE, response, 0);
    }
  }

  private async handleFreeAssetsLocalList(
    req: FreeAssetsLocalListRequest
  ): Promise<void> {
    const requestId = req.requestId;
    try {
      const rootFs = resolveBridgeFreeLocalPackRootDir();
      const rows = await listFreeLocalAssetFiles(rootFs);
      const response: FreeAssetsLocalListResponse = {
        requestId,
        rootFs,
        entries: rows.map((r) => ({
          relativePath: r.relativePath,
          sizeBytes: r.sizeBytes,
          modifiedAtMs: r.modifiedAtMs,
        })),
      };
      void this.client.publish(
        FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST_RESPONSE,
        response,
        0
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const response: FreeAssetsLocalListResponse = {
        requestId,
        error: errMsg,
      };
      void this.client.publish(
        FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST_RESPONSE,
        response,
        0
      );
    }
  }

  private async handleFreeAssetsDefaultPath(
    req: FreeAssetsDefaultPathRequest
  ): Promise<void> {
    const requestId = req.requestId;
    try {
      const response: FreeAssetsDefaultPathResponse = {
        requestId,
        defaultOutputRootDir: resolveDefaultBridgeFreeAssetsOutputDir(),
      };
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH_RESPONSE, response, 0);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const response: FreeAssetsDefaultPathResponse = {
        requestId,
        error: errMsg,
      };
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH_RESPONSE, response, 0);
    }
  }

  private async handleFreeAssetsSync(req: FreeAssetsSyncRequest): Promise<void> {
    const requestId = req.requestId;
    const publishProgress = (p: FreeAssetsSyncProgressPayload) => {
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.PROGRESS, p, 0);
    };
    try {
      const outputDir =
        req.outputDir?.trim() || resolveDefaultBridgeFreeAssetsOutputDir();
      const result = await syncTernionFreeAssets({
        outputRootDir: outputDir,
        githubToken: process.env.GITHUB_TOKEN,
        onlyRepoPaths:
          req.onlyRepoPaths && req.onlyRepoPaths.length > 0
            ? req.onlyRepoPaths
            : undefined,
        onProgress: (prog) => {
          publishProgress({
            requestId,
            phase: prog.phase,
            percent: prog.percent,
            currentPath: prog.currentPath,
            fileIndex: prog.fileIndex,
            totalFiles: prog.totalFiles,
          });
        },
      });
      const response: FreeAssetsSyncResponse = {
        requestId,
        downloaded: result.downloaded,
        totalBytes: result.totalBytes,
        outputRootDir: result.outputRootDir,
        errors: result.errors,
      };
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.RESPONSE, response, 0);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("[model-downloader-bridge] Free assets sync error:", errMsg);
      const response: FreeAssetsSyncResponse = {
        requestId,
        error: errMsg,
      };
      void this.client.publish(FREE_ASSETS_SYNC_TOPICS.RESPONSE, response, 0);
    }
  }

  private nextJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private emitJobEvent(payload: DownloadJobEventPayload): void {
    void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_EVENT, payload, 0);
  }

  private resolveDefaultModelLoaderBaseDir(): string {
    return resolveStandaloneModelLoaderBaseDir();
  }

  private getCatalogScanRoots(): string[] {
    return getStandaloneModelCatalogScanRoots();
  }

  private resolveCatalogFileToAbsolute(webPath: string): string {
    const normalized = (webPath ?? "").trim().replace(/\\/g, "/");
    if (!normalized) {
      throw new Error("Missing webPath");
    }
    const asNative = normalized.replace(/\//g, path.sep);
    if (path.isAbsolute(asNative)) {
      return path.normalize(asNative);
    }
    const bridge = getBridgeModelDownloadsRoot();
    if (bridge && normalized.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
      const rest = normalized.slice(TESAIOT_MODELS_WEB_PREFIX.length);
      const segs = rest.split("/").filter((s) => s.length > 0);
      return path.normalize(path.join(path.resolve(bridge), ...segs));
    }
    const userAssets = getBridgeUserAssetsRoot();
    if (userAssets && normalized.startsWith("free/")) {
      const segments = normalized.split("/").filter((s) => s.length > 0);
      for (const seg of segments) {
        if (seg === ".." || seg === ".") {
          throw new Error("Invalid model path");
        }
      }
      return path.normalize(path.join(path.resolve(userAssets), ...segments));
    }
    if (normalized.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
      const rest = normalized.slice(TESAIOT_MODELS_WEB_PREFIX.length);
      const segs = rest.split("/").filter((s) => s.length > 0);
      const base = resolveStandaloneModelLoaderBaseDir();
      return path.normalize(path.join(base, ...segs));
    }
    if (normalized.startsWith(FREE_MODELS_WEB_PREFIX)) {
      const rest = normalized.slice(FREE_MODELS_WEB_PREFIX.length);
      const segs = rest.split("/").filter((s) => s.length > 0);
      const freePackRoot = path.resolve(resolveDefaultBridgeFreeAssetsOutputDir());
      return path.normalize(path.join(freePackRoot, "models", ...segs));
    }
    throw new Error(
      "Unsupported catalog path for this bridge (expected tesaiot/models/… or free/models/…)."
    );
  }

  private isPathUnderAllowedRoots(absPath: string): boolean {
    const resolved = path.resolve(absPath);
    for (const root of this.getCatalogScanRoots()) {
      const r = path.resolve(root);
      const pref = r.endsWith(path.sep) ? r : r + path.sep;
      if (resolved === r || resolved.startsWith(pref)) {
        return true;
      }
    }
    return false;
  }

  private resolveDefaultOutputDir(req: DownloadJobStartRequest): string {
    const base =
      req.outputDir?.trim() || this.resolveDefaultModelLoaderBaseDir();
    return this.resolveModelOutputDir(base, req.productId);
  }

  private resolveModelOutputDir(baseOutputDir: string, productId: string): string {
    const modelFolder = productId
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, "_");
    const safeModelFolder = modelFolder || "model";
    const baseName = path.basename(baseOutputDir);
    const looksLikeModelFolder = /^pdm-[a-z0-9_-]+$/i.test(baseName);
    const outputDir =
      baseName.toLowerCase() === safeModelFolder.toLowerCase()
        ? baseOutputDir
        : looksLikeModelFolder
          ? path.join(path.dirname(baseOutputDir), safeModelFolder)
          : path.join(baseOutputDir, safeModelFolder);
    fs.mkdirSync(outputDir, { recursive: true });
    return outputDir;
  }

  private async handleList(req: ListRequest): Promise<void> {
    const response: ListResponse = { requestId: req.requestId };
    try {
      const service = createModelDownloaderService({
        baseUrl: req.baseUrl,
        apiKey: req.apiKey,
        caCertPath: req.caCertPath,
      });
      const result = await service.listModels(
        req.page ?? 1,
        req.limit ?? 100
      );
      response.data = result.data;
      response.pagination = result.pagination;
    } catch (e) {
      response.error = e instanceof Error ? e.message : String(e);
      console.error("[model-downloader-bridge] List error:", response.error);
    }
    void this.client.publish(
      MODEL_DOWNLOADER_TOPICS.LIST_RESPONSE,
      response,
      0
    );
  }

  private async handleInfo(req: InfoRequest): Promise<void> {
    const response: InfoResponse = { requestId: req.requestId };
    try {
      const service = createModelDownloaderService({
        baseUrl: req.baseUrl,
        apiKey: req.apiKey,
        caCertPath: req.caCertPath,
      });
      const modelInfo = await service.getModelInfo(req.productId);
      response.modelInfo = modelInfo;
    } catch (e) {
      response.error = e instanceof Error ? e.message : String(e);
      console.error("[model-downloader-bridge] Info error:", response.error);
    }
    void this.client.publish(
      MODEL_DOWNLOADER_TOPICS.INFO_RESPONSE,
      response,
      0
    );
  }

  private async handleDownload(req: DownloadRequest): Promise<void> {
    const response: DownloadResponse = { requestId: req.requestId };
    try {
      const service = createModelDownloaderService({
        baseUrl: req.baseUrl,
        apiKey: req.apiKey,
        caCertPath: req.caCertPath,
      });
      const onProgress: (phase: "listing" | "downloading" | "writing" | "done", percent: number, label?: string, fileIndex?: number, totalFiles?: number) => void = (phase, percent, label, fileIndex, totalFiles) => {
        const payload: DownloadProgressPayload = {
          requestId: req.requestId,
          phase,
          percent,
          label,
          fileIndex,
          totalFiles,
        };
        void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_PROGRESS, payload, 0);
      };
      const outputDir = this.resolveModelOutputDir(
        req.outputDir?.trim() || this.resolveDefaultModelLoaderBaseDir(),
        req.productId
      );
      const downloadResult = req.metadataOnly
        ? await service.downloadModelMetadata(req.productId, outputDir, onProgress)
        : await service.downloadModel(
            req.productId,
            outputDir,
            onProgress,
            { includeSourceZip: req.includeSourceZip !== false }
          );
      response.downloadResult = downloadResult;
    } catch (e) {
      response.error = e instanceof Error ? e.message : String(e);
      console.error("[model-downloader-bridge] Download error:", response.error);
    }
    void this.client.publish(
      MODEL_DOWNLOADER_TOPICS.DOWNLOAD_RESPONSE,
      response,
      0
    );
  }

  private async handleDownloadBrowser(req: DownloadBrowserRequest): Promise<void> {
    const requestId = req.requestId;
    const productId = req.productId;
    try {
      const service = createModelDownloaderService({
        baseUrl: req.baseUrl,
        apiKey: req.apiKey,
        caCertPath: req.caCertPath,
      });
      const onProgress: (phase: "listing" | "downloading" | "writing" | "done", percent: number, label?: string, fileIndex?: number, totalFiles?: number) => void = (phase, percent, label, fileIndex, totalFiles) => {
        void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_PROGRESS, {
          requestId,
          phase,
          percent,
          label,
          fileIndex,
          totalFiles,
        } as DownloadProgressPayload, 0);
      };
      const result = await service.downloadModelToMemory(req.productId, {
        onProgress,
        onFile: (file, fileIndex, totalFiles) => {
          void this.client.publish(
            MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_FILE,
            {
              requestId,
              productId,
              fileIndex,
              totalFiles,
              file,
            } as DownloadBrowserFilePayload,
            0
          );
        },
      });
      void this.client.publish(
        MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_COMPLETE,
        {
          requestId,
          productId,
          totalSize: result.totalSize,
        } as DownloadBrowserCompletePayload,
        0
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("[model-downloader-bridge] Download browser error:", errMsg);
      void this.client.publish(
        MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_COMPLETE,
        {
          requestId,
          productId,
          totalSize: 0,
          error: errMsg,
        } as DownloadBrowserCompletePayload,
        0
      );
    }
  }

  private async handleDownloadJobStart(req: DownloadJobStartRequest): Promise<void> {
    const response: DownloadJobStartResponse = { requestId: req.requestId };
    const jobId = this.nextJobId();
    const outputDir = this.resolveDefaultOutputDir(req);
    const job: ModelDownloaderBridgeJob = {
      jobId,
      requestId: req.requestId,
      productId: req.productId,
      state: "queued",
      outputDir,
    };
    this.jobs.set(jobId, job);

    response.jobId = jobId;
    response.state = "queued";
    void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_START_RESPONSE, response, 0);
    this.emitJobEvent({
      jobId,
      state: "queued",
      eventType: "started",
      message: `Job queued for ${req.productId}`,
    });

    void (async () => {
      try {
        job.state = "running";
        this.emitJobEvent({
          jobId,
          state: "running",
          eventType: "started",
          message: `Job started for ${req.productId}`,
        });

        const service = createModelDownloaderService({
          baseUrl: req.baseUrl,
          apiKey: req.apiKey,
          caCertPath: req.caCertPath,
        });
        const onProgress = (
          phase: "listing" | "downloading" | "writing" | "done",
          percent: number,
          label?: string,
          fileIndex?: number,
          totalFiles?: number
        ) => {
          const progress: DownloadProgressPayload = {
            requestId: req.requestId,
            phase,
            percent,
            label,
            fileIndex,
            totalFiles,
          };
          job.progress = progress;
          this.emitJobEvent({
            jobId,
            state: job.cancelRequested ? "cancelled" : "running",
            eventType: "progress",
            progress,
          });
        };

        const result = await service.downloadModel(req.productId, outputDir, onProgress, {
          includeSourceZip: req.includeSourceZip !== false,
        });
        if (job.cancelRequested) {
          job.state = "cancelled";
          this.emitJobEvent({
            jobId,
            state: "cancelled",
            eventType: "cancelled",
            message: "Cancel was requested. Download finished but result is ignored.",
          });
          return;
        }

        job.state = "completed";
        job.result = result;
        this.emitJobEvent({
          jobId,
          state: "completed",
          eventType: "completed",
          result,
        });
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        job.state = job.cancelRequested ? "cancelled" : "failed";
        job.error = errMsg;
        this.emitJobEvent({
          jobId,
          state: job.state,
          eventType: job.state === "cancelled" ? "cancelled" : "failed",
          error: errMsg,
        });
      }
    })();
  }

  private async handleDownloadJobStatus(req: DownloadJobStatusRequest): Promise<void> {
    const job = this.jobs.get(req.jobId);
    const response: DownloadJobStatusResponse = {
      requestId: req.requestId,
      jobId: req.jobId,
    };

    if (!job) {
      response.error = "Job not found";
      void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS_RESPONSE, response, 0);
      return;
    }

    response.state = job.state;
    response.progress = job.progress;
    response.result = job.result;
    response.error = job.error;
    void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS_RESPONSE, response, 0);
  }

  private catalogWebPathForFileUnderScanRoot(
    scanRoot: string,
    absFile: string
  ): string {
    const scanRootResolved = path.resolve(scanRoot);
    const rel = path.relative(scanRootResolved, path.resolve(absFile));
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(
        `Cannot map catalog file to a logical web path: ${absFile}. Check bridge asset layout configuration.`
      );
    }
    const relPosix = rel.split(path.sep).join("/");
    const scanRootKey = scanRootResolved.replace(/\\/g, "/").toLowerCase();
    if (scanRootKey.endsWith("/free/models")) {
      return `${FREE_MODELS_WEB_PREFIX}${relPosix}`;
    }
    return `${TESAIOT_MODELS_WEB_PREFIX}${relPosix}`;
  }

  private listLocalDownloadedCatalogModels(): CatalogListDownloadedEntry[] {
    const roots = this.getCatalogScanRoots();
    const entries: CatalogListDownloadedEntry[] = [];
    const seenFolders = new Set<string>();

    const toModelFileType = (fileName: string): "glb" | "gltf" | null => {
      const lower = fileName.toLowerCase();
      if (lower.endsWith(".glb")) return "glb";
      if (lower.endsWith(".gltf")) return "gltf";
      return null;
    };
    const isImageFile = (fileName: string): boolean => {
      const lower = fileName.toLowerCase();
      return (
        lower.endsWith(".webp") ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".avif")
      );
    };

    const resolveModelMetadataFromDir = (modelDir: string): {
      name?: string;
      productId?: string;
      category?: string;
      updatedAtMs?: number;
      metadataJson?: unknown;
    } | null => {
      try {
        const jsonFiles = fs
          .readdirSync(modelDir, { withFileTypes: true })
          .filter(
            (dirent) =>
              dirent.isFile() && dirent.name.toLowerCase().endsWith(".json")
          );
        if (jsonFiles.length === 0) return null;
        const prioritized = jsonFiles
          .map((dirent) => dirent.name)
          .sort((a, b) => {
            const aMeta = a.toLowerCase().endsWith("_metadata.json") ? 0 : 1;
            const bMeta = b.toLowerCase().endsWith("_metadata.json") ? 0 : 1;
            return aMeta - bMeta;
          });
        for (const jsonFileName of prioritized) {
          try {
            const raw = fs.readFileSync(path.join(modelDir, jsonFileName), "utf8");
            const parsed = JSON.parse(raw) as {
              name?: unknown;
              model_name?: unknown;
              product_id?: unknown;
              productId?: unknown;
              category?: unknown;
              model_category?: unknown;
              updated_at?: unknown;
              updatedAt?: unknown;
              created_at?: unknown;
              createdAt?: unknown;
            };
            const updatedAtSource =
              typeof parsed.updated_at === "string"
                ? parsed.updated_at
                : typeof parsed.updatedAt === "string"
                  ? parsed.updatedAt
                  : typeof parsed.created_at === "string"
                    ? parsed.created_at
                    : parsed.createdAt;
            const updatedAtMs =
              typeof updatedAtSource === "string" && updatedAtSource.trim() !== ""
                ? Date.parse(updatedAtSource)
                : NaN;
            const metadata = {
              name:
                typeof parsed.name === "string" && parsed.name.trim() !== ""
                  ? parsed.name.trim()
                  : typeof parsed.model_name === "string" &&
                      parsed.model_name.trim() !== ""
                    ? parsed.model_name.trim()
                    : undefined,
              productId:
                typeof parsed.product_id === "string" && parsed.product_id.trim() !== ""
                  ? parsed.product_id.trim()
                  : typeof parsed.productId === "string" &&
                      parsed.productId.trim() !== ""
                    ? parsed.productId.trim()
                    : undefined,
              category:
                typeof parsed.category === "string" && parsed.category.trim() !== ""
                  ? parsed.category.trim()
                  : typeof parsed.model_category === "string" &&
                      parsed.model_category.trim() !== ""
                    ? parsed.model_category.trim()
                    : undefined,
              updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : undefined,
              metadataJson: parsed,
            };
            if (metadata.name || metadata.productId || metadata.category || metadata.updatedAtMs) {
              return metadata;
            }
          } catch {
            // Skip invalid json and continue searching.
          }
        }
        return null;
      } catch {
        return null;
      }
    };

    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      const scanRootResolved = path.resolve(root);
      let modelDirs: string[] = [];
      try {
        modelDirs = fs
          .readdirSync(root, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => path.join(root, dirent.name));
      } catch {
        continue;
      }

      for (const modelDir of modelDirs) {
        const folderName = path.basename(modelDir);
        const folderKey = folderName.toLowerCase();
        if (seenFolders.has(folderKey)) {
          continue;
        }
        seenFolders.add(folderKey);

        let files: string[] = [];
        try {
          files = fs
            .readdirSync(modelDir, { withFileTypes: true })
            .filter((dirent) => dirent.isFile())
            .map((dirent) => path.join(modelDir, dirent.name));
        } catch {
          continue;
        }

        const modelFiles = files.filter((filePath) => toModelFileType(filePath) !== null);
        if (modelFiles.length === 0) {
          continue;
        }
        const imageFiles = files.filter((filePath) =>
          isImageFile(path.basename(filePath))
        );
        const preferredModelFile =
          modelFiles.find((p) => p.toLowerCase().endsWith(".glb")) ?? modelFiles[0]!;
        const fileType = toModelFileType(preferredModelFile);
        if (!fileType) continue;
        const metadata = resolveModelMetadataFromDir(modelDir);
        const name = metadata?.name ?? folderName;
        const productId = metadata?.productId ?? folderName;
        const category = metadata?.category ?? "Uncategorized";
        const fileName = path.basename(preferredModelFile);
        const webPath = this.catalogWebPathForFileUnderScanRoot(
          scanRootResolved,
          preferredModelFile
        );
        const preferredThumbnailFile = imageFiles.find((p) =>
          path.basename(p).toLowerCase().includes("thumbnail")
        );
        const thumbnailWebPath = preferredThumbnailFile
          ? this.catalogWebPathForFileUnderScanRoot(
              scanRootResolved,
              preferredThumbnailFile
            )
          : undefined;
        const dedupeKey = webPath.toLowerCase();
        const stats = fs.statSync(preferredModelFile);
        entries.push({
          id: `bridge:${dedupeKey}`,
          productId,
          name,
          category,
          fileType,
          fileName,
          sizeBytes: stats.size,
          updatedAtMs: metadata?.updatedAtMs ?? stats.mtimeMs,
          metadataJson: metadata?.metadataJson,
          modelWebPath: webPath,
          thumbnailWebPath,
          webPath,
          dedupeKey,
        });
      }
    }

    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async handleCatalogListDownloaded(
    req: CatalogListDownloadedRequest
  ): Promise<void> {
    const response: CatalogListDownloadedResponse = { requestId: req.requestId };
    try {
      response.models = this.listLocalDownloadedCatalogModels();
    } catch (e) {
      response.error = e instanceof Error ? e.message : String(e);
      console.error("[model-downloader-bridge] Catalog list error:", response.error);
    }
    void this.client.publish(
      MODEL_DOWNLOADER_TOPICS.CATALOG_LIST_DOWNLOADED_RESPONSE,
      response,
      0
    );
  }

  private async handleDefaultOutput(
    req: ModelDownloaderDefaultOutputRequest
  ): Promise<void> {
    const response: ModelDownloaderDefaultOutputResponse = {
      requestId: req.requestId,
    };
    try {
      response.defaultOutputBaseDir = this.resolveDefaultModelLoaderBaseDir();
    } catch (e) {
      response.error = e instanceof Error ? e.message : String(e);
    }
    void this.client.publish(
      MODEL_DOWNLOADER_TOPICS.DEFAULT_OUTPUT_RESPONSE,
      response,
      0
    );
  }

  private async handleCatalogModelProperties(
    req: CatalogModelPropertiesRequest
  ): Promise<void> {
    const response: CatalogModelPropertiesResponse = { requestId: req.requestId };
    try {
      const absolutePath = this.resolveCatalogFileToAbsolute(req.webPath ?? "");
      if (!this.isPathUnderAllowedRoots(absolutePath)) {
        throw new Error("Invalid model path");
      }
      response.properties = readLocalModelFileProperties(absolutePath);
    } catch (e) {
      response.error = e instanceof Error ? e.message : String(e);
    }
    void this.client.publish(
      MODEL_DOWNLOADER_TOPICS.CATALOG_MODEL_PROPERTIES_RESPONSE,
      response,
      0
    );
  }

  private async handleDownloadJobCancel(req: DownloadJobCancelRequest): Promise<void> {
    const job = this.jobs.get(req.jobId);
    const response: DownloadJobCancelResponse = {
      requestId: req.requestId,
      jobId: req.jobId,
      cancelled: false,
    };

    if (!job) {
      response.error = "Job not found";
      void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL_RESPONSE, response, 0);
      return;
    }

    job.cancelRequested = true;
    if (job.state === "queued" || job.state === "running") {
      job.state = "cancelled";
    }
    response.cancelled = true;
    void this.client.publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL_RESPONSE, response, 0);
    this.emitJobEvent({
      jobId: job.jobId,
      state: "cancelled",
      eventType: "cancelled",
      message: "Cancel requested by client.",
    });
  }

  async start(): Promise<void> {
    await this.client.connect();
  }

  async stop(): Promise<void> {
    await this.client.disconnect();
  }
}

/**
 * Start the Model Downloader WebSocket bridge. Idempotent; reuses existing instance.
 */
export async function startModelDownloaderBridge(
  config?: ModelDownloaderBridgeConfig
): Promise<ModelDownloaderWebSocketBridge> {
  if (bridgeInstance) {
    return bridgeInstance;
  }
  bridgeInstance = new ModelDownloaderWebSocketBridge(config);
  await bridgeInstance.start();
  return bridgeInstance;
}

/**
 * Stop the bridge and clear the singleton instance.
 */
export async function stopModelDownloaderBridge(): Promise<void> {
  if (!bridgeInstance) return;
  await bridgeInstance.stop();
  bridgeInstance = null;
}
