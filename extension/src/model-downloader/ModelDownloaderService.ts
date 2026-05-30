/**
 * TESAIoT Product Model Store - Service
 *
 * Extracted from download_model_nodejs.js for use by the extension host.
 * Handles list, getModelInfo, and download operations.
 */

import * as https from "node:https";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";

const DEFAULT_BASE_URL = "https://admin.tesaiot.com";
const API_PATH = "/api/v1/product-models";

export interface ModelDownloaderConfig {
  baseUrl: string;
  apiKey: string;
  caCertPath?: string | null;
}

export interface DownloadedFile {
  label: string;
  filepath: string;
  size: number;
}

export interface DownloadedFileContent {
  label: string;
  filename: string;
  contentBase64: string;
  size: number;
}

export type DownloadProgressCallback = (
  phase: "listing" | "downloading" | "writing" | "done",
  percent: number,
  label?: string,
  fileIndex?: number,
  totalFiles?: number
) => void;

export interface DownloadResult {
  productId: string;
  downloadedFiles: DownloadedFile[];
  totalSize: number;
  outputDir: string;
}

function formatSize(sizeBytes: number): string {
  if (!sizeBytes || sizeBytes === 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = parseFloat(String(sizeBytes));
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "_");
}

/**
 * Normalize output dir so files always land under the selected product folder.
 * Accepts either a root folder (.../downloads) or a model folder (.../downloads/PDM-XXXX).
 */
function resolveProductOutputDir(outputDir: string, productId: string): string {
  const safeProductFolder = sanitizePathSegment(productId || "model");
  const trimmed = outputDir.trim();
  const baseName = path.basename(trimmed);
  const looksLikeModelFolder = /^pdm-[a-z0-9_-]+$/i.test(baseName);
  return baseName.toLowerCase() === safeProductFolder.toLowerCase()
    ? trimmed
    : looksLikeModelFolder
      ? path.join(path.dirname(trimmed), safeProductFolder)
      : path.join(trimmed, safeProductFolder);
}

