import type {
  StudioGltfExtractRow,
  StudioGltfExtractionResult,
  StudioGltfMaterialDetail,
  StudioGltfObjectDetail,
} from "../gltf/studio-gltf-extract";

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, "");
}

function lookupObjectDetailByPath(
  extraction: StudioGltfExtractionResult,
  path: string,
): StudioGltfObjectDetail | null {
  const normalized = normalizePath(path);
  if (normalized.length === 0) {
    return null;
  }
  const direct = extraction.objectDetailsByPath[normalized];
  if (direct != null) {
    return direct;
  }
  const suffix = Object.values(extraction.objectDetailsByPath).find(
    (row) =>
      normalizePath(row.path) === normalized ||
      normalized.endsWith(normalizePath(row.path)) ||
      normalizePath(row.path).endsWith(normalized),
  );
  return suffix ?? null;
}

function lookupObjectDetailByName(
  extraction: StudioGltfExtractionResult,
  name: string,
): StudioGltfObjectDetail | null {
  const normalized = name.trim();
  if (normalized.length === 0) {
    return null;
  }
  return (
    Object.values(extraction.objectDetailsByPath).find((row) => {
      const leaf = row.path.includes("/") ? row.path.split("/").pop() : row.path;
      return row.path === normalized || leaf === normalized;
    }) ?? null
  );
}

export type ModelOutlinerResolvedDetail = {
  objectDetail: StudioGltfObjectDetail | null;
  materialDetail: StudioGltfMaterialDetail | null;
  resolvedPath: string | null;
};

export function resolveModelOutlinerDetail(
  extraction: StudioGltfExtractionResult,
  selectedRow: StudioGltfExtractRow | null,
  scenePath: string | null,
): ModelOutlinerResolvedDetail {
  if (scenePath != null) {
    const objectDetail = lookupObjectDetailByPath(extraction, scenePath);
    return {
      objectDetail,
      materialDetail: null,
      resolvedPath: objectDetail?.path ?? normalizePath(scenePath),
    };
  }

  if (selectedRow == null) {
    return { objectDetail: null, materialDetail: null, resolvedPath: null };
  }

  if (selectedRow.kind === "material") {
    const materialDetail = extraction.materialDetailsByName[selectedRow.ref] ?? null;
    const objectDetail =
      materialDetail != null && materialDetail.usedOnMeshPaths.length > 0
        ? lookupObjectDetailByPath(extraction, materialDetail.usedOnMeshPaths[0]!)
        : null;
    return {
      objectDetail,
      materialDetail,
      resolvedPath: objectDetail?.path ?? materialDetail?.usedOnMeshPaths[0] ?? null,
    };
  }

  if (selectedRow.kind === "part" || selectedRow.kind === "morph") {
    const objectDetail = lookupObjectDetailByPath(extraction, selectedRow.ref);
    return {
      objectDetail,
      materialDetail: null,
      resolvedPath: objectDetail?.path ?? selectedRow.ref,
    };
  }

  if (selectedRow.kind === "light" || selectedRow.kind === "camera") {
    const objectDetail = lookupObjectDetailByName(extraction, selectedRow.ref);
    return {
      objectDetail,
      materialDetail: null,
      resolvedPath: objectDetail?.path ?? selectedRow.ref,
    };
  }

  return { objectDetail: null, materialDetail: null, resolvedPath: null };
}

export function formatStudioGltfVec3(v: { x: number; y: number; z: number }, digits = 2): string {
  return `${v.x.toFixed(digits)}, ${v.y.toFixed(digits)}, ${v.z.toFixed(digits)}`;
}
