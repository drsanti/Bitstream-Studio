import * as vscode from "vscode";
import * as nodePath from "node:path";
import * as nodeFs from "node:fs";
import type { WebviewMessage } from "./types";
import { createModelDownloaderService } from "./model-downloader/ModelDownloaderService";
import { readLocalModelFileProperties } from "./model-downloader/local-model-properties";
import {
  FREE_MODELS_WEB_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
} from "./assetLayout";
import {
  getFreeGithubMirrorRootUri,
  getModelDownloadsRootUri,
  getUserAssetsRootUri,
  pathIsUnderUserAssetsTree,
} from "./extensionAssetPaths";

const TESAIOT_API_KEY_SECRET = "ternion-tesaiot-apikey";
const TESAIOT_BASE_URL_STATE = "ternion-tesaiot-base-url";
const TESAIOT_CA_CERT_STATE = "ternion-tesaiot-ca-cert-path";
const DEFAULT_BASE_URL = "https://admin.tesaiot.com";
type LoaderJobState = "queued" | "running" | "completed" | "failed" | "cancelled";
const modelLoaderJobs = new Map<
  string,
  {
    state: LoaderJobState;
    progress?: {
      phase: "listing" | "downloading" | "writing" | "done";
      percent: number;
      label?: string;
      fileIndex?: number;
      totalFiles?: number;
    };
    error?: string;
    downloadResult?: {
      productId: string;
      downloadedFiles: Array<{ label: string; filepath: string; size: number }>;
      totalSize: number;
      outputDir: string;
    };
  }
>();

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "_");
}

/**
 * Maps a file under a scan root to a stable web path: Tesaiot / free globalStorage
 * or extension-relative for dev-tree roots.
 */
function pathsEqualNormalized(a: string, b: string): boolean {
  return (
    nodePath.resolve(a).toLowerCase() === nodePath.resolve(b).toLowerCase()
  );
}

/**
 * Build a `vscode.Uri` under `getUserAssetsRootUri` using `Uri.joinPath` so
 * `asWebviewUri` matches `localResourceRoots` on Windows (raw `Uri.file(readdir paths)`
 * can differ by drive-letter / segment casing and webview fetches return **401**).
 */
function fileUriUnderUserAssetsTree(
  context: vscode.ExtensionContext,
  absoluteFilePath: string
): vscode.Uri {
  const assetsRoot = getUserAssetsRootUri(context);
  const rel = nodePath.relative(
    nodePath.resolve(assetsRoot.fsPath),
    nodePath.resolve(absoluteFilePath)
  );
  if (rel.startsWith("..") || nodePath.isAbsolute(rel)) {
    return vscode.Uri.file(nodePath.resolve(absoluteFilePath));
  }
  const segments = rel.split(/[/\\]/).filter((s) => s.length > 0);
  return vscode.Uri.joinPath(assetsRoot, ...segments);
}

function fileUriUnderExtensionFolder(
  context: vscode.ExtensionContext,
  absoluteFilePath: string
): vscode.Uri {
  const extRoot = vscode.Uri.file(context.extensionPath);
  const rel = nodePath.relative(
    nodePath.resolve(context.extensionPath),
    nodePath.resolve(absoluteFilePath)
  );
  if (rel.startsWith("..") || nodePath.isAbsolute(rel)) {
    return vscode.Uri.file(nodePath.resolve(absoluteFilePath));
  }
  const segments = rel.split(/[/\\]/).filter((s) => s.length > 0);
  return vscode.Uri.joinPath(extRoot, ...segments);
}

/**
 * Webview-safe file Uri for scanned models (globalStorage `assets/` vs extension dev trees).
 */
function webviewFileUriForScannedLocalFile(
  context: vscode.ExtensionContext,
  scanRootFsPath: string,
  absoluteFilePath: string
): vscode.Uri {
  const resolvedScan = nodePath.resolve(scanRootFsPath);
  const newRoot = nodePath.resolve(getModelDownloadsRootUri(context).fsPath);
  const freeRoot = nodePath.resolve(getFreeGithubMirrorRootUri(context).fsPath);
  if (
    pathsEqualNormalized(resolvedScan, newRoot) ||
    pathsEqualNormalized(resolvedScan, freeRoot) ||
    resolvedScan.startsWith(freeRoot + nodePath.sep)
  ) {
    return fileUriUnderUserAssetsTree(context, absoluteFilePath);
  }
  return fileUriUnderExtensionFolder(context, absoluteFilePath);
}

