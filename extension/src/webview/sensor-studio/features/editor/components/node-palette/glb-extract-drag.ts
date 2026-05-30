import type { StudioGltfExtractKind } from "../../gltf/studio-gltf-extract";

export const STUDIO_GLB_EXTRACT_DRAG_MIME = "application/x-ternion-sensor-studio-glb-extract+json";

export type StudioGlbExtractDragPayloadV1 = {
  v: 1;
  parentModelFlowNodeId: string;
  kind: StudioGltfExtractKind;
  glbRef: string;
  label: string;
};

export function setStudioGlbExtractDragData(transfer: DataTransfer, payload: StudioGlbExtractDragPayloadV1): void {
  transfer.setData(STUDIO_GLB_EXTRACT_DRAG_MIME, JSON.stringify(payload));
  transfer.effectAllowed = "copy";
}

export function parseStudioGlbExtractDragData(transfer: DataTransfer): StudioGlbExtractDragPayloadV1 | null {
  const raw = transfer.getData(STUDIO_GLB_EXTRACT_DRAG_MIME);
  if (raw.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StudioGlbExtractDragPayloadV1;
    if (parsed?.v !== 1) {
      return null;
    }
    if (typeof parsed.parentModelFlowNodeId !== "string" || parsed.parentModelFlowNodeId.trim().length === 0) {
      return null;
    }
    if (typeof parsed.kind !== "string" || typeof parsed.glbRef !== "string" || typeof parsed.label !== "string") {
      return null;
    }
    if (parsed.glbRef.trim().length === 0 || parsed.label.trim().length === 0) {
      return null;
    }
    return {
      v: 1,
      parentModelFlowNodeId: parsed.parentModelFlowNodeId.trim(),
      kind: parsed.kind as StudioGltfExtractKind,
      glbRef: parsed.glbRef.trim(),
      label: parsed.label.trim(),
    };
  } catch {
    return null;
  }
}
