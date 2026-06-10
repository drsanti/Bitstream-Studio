import { useCallback, useEffect } from "react";
import { ensureCourseDiagramDraft } from "../content/diagramRegistry";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import { patchKonvaShape } from "../runtime/diagram/konvaShapeMutations";
import { findKonvaShapeById } from "../runtime/diagram/konvaShapeTree";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

export function useKonvaShapeStyleEditor(
  diagramId: string,
  selectedShapeId: string | null,
) {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  const updateKonvaFreeform = useCourseDiagramEditorStore((s) => s.updateKonvaFreeform);
  const shapes = draft?.freeform?.shapes ?? [];
  const view = draft?.freeform?.view;

  useEffect(() => {
    ensureCourseDiagramDraft(diagramId);
  }, [diagramId]);

  const patchShape = useCallback(
    (patch: Partial<KonvaShapeV1>, options?: { recordUndo?: boolean }) => {
      if (selectedShapeId == null || draft?.freeform == null) {
        return;
      }
      updateKonvaFreeform(
        diagramId,
        {
          shapes: patchKonvaShape(shapes, selectedShapeId, patch),
          view,
        },
        { recordUndo: options?.recordUndo ?? true },
      );
    },
    [diagramId, draft?.freeform, selectedShapeId, shapes, updateKonvaFreeform, view],
  );

  const shape =
    selectedShapeId != null ? findKonvaShapeById(shapes, selectedShapeId) : null;

  const isGroup = shape?.type === "group";
  const hasStroke = shape != null && shape.type !== "text" && shape.type !== "group";
  const hasFill =
    shape != null &&
    (shape.type === "rect" || shape.type === "diamond" || shape.type === "circle");
  const isText = shape?.type === "text";

  const hasCornerRadius = shape?.type === "rect";
  const hasConnector = shape?.type === "line" || shape?.type === "arrow";

  return { shape, patchShape, hasStroke, hasFill, isText, isGroup, hasCornerRadius, hasConnector };
}
