import type { StageViewportPickDetail } from "../../../core/viewport/studio-viewport-stage-multi-models";
import {
  studioGlbExtractRowKey,
  type StudioGltfExtractRow,
  type StudioGltfExtractionResult,
} from "../gltf/studio-gltf-extract";

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, "");
}

/** Map a Stage viewport object path to the best matching extraction row. */
export function resolveExtractRowFromStageObjectPath(
  objectPath: string,
  extraction: StudioGltfExtractionResult,
): StudioGltfExtractRow | null {
  const normalized = normalizePath(objectPath);
  if (normalized.length === 0) {
    return null;
  }

  const partExact = extraction.parts.find((r) => normalizePath(r.ref) === normalized);
  if (partExact != null) {
    return partExact;
  }

  const partSuffix = extraction.parts.find(
    (r) =>
      normalized.endsWith(normalizePath(r.ref)) || normalizePath(r.ref).endsWith(normalized),
  );
  if (partSuffix != null) {
    return partSuffix;
  }

  const leaf = normalized.includes("/") ? normalized.split("/").pop()! : normalized;

  const light = extraction.lights.find((r) => r.ref === leaf || r.ref === normalized);
  if (light != null) {
    return light;
  }

  const camera = extraction.cameras.find((r) => r.ref === leaf || r.ref === normalized);
  if (camera != null) {
    return camera;
  }

  const material = extraction.materials.find((r) => r.ref === leaf || r.ref === normalized);
  if (material != null) {
    return material;
  }

  const morph = extraction.morphs.find(
    (r) => r.ref === normalized || r.ref.endsWith(`:${leaf}`) || r.label === leaf,
  );
  if (morph != null) {
    return morph;
  }

  return null;
}

export function stagePickMatchesOutlinerParent(
  pick: StageViewportPickDetail,
  parentModelFlowNodeId: string | null,
): boolean {
  if (parentModelFlowNodeId == null) {
    return false;
  }
  return pick.sourceNodeId === parentModelFlowNodeId;
}

export function selectedRowKeyFromExtractRow(row: StudioGltfExtractRow): string {
  return studioGlbExtractRowKey(row);
}