function webPathForScannedModelFile(
  context: vscode.ExtensionContext,
  absoluteFile: string,
  scanRoot: string
): string {
  const newRoot = nodePath.resolve(getModelDownloadsRootUri(context).fsPath);
  const freeRoot = nodePath.resolve(getFreeGithubMirrorRootUri(context).fsPath);
  const resolvedScan = nodePath.resolve(scanRoot);
  const resolvedFile = nodePath.resolve(absoluteFile);
  let rel: string;
  try {
    rel = nodePath
      .relative(resolvedScan, resolvedFile)
      .split(nodePath.sep)
      .join("/");
  } catch {
    rel = "";
  }
  if (!rel.startsWith("..") && !nodePath.isAbsolute(rel)) {
    if (resolvedScan === newRoot) {
      return `${TESAIOT_MODELS_WEB_PREFIX}${rel}`;
    }
    if (
      resolvedScan === freeRoot ||
      resolvedScan.startsWith(freeRoot + nodePath.sep)
    ) {
      return `${FREE_MODELS_WEB_PREFIX}${rel}`;
    }
  }
  return nodePath
    .relative(context.extensionPath, absoluteFile)
    .split(nodePath.sep)
    .join("/");
}

function resolveModelLoaderOutputDir(
  context: vscode.ExtensionContext,
  productId: string,
  preferredOutputDir?: string
): string {
  const modelFolder = sanitizePathSegment(productId || "model");
  const rootDir = preferredOutputDir?.trim()
    ? preferredOutputDir.trim()
    : getModelDownloadsRootUri(context).fsPath;
  const resolvedRoot = nodePath.resolve(rootDir);
  if (!pathIsUnderUserAssetsTree(context, resolvedRoot)) {
    throw new Error(
      "Model download folder must be under the extension user assets directory (VS Code globalStorage …/assets). Use the default location or pick a subfolder under Assets."
    );
  }
  const rootBaseName = nodePath.basename(resolvedRoot);
  const looksLikeModelFolder = /^pdm-[a-z0-9_-]+$/i.test(rootBaseName);
  const fullDir =
    rootBaseName.toLowerCase() === modelFolder.toLowerCase()
      ? resolvedRoot
      : looksLikeModelFolder
        ? nodePath.join(nodePath.dirname(resolvedRoot), modelFolder)
        : nodePath.join(resolvedRoot, modelFolder);
  const resolvedFull = nodePath.resolve(fullDir);
  if (!pathIsUnderUserAssetsTree(context, resolvedFull)) {
    throw new Error(
      "Resolved model folder is outside the allowed assets directory."
    );
  }
  nodeFs.mkdirSync(resolvedFull, { recursive: true });
  return resolvedFull;
}

function sendError(
  panel: vscode.WebviewPanel,
  requestId: string | undefined,
  error: string,
) {
  panel.webview.postMessage({
    type: "model-downloader-error",
    requestId,
    error,
  });
}

function sendModelLoaderError(
  panel: vscode.WebviewPanel,
  requestId: string | undefined,
  error: string
) {
  panel.webview.postMessage({
    type: "model-loader-error",
    requestId,
    error,
  });
}

