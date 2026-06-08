import type { StudioGltfExtractKind } from "../../gltf/studio-gltf-extract";

export const STUDIO_GLB_EXTRACT_DRAG_MIME = "application/x-ternion-sensor-studio-glb-extract+json";

export type StudioGlbExtractDragPayloadV1 = {
  v: 1;
  parentModelFlowNodeId: string;
  kind: StudioGltfExtractKind;
  glbRef: string;
  label: string;
};

export type StudioGlbExtractDragPayloadV2 = {
  v: 2;
  kind: StudioGltfExtractKind;
  glbRef: string;
  label: string;
  parentModelFlowNodeId?: string;
  inlineCatalogAssetId?: string;
};

export type StudioGlbExtractDragPayload = StudioGlbExtractDragPayloadV1 | StudioGlbExtractDragPayloadV2;

function parseExtractFields(parsed: Record<string, unknown>): {
  kind: StudioGltfExtractKind;
  glbRef: string;
  label: string;
} | null {
  if (typeof parsed.kind !== "string" || typeof parsed.glbRef !== "string" || typeof parsed.label !== "string") {
    return null;
  }
  if (parsed.glbRef.trim().length === 0 || parsed.label.trim().length === 0) {
    return null;
  }
  return {
    kind: parsed.kind as StudioGltfExtractKind,
    glbRef: parsed.glbRef.trim(),
    label: parsed.label.trim(),
  };
}

export function setStudioGlbExtractDragData(
  transfer: DataTransfer,
  payload: StudioGlbExtractDragPayloadV1 | StudioGlbExtractDragPayloadV2,
): void {
  transfer.setData(STUDIO_GLB_EXTRACT_DRAG_MIME, JSON.stringify(payload));
  transfer.effectAllowed = "copy";
}

export function parseStudioGlbExtractDragData(transfer: DataTransfer): StudioGlbExtractDragPayload | null {
  const raw = transfer.getData(STUDIO_GLB_EXTRACT_DRAG_MIME);
  if (raw.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const fields = parseExtractFields(parsed);
    if (fields == null) {
      return null;
    }
    if (parsed.v === 2) {
      const parent =
        typeof parsed.parentModelFlowNodeId === "string" ? parsed.parentModelFlowNodeId.trim() : "";
      const inline =
        typeof parsed.inlineCatalogAssetId === "string" ? parsed.inlineCatalogAssetId.trim() : "";
      if (parent.length === 0 && inline.length === 0) {
        return null;
      }
      return {
        v: 2,
        ...fields,
        ...(parent.length > 0 ? { parentModelFlowNodeId: parent } : {}),
        ...(inline.length > 0 ? { inlineCatalogAssetId: inline } : {}),
      };
    }
    if (parsed.v !== 1) {
      return null;
    }
    if (typeof parsed.parentModelFlowNodeId !== "string" || parsed.parentModelFlowNodeId.trim().length === 0) {
      return null;
    }
    return {
      v: 1,
      parentModelFlowNodeId: parsed.parentModelFlowNodeId.trim(),
      ...fields,
    };
  } catch {
    return null;
  }
}