export function createModelDownloaderService(config: ModelDownloaderConfig) {
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const fullBaseUrl = `${baseUrl}${API_PATH}`;
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error("API key is required");
  }

  function getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  function createHttpsAgent(): https.Agent | undefined {
    const caCertPath = config.caCertPath;
    const options: https.AgentOptions = {};
    if (caCertPath && fs.existsSync(caCertPath)) {
      options.ca = fs.readFileSync(caCertPath);
    }
    return new https.Agent(options);
  }

  function makeRequest<T = unknown>(url: string, options: { method?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const reqOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: options.headers || {},
      };

      if (isHttps) {
        reqOptions.agent = createHttpsAgent();
      }

      const req = httpModule.request(reqOptions, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer | string) => (data += chunk.toString()));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              resolve(data as T);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on("error", reject);
      req.end();
    });
  }

  function downloadFileToBuffer(
    productId: string,
    fileType: "model" | "thumbnail" | "zip"
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let url: string;
      if (fileType === "model") {
        url = `${fullBaseUrl}/models/${productId}/download`;
      } else if (fileType === "thumbnail") {
        url = `${fullBaseUrl}/models/${productId}/download/thumbnail`;
      } else if (fileType === "zip") {
        url = `${fullBaseUrl}/models/${productId}/download/zip`;
      } else {
        reject(new Error(`Invalid file_type: ${fileType}`));
        return;
      }

      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const reqOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: getAuthHeaders(),
      };

      if (isHttps) {
        reqOptions.agent = createHttpsAgent();
      }

      const chunks: Buffer[] = [];
      const req = httpModule.request(reqOptions, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      });

      req.on("error", reject);
      req.end();
    });
  }

  function downloadFileDirect(
    productId: string,
    fileType: "model" | "thumbnail" | "zip",
    outputPath: string
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      let url: string;
      if (fileType === "model") {
        url = `${fullBaseUrl}/models/${productId}/download`;
      } else if (fileType === "thumbnail") {
        url = `${fullBaseUrl}/models/${productId}/download/thumbnail`;
      } else if (fileType === "zip") {
        url = `${fullBaseUrl}/models/${productId}/download/zip`;
      } else {
        reject(new Error(`Invalid file_type: ${fileType}`));
        return;
      }

      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const reqOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: getAuthHeaders(),
      };

      if (isHttps) {
        reqOptions.agent = createHttpsAgent();
      }

      const req = httpModule.request(reqOptions, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(outputPath);

        res.pipe(file);

        file.on("finish", () => {
          file.close();
          const totalSize = parseInt(res.headers["content-length"] || "0", 10);
          resolve(totalSize);
        });

        file.on("error", (err) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      });

      req.on("error", reject);
      req.end();
    });
  }

  return {
    async listModels(
      page = 1,
      limit = 100
    ): Promise<{ data: unknown[]; pagination: Record<string, unknown> }> {
      const url = `${fullBaseUrl}/models/list?page=${page}&limit=${limit}`;
      return makeRequest(url, { headers: getAuthHeaders() });
    },

    async getModelInfo(productId: string): Promise<unknown> {
      const url = `${fullBaseUrl}/models/${productId}/details`;
      return makeRequest(url, { headers: getAuthHeaders() });
    },

    async downloadModelMetadata(
      productId: string,
      outputDir: string,
      onProgress?: DownloadProgressCallback
    ): Promise<DownloadResult> {
      const targetOutputDir = resolveProductOutputDir(outputDir, productId);
      onProgress?.("listing", 0, "Getting model info", 0, 1);
      const modelInfo = await this.getModelInfo(productId);
      if (!fs.existsSync(targetOutputDir)) {
        fs.mkdirSync(targetOutputDir, { recursive: true });
      }
      onProgress?.("writing", 25, "Model metadata", 0, 1);
      const metadataPath = path.join(targetOutputDir, `${productId}_metadata.json`);
      const metadataJson = JSON.stringify(modelInfo, null, 2);
      fs.writeFileSync(metadataPath, metadataJson, "utf8");
      const metadataSize = Buffer.byteLength(metadataJson, "utf8");
      onProgress?.("done", 100, "Model metadata", 1, 1);
      return {
        productId,
        downloadedFiles: [
          { label: "Model Metadata", filepath: metadataPath, size: metadataSize },
        ],
        totalSize: metadataSize,
        outputDir: path.resolve(targetOutputDir),
      };
    },

    async downloadModel(
      productId: string,
      outputDir: string,
      onProgress?: DownloadProgressCallback,
      options?: { includeSourceZip?: boolean }
    ): Promise<DownloadResult> {
      const targetOutputDir = resolveProductOutputDir(outputDir, productId);
      const includeSourceZip = options?.includeSourceZip !== false;
      onProgress?.("listing", 0, "Getting model info", 0, 3);
      const model = (await this.getModelInfo(productId)) as {
        files?: Record<string, { url?: string; size?: number }>;
      };
      const files = model?.files || {};
      const totalFiles =
        [
          files.thumbnail?.url,
          files.original?.url,
          includeSourceZip ? files.source_archive?.url : undefined,
        ].filter(Boolean)
          .length + 1; // + metadata JSON
      if (!fs.existsSync(targetOutputDir)) {
        fs.mkdirSync(targetOutputDir, { recursive: true });
      }

      const downloadedFiles: DownloadedFile[] = [];
      let fileIndex = 0;

      try {
        onProgress?.(
          "writing",
          Math.round((fileIndex / totalFiles) * 100),
          "Model metadata",
          fileIndex,
          totalFiles
        );
        const metadataPath = path.join(targetOutputDir, `${productId}_metadata.json`);
        const metadataJson = JSON.stringify(model, null, 2);
        fs.writeFileSync(metadataPath, metadataJson, "utf8");
        const metadataSize = Buffer.byteLength(metadataJson, "utf8");
        downloadedFiles.push({
          label: "Model Metadata",
          filepath: metadataPath,
          size: metadataSize,
        });
        fileIndex++;
        onProgress?.(
          "writing",
          Math.round((fileIndex / totalFiles) * 100),
          "Model metadata",
          fileIndex,
          totalFiles
        );
      } catch {
        // Skip on error and continue with asset files.
      }

      if (files.thumbnail && files.thumbnail.url) {
        try {
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "Thumbnail", fileIndex, totalFiles);
          const filepath = path.join(targetOutputDir, `${productId}_thumbnail.webp`);
          const size = await downloadFileDirect(productId, "thumbnail", filepath);
          downloadedFiles.push({ label: "Thumbnail", filepath, size });
          fileIndex++;
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "Thumbnail", fileIndex, totalFiles);
        } catch (e) {
          // Skip on error, continue with others
        }
      }

      if (files.original && files.original.url) {
        try {
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "3D Model", fileIndex, totalFiles);
          const ext = files.original.url.includes(".")
            ? files.original.url.split(".").pop()
            : "glb";
          const filepath = path.join(targetOutputDir, `${productId}_model.${ext}`);
          const size = await downloadFileDirect(productId, "model", filepath);
          downloadedFiles.push({ label: "3D Model", filepath, size });
          fileIndex++;
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "3D Model", fileIndex, totalFiles);
        } catch (e) {
          // Skip on error
        }
      }

      if (includeSourceZip && files.source_archive && files.source_archive.url) {
        try {
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "ZIP Archive", fileIndex, totalFiles);
          const filepath = path.join(targetOutputDir, `${productId}_source.zip`);
          const size = await downloadFileDirect(productId, "zip", filepath);
          downloadedFiles.push({ label: "ZIP Archive", filepath, size });
          fileIndex++;
          onProgress?.("downloading", 100, "ZIP Archive", fileIndex, totalFiles);
        } catch (e) {
          // Skip on error
        }
      }

      onProgress?.("done", 100, undefined, fileIndex, totalFiles);
      const totalSize = downloadedFiles.reduce((sum, f) => sum + f.size, 0);

      return {
        productId,
        downloadedFiles,
        totalSize,
        outputDir: path.resolve(targetOutputDir),
      };
    },

    async downloadModelToMemory(
      productId: string,
      options?: {
        onProgress?: DownloadProgressCallback;
        onFile?: (file: DownloadedFileContent, fileIndex: number, totalFiles: number) => void;
      }
    ): Promise<{
      productId: string;
      files: DownloadedFileContent[];
      totalSize: number;
    }> {
      const { onProgress, onFile } = options ?? {};
      onProgress?.("listing", 0, "Getting model info", 0, 3);
      const model = (await this.getModelInfo(productId)) as {
        files?: Record<string, { url?: string; size?: number }>;
      };
      const files = model?.files || {};
      const result: DownloadedFileContent[] = [];
      const totalFiles = [files.thumbnail?.url, files.original?.url, files.source_archive?.url].filter(Boolean).length;
      let fileIndex = 0;

      if (files.thumbnail && files.thumbnail.url) {
        try {
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "Thumbnail", fileIndex, totalFiles);
          const buf = await downloadFileToBuffer(productId, "thumbnail");
          const file: DownloadedFileContent = {
            label: "Thumbnail",
            filename: `${productId}_thumbnail.webp`,
            contentBase64: buf.toString("base64"),
            size: buf.length,
          };
          result.push(file);
          onFile?.(file, fileIndex, totalFiles);
          fileIndex++;
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "Thumbnail", fileIndex, totalFiles);
        } catch {
          /* skip */
        }
      }

      if (files.original && files.original.url) {
        try {
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "3D Model", fileIndex, totalFiles);
          const ext = files.original.url.includes(".")
            ? files.original.url.split(".").pop()
            : "glb";
          const buf = await downloadFileToBuffer(productId, "model");
          const file: DownloadedFileContent = {
            label: "3D Model",
            filename: `${productId}_model.${ext}`,
            contentBase64: buf.toString("base64"),
            size: buf.length,
          };
          result.push(file);
          onFile?.(file, fileIndex, totalFiles);
          fileIndex++;
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "3D Model", fileIndex, totalFiles);
        } catch {
          /* skip */
        }
      }

      if (files.source_archive && files.source_archive.url) {
        try {
          onProgress?.("downloading", Math.round((fileIndex / totalFiles) * 100), "ZIP Archive", fileIndex, totalFiles);
          const buf = await downloadFileToBuffer(productId, "zip");
          const file: DownloadedFileContent = {
            label: "ZIP Archive",
            filename: `${productId}_source.zip`,
            contentBase64: buf.toString("base64"),
            size: buf.length,
          };
          result.push(file);
          onFile?.(file, fileIndex, totalFiles);
          fileIndex++;
          onProgress?.("downloading", 100, "ZIP Archive", fileIndex, totalFiles);
        } catch {
          /* skip */
        }
      }

      onProgress?.("done", 100, undefined, fileIndex, totalFiles);
      const totalSize = result.reduce((sum, f) => sum + f.size, 0);
      return { productId, files: result, totalSize };
    },

    formatSize,
  };
}