function nextLoaderJobId(): string {
  return `loader-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Tells the webview to rescan local downloaded models (new folders on disk). */
function notifyModelCatalogLocalModelsChanged(panel: vscode.WebviewPanel) {
  panel.webview.postMessage({ type: "model-catalog-local-models-changed" });
}

function toModelFileType(fileName: string): "glb" | "gltf" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".glb")) return "glb";
  if (lower.endsWith(".gltf")) return "gltf";
  return null;
}

function isImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".webp") ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".avif")
  );
}

function resolveModelMetadataFromDir(modelDir: string): {
  name?: string;
  productId?: string;
  category?: string;
  updatedAtMs?: number;
  metadataJson?: unknown;
} | null {
  try {
    const jsonFiles = nodeFs
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
        const raw = nodeFs.readFileSync(nodePath.join(modelDir, jsonFileName), "utf8");
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
              : typeof parsed.model_name === "string" && parsed.model_name.trim() !== ""
                ? parsed.model_name.trim()
                : undefined,
          productId:
            typeof parsed.product_id === "string" && parsed.product_id.trim() !== ""
              ? parsed.product_id.trim()
              : typeof parsed.productId === "string" && parsed.productId.trim() !== ""
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
}

function listDownloadedModelEntries(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
): Array<{
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
  url: string;
  catalogCategory: "downloaded";
  dedupeKey: string;
  modelSource: "dynamic";
}> {
  const roots = [
    getModelDownloadsRootUri(context).fsPath,
    nodePath.join(getFreeGithubMirrorRootUri(context).fsPath, "models"),
  ];
  const entries: Array<{
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
    url: string;
    catalogCategory: "downloaded";
    dedupeKey: string;
    modelSource: "dynamic";
  }> = [];
  const seenFolders = new Set<string>();

  for (const root of roots) {
    if (!nodeFs.existsSync(root)) continue;
    let modelDirs: string[] = [];
    try {
      modelDirs = nodeFs
        .readdirSync(root, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => nodePath.join(root, dirent.name));
    } catch {
      continue;
    }

    for (const modelDir of modelDirs) {
      const folderName = nodePath.basename(modelDir);
      const folderKey = folderName.toLowerCase();
      if (seenFolders.has(folderKey)) {
        continue;
      }
      seenFolders.add(folderKey);

      let files: string[] = [];
      try {
        files = nodeFs
          .readdirSync(modelDir, { withFileTypes: true })
          .filter((dirent) => dirent.isFile())
          .map((dirent) => nodePath.join(modelDir, dirent.name));
      } catch {
        continue;
      }

      const modelFiles = files.filter((filePath) => toModelFileType(filePath) !== null);
      if (modelFiles.length === 0) {
        continue;
      }
      const imageFiles = files.filter((filePath) =>
        isImageFile(nodePath.basename(filePath))
      );
      // Prefer GLB when both GLB/GLTF exist in same folder.
      const preferredModelFile =
        modelFiles.find((p) => p.toLowerCase().endsWith(".glb")) ?? modelFiles[0]!;
      const fileType = toModelFileType(preferredModelFile);
      if (!fileType) continue;

      const fileUri = webviewFileUriForScannedLocalFile(
        context,
        root,
        preferredModelFile
      );
      const webviewUri = panel.webview.asWebviewUri(fileUri).toString();
      const metadata = resolveModelMetadataFromDir(modelDir);
      const modelName = metadata?.name ?? folderName;
      const productId = metadata?.productId ?? folderName;
      const category = metadata?.category ?? "Uncategorized";
      const fileName = nodePath.basename(preferredModelFile);
      const stats = nodeFs.statSync(preferredModelFile);
      const relPath = webPathForScannedModelFile(
        context,
        preferredModelFile,
        root
      );
      const dedupeKey = relPath.toLowerCase();
      const preferredThumbnailFile = imageFiles.find((p) =>
        nodePath.basename(p).toLowerCase().includes("thumbnail")
      );
      const thumbnailRelPath = preferredThumbnailFile
        ? webPathForScannedModelFile(
            context,
            preferredThumbnailFile,
            root
          )
        : undefined;
      const thumbnailUrl = preferredThumbnailFile
        ? panel.webview
            .asWebviewUri(
              webviewFileUriForScannedLocalFile(
                context,
                root,
                preferredThumbnailFile
              )
            )
            .toString()
        : undefined;
      entries.push({
        id: `downloaded:${dedupeKey}`,
        productId,
        name: modelName,
        category,
        fileName,
        fileType,
        sizeBytes: stats.size,
        updatedAtMs: metadata?.updatedAtMs ?? stats.mtimeMs,
        metadataJson: metadata?.metadataJson,
        modelUrl: webviewUri,
        modelWebPath: relPath,
        thumbnailUrl,
        thumbnailWebPath: thumbnailRelPath,
        webPath: relPath,
        url: webviewUri,
        catalogCategory: "downloaded",
        dedupeKey,
        modelSource: "dynamic",
      });
    }
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export async function handleModelDownloaderWebviewMessage(
  message: WebviewMessage,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
): Promise<boolean> {
  const modelDownloaderTypes = [
    "model-downloader-list",
    "model-downloader-info",
    "model-downloader-download",
    "model-downloader-set-config",
    "model-downloader-get-config",
    "model-downloader-pick-folder",
    "model-loader-list",
    "model-loader-info",
    "model-loader-download",
    "model-loader-download-start",
    "model-loader-download-status",
    "model-loader-download-cancel",
    "model-loader-list-local-models",
    "model-loader-model-properties",
    "model-catalog-get-downloaded-models",
  ] as const;

  if (
    !modelDownloaderTypes.includes(
      message.type as (typeof modelDownloaderTypes)[number],
    )
  ) {
    return false;
  }

  const requestId = message.requestId;

  const getConfig = async () => {
    const baseUrl =
      (context.globalState.get(TESAIOT_BASE_URL_STATE) as string) ||
      DEFAULT_BASE_URL;
    const apiKey = (await context.secrets.get(TESAIOT_API_KEY_SECRET)) || "";
    const caCertPath = context.globalState.get(TESAIOT_CA_CERT_STATE) as
      | string
      | undefined;
    return { baseUrl, apiKey, caCertPath };
  };

  const getConfigFromMessage = async () => {
    const saved = await getConfig();
    const messageApiKey =
      typeof message.apiKey === "string" ? message.apiKey.trim() : message.apiKey;
    return {
      baseUrl: message.baseUrl ?? saved.baseUrl,
      apiKey:
        messageApiKey !== undefined && messageApiKey !== ""
          ? messageApiKey
          : saved.apiKey,
      caCertPath: message.caCertPath ?? saved.caCertPath,
    };
  };

  switch (message.type) {
    case "model-downloader-get-config": {
      const { baseUrl, apiKey, caCertPath } = await getConfig();
      panel.webview.postMessage({
        type: "model-downloader-config-response",
        requestId,
        modelDownloaderConfig: {
          baseUrl,
          hasApiKey: !!apiKey,
          caCertPath,
        },
      });
      return true;
    }

    case "model-downloader-set-config": {
      if (message.baseUrl !== undefined) {
        await context.globalState.update(
          TESAIOT_BASE_URL_STATE,
          message.baseUrl,
        );
      }
      if (message.apiKey !== undefined && message.apiKey !== "") {
        await context.secrets.store(TESAIOT_API_KEY_SECRET, message.apiKey);
      }
      if (message.caCertPath !== undefined) {
        await context.globalState.update(
          TESAIOT_CA_CERT_STATE,
          message.caCertPath,
        );
      }
      const { baseUrl, apiKey, caCertPath } = await getConfig();
      panel.webview.postMessage({
        type: "model-downloader-config-response",
        requestId,
        modelDownloaderConfig: {
          baseUrl,
          hasApiKey: !!apiKey,
          caCertPath,
        },
      });
      return true;
    }

    case "model-downloader-pick-folder": {
      const result = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
      });
      const selectedFolder = result?.[0]?.fsPath;
      panel.webview.postMessage({
        type: "model-downloader-pick-folder-response",
        requestId,
        selectedFolder,
      });
      return true;
    }

    case "model-downloader-list": {
      try {
        const { baseUrl, apiKey } = await getConfig();
        if (!apiKey) {
          sendError(
            panel,
            requestId,
            "API key is not set. Configure it in the Config section.",
          );
          return true;
        }
        const service = createModelDownloaderService({
          baseUrl,
          apiKey,
          caCertPath: (await getConfig()).caCertPath,
        });
        const result = await service.listModels(
          message.page ?? 1,
          message.limit ?? 100,
        );
        panel.webview.postMessage({
          type: "model-downloader-list-response",
          requestId,
          listData: result.data,
          pagination: result.pagination,
        });
      } catch (err) {
        sendError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err),
        );
      }
      return true;
    }

    case "model-downloader-info": {
      const productId = message.productId;
      if (!productId) {
        sendError(panel, requestId, "Product ID is required");
        return true;
      }
      try {
        const { baseUrl, apiKey, caCertPath } = await getConfig();
        if (!apiKey) {
          sendError(
            panel,
            requestId,
            "API key is not set. Configure it in the Config section.",
          );
          return true;
        }
        const service = createModelDownloaderService({
          baseUrl,
          apiKey,
          caCertPath,
        });
        const modelInfo = await service.getModelInfo(productId);
        panel.webview.postMessage({
          type: "model-downloader-info-response",
          requestId,
          modelInfo,
        });
      } catch (err) {
        sendError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err),
        );
      }
      return true;
    }

    case "model-downloader-download": {
      const productId = message.productId;
      const trimmedOverride =
        typeof message.outputDir === "string" ? message.outputDir.trim() : "";

      if (!productId) {
        sendError(panel, requestId, "Product ID is required");
        return true;
      }

      let targetOutputDir: string;
      try {
        targetOutputDir = resolveModelLoaderOutputDir(
          context,
          productId,
          trimmedOverride || undefined,
        );
      } catch (layoutErr) {
        sendError(
          panel,
          requestId,
          layoutErr instanceof Error ? layoutErr.message : String(layoutErr),
        );
        return true;
      }

      try {
        const { baseUrl, apiKey, caCertPath } = await getConfig();
        if (!apiKey) {
          sendError(
            panel,
            requestId,
            "API key is not set. Configure it in the Config section.",
          );
          return true;
        }
        const service = createModelDownloaderService({
          baseUrl,
          apiKey,
          caCertPath,
        });
        const downloadResult = await service.downloadModel(
          productId,
          targetOutputDir,
        );
        notifyModelCatalogLocalModelsChanged(panel);
        panel.webview.postMessage({
          type: "model-downloader-download-response",
          requestId,
          downloadResult,
        });
      } catch (err) {
        sendError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err),
        );
      }
      return true;
    }

    case "model-loader-list": {
      try {
        const { baseUrl, apiKey, caCertPath } = await getConfigFromMessage();
        if (!apiKey) {
          sendModelLoaderError(
            panel,
            requestId,
            "API key is not set. Configure it in Model Loader config."
          );
          return true;
        }
        const service = createModelDownloaderService({ baseUrl, apiKey, caCertPath });
        const result = await service.listModels(message.page ?? 1, message.limit ?? 25);
        panel.webview.postMessage({
          type: "model-loader-list-response",
          requestId,
          listData: result.data,
          pagination: result.pagination,
        });
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    case "model-loader-info": {
      const productId = message.productId;
      if (!productId) {
        sendModelLoaderError(panel, requestId, "Product ID is required");
        return true;
      }
      try {
        const { baseUrl, apiKey, caCertPath } = await getConfigFromMessage();
        if (!apiKey) {
          sendModelLoaderError(
            panel,
            requestId,
            "API key is not set. Configure it in Model Loader config."
          );
          return true;
        }
        const service = createModelDownloaderService({ baseUrl, apiKey, caCertPath });
        const modelInfo = await service.getModelInfo(productId);
        panel.webview.postMessage({
          type: "model-loader-info-response",
          requestId,
          modelInfo,
        });
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    case "model-loader-download": {
      const productId = message.productId;
      if (!productId) {
        sendModelLoaderError(panel, requestId, "Product ID is required");
        return true;
      }
      try {
        const { baseUrl, apiKey, caCertPath } = await getConfigFromMessage();
        if (!apiKey) {
          sendModelLoaderError(
            panel,
            requestId,
            "API key is not set. Configure it in Model Loader config."
          );
          return true;
        }
        const service = createModelDownloaderService({ baseUrl, apiKey, caCertPath });
        const targetOutputDir = resolveModelLoaderOutputDir(
          context,
          productId,
          message.outputDir
        );
        const includeSourceZip = message.includeSourceZip !== false;
        const downloadResult = message.metadataOnly
          ? await service.downloadModelMetadata(productId, targetOutputDir)
          : await service.downloadModel(productId, targetOutputDir, undefined, {
              includeSourceZip,
            });
        notifyModelCatalogLocalModelsChanged(panel);
        panel.webview.postMessage({
          type: "model-loader-download-response",
          requestId,
          downloadResult,
        });
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    case "model-loader-download-start": {
      const productId = message.productId;
      if (!productId) {
        sendModelLoaderError(panel, requestId, "Product ID is required");
        return true;
      }
      try {
        const { baseUrl, apiKey, caCertPath } = await getConfigFromMessage();
        if (!apiKey) {
          sendModelLoaderError(
            panel,
            requestId,
            "API key is not set. Configure it in Model Loader config."
          );
          return true;
        }
        const jobId = nextLoaderJobId();
        modelLoaderJobs.set(jobId, { state: "queued" });
        panel.webview.postMessage({
          type: "model-loader-download-start-response",
          requestId,
          jobId,
          jobState: "queued",
        });

        void (async () => {
          const job = modelLoaderJobs.get(jobId);
          if (!job) return;
          job.state = "running";
          const service = createModelDownloaderService({ baseUrl, apiKey, caCertPath });
          const targetOutputDir = resolveModelLoaderOutputDir(
            context,
            productId,
            message.outputDir
          );
          const includeSourceZip = message.includeSourceZip !== false;
          try {
            const downloadResult = await service.downloadModel(
              productId,
              targetOutputDir,
              (phase, percent, label, fileIndex, totalFiles) => {
                const current = modelLoaderJobs.get(jobId);
                if (!current || current.state === "cancelled") return;
                current.progress = {
                  phase,
                  percent,
                  label,
                  fileIndex,
                  totalFiles,
                };
              },
              { includeSourceZip }
            );
            const current = modelLoaderJobs.get(jobId);
            if (!current || current.state === "cancelled") {
              return;
            }
            current.state = "completed";
            current.downloadResult = downloadResult;
            notifyModelCatalogLocalModelsChanged(panel);
          } catch (err) {
            const current = modelLoaderJobs.get(jobId);
            if (!current) return;
            current.state = "failed";
            current.error = err instanceof Error ? err.message : String(err);
          }
        })();
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    case "model-loader-download-status": {
      const jobId = (message as WebviewMessage & { jobId?: string }).jobId;
      if (!jobId) {
        sendModelLoaderError(panel, requestId, "jobId is required");
        return true;
      }
      const job = modelLoaderJobs.get(jobId);
      if (!job) {
        sendModelLoaderError(panel, requestId, "Job not found");
        return true;
      }
      panel.webview.postMessage({
        type: "model-loader-download-status-response",
        requestId,
        jobId,
        jobState: job.state,
        progress: job.progress,
        downloadResult: job.downloadResult,
        error: job.error,
      });
      return true;
    }

    case "model-loader-download-cancel": {
      const jobId = (message as WebviewMessage & { jobId?: string }).jobId;
      if (!jobId) {
        sendModelLoaderError(panel, requestId, "jobId is required");
        return true;
      }
      const job = modelLoaderJobs.get(jobId);
      if (!job) {
        sendModelLoaderError(panel, requestId, "Job not found");
        return true;
      }
      if (job.state === "queued" || job.state === "running") {
        job.state = "cancelled";
      }
      panel.webview.postMessage({
        type: "model-loader-download-cancel-response",
        requestId,
        jobId,
        cancelled: true,
      });
      return true;
    }

    case "model-catalog-get-downloaded-models": {
      try {
        const downloadedModels = listDownloadedModelEntries(panel, context);
        panel.webview.postMessage({
          type: "model-catalog-downloaded-models-response",
          requestId,
          downloadedModels,
        });
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    case "model-loader-list-local-models": {
      try {
        const localModels = listDownloadedModelEntries(panel, context).map((entry) => ({
          id: entry.id,
          productId: entry.productId,
          name: entry.name,
          category: entry.category,
          fileName: entry.fileName,
          fileType: entry.fileType,
          sizeBytes: entry.sizeBytes,
          updatedAtMs: entry.updatedAtMs,
          metadataJson: entry.metadataJson,
          modelUrl: entry.modelUrl,
          modelWebPath: entry.modelWebPath,
          thumbnailUrl: entry.thumbnailUrl,
          thumbnailWebPath: entry.thumbnailWebPath,
          webPath: entry.webPath,
        }));
        panel.webview.postMessage({
          type: "model-loader-list-local-models-response",
          requestId,
          localModels,
        });
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    case "model-loader-model-properties": {
      const webPath = (message as WebviewMessage & { webPath?: string }).webPath;
      if (!webPath || webPath.trim() === "") {
        sendModelLoaderError(panel, requestId, "webPath is required");
        return true;
      }
      try {
        const normalized = webPath.replace(/\\/g, "/").replace(/^\/+/, "");
        let absolutePath: string;
        if (normalized.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
          const rest = normalized.slice(TESAIOT_MODELS_WEB_PREFIX.length);
          absolutePath = nodePath.join(
            getModelDownloadsRootUri(context).fsPath,
            rest
          );
        } else if (normalized.startsWith(FREE_MODELS_WEB_PREFIX)) {
          const rest = normalized.slice(FREE_MODELS_WEB_PREFIX.length);
          absolutePath = nodePath.join(
            getFreeGithubMirrorRootUri(context).fsPath,
            "models",
            rest
          );
        } else {
          absolutePath = nodePath.resolve(context.extensionPath, normalized);
        }
        const extBase = nodePath.resolve(context.extensionPath);
        const extWithSep = extBase.endsWith(nodePath.sep)
          ? extBase
          : `${extBase}${nodePath.sep}`;
        const allowed =
          pathIsUnderUserAssetsTree(context, absolutePath) ||
          absolutePath.startsWith(extWithSep) ||
          absolutePath === extBase;
        if (!allowed) {
          sendModelLoaderError(panel, requestId, "Invalid model path");
          return true;
        }
        const properties = readLocalModelFileProperties(absolutePath);
        panel.webview.postMessage({
          type: "model-loader-model-properties-response",
          requestId,
          modelProperties: properties,
        });
      } catch (err) {
        sendModelLoaderError(
          panel,
          requestId,
          err instanceof Error ? err.message : String(err)
        );
      }
      return true;
    }

    default:
      return false;
  }
}
