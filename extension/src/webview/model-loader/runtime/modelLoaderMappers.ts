import type {
  ModelLoaderDownloadResult,
  ModelLoaderListResult,
  ModelLoaderModelEntry,
} from "../types";

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function parseTimestampMs(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function parseFileTypeFromRecord(record: Record<string, unknown>): "glb" | "gltf" | undefined {
  const format = record.format;
  if (typeof format === "string") {
    const lower = format.toLowerCase();
    if (lower === "glb" || lower === "gltf") {
      return lower;
    }
  }
  const originalFilename = record.original_filename;
  if (typeof originalFilename === "string") {
    const lower = originalFilename.toLowerCase();
    if (lower.endsWith(".glb")) return "glb";
    if (lower.endsWith(".gltf")) return "gltf";
  }
  const files = asRecord(record.files);
  const original = asRecord(files.original);
  const originalUrl = original.url;
  if (typeof originalUrl === "string") {
    const lower = originalUrl.toLowerCase();
    if (lower.endsWith(".glb")) return "glb";
    if (lower.endsWith(".gltf")) return "gltf";
  }
  return undefined;
}

function parseSizeBytesFromRecord(record: Record<string, unknown>): number | undefined {
  const direct = record.file_size;
  if (typeof direct === "number" && Number.isFinite(direct) && direct >= 0) {
    return direct;
  }
  const files = asRecord(record.files);
  const original = asRecord(files.original);
  const originalSize = original.size;
  if (typeof originalSize === "number" && Number.isFinite(originalSize) && originalSize >= 0) {
    return originalSize;
  }
  return undefined;
}

function parseModelUrlFromRecord(record: Record<string, unknown>): string | undefined {
  const candidates: unknown[] = [
    record.model_url,
    record.modelUrl,
    record.url,
  ];
  const files = asRecord(record.files);
  const original = asRecord(files.original);
  candidates.push(original.url);

  for (const value of candidates) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function parseThumbnailUrlFromRecord(record: Record<string, unknown>): string | undefined {
  const candidates: unknown[] = [record.thumbnail_url, record.thumbnailUrl];
  const files = asRecord(record.files);
  const thumbnail = asRecord(files.thumbnail);
  candidates.push(thumbnail.url);
  for (const value of candidates) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

export function mapListResult(
  data: unknown[],
  pagination: Record<string, unknown>
): ModelLoaderListResult {
  const mappedData = data.map(mapModelRecord);
  return {
    data: mappedData,
    pagination,
  };
}

export function mapModelRecord(value: unknown): ModelLoaderModelEntry {
  const record = asRecord(value);
  const productId = String(record.product_id ?? record.productId ?? "");
  const name = String(record.name ?? productId ?? "Unknown");
  const category = String(record.category ?? "Uncategorized");
  const fileType = parseFileTypeFromRecord(record);
  const sizeBytes = parseSizeBytesFromRecord(record);
  const updatedAtMs =
    parseTimestampMs(record.updated_at) ?? parseTimestampMs(record.created_at);
  const modelUrl = parseModelUrlFromRecord(record);
  const thumbnailUrl = parseThumbnailUrlFromRecord(record);

  return {
    productId,
    name,
    category,
    fileType,
    sizeBytes,
    updatedAtMs,
    modelUrl,
    thumbnailUrl,
    raw: value,
  };
}

export function mapDownloadResult(value: {
  productId: string;
  downloadedFiles: Array<{ label: string; filepath: string; size: number }>;
  totalSize: number;
  outputDir: string;
}): ModelLoaderDownloadResult {
  return {
    productId: value.productId,
    downloadedFiles: value.downloadedFiles.map((file) => ({
      label: file.label,
      filepath: file.filepath,
      size: file.size,
    })),
    totalSize: value.totalSize,
    outputDir: value.outputDir,
  };
}
