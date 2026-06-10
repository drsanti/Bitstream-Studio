import { Layers } from "lucide-react";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import { isKonvaConnectorShape, isKonvaGroupShape } from "../schemas/konvaShapes";
import { findKonvaShapeById } from "../runtime/diagram/konvaShapeTree";
import { konvaShapeTypeLabel } from "./konvaShapeStylePresets";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { useCourseDiagramWorkbenchUiStore } from "../workbench/course-diagram-workbench-ui.store";

function konvaOutlinerLabel(shape: KonvaShapeV1): string {
  if (isKonvaGroupShape(shape)) {
    return `${shape.id} · group (${shape.children.length})`;
  }
  if (isKonvaConnectorShape(shape)) {
    return `${shape.id} · ${shape.type}`;
  }
  return `${shape.id} · ${konvaShapeTypeLabel(shape.type)}`;
}

function OutlinerRows({
  shapes,
  depth,
  selectedShapeIds,
  onSelectShape,
}: {
  shapes: KonvaShapeV1[];
  depth: number;
  selectedShapeIds: string[];
  onSelectShape: (shapeId: string, shapeType: KonvaShapeV1["type"], shiftKey: boolean) => void;
}) {
  return shapes.map((shape) => {
    const selected = selectedShapeIds.includes(shape.id);
    return (
      <li key={shape.id}>
        <button
          type="button"
          className={`w-full rounded-md border py-1 text-left text-[11px] transition ${
            selected
              ? "border-sky-500/40 bg-sky-500/10 text-sky-100"
              : "border-transparent text-zinc-400 hover:border-[var(--surface-border)] hover:bg-[var(--surface-card)] hover:text-zinc-200"
          }`}
          style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "6px" }}
          onClick={(event) => onSelectShape(shape.id, shape.type, event.shiftKey)}
        >
          {konvaOutlinerLabel(shape)}
        </button>
        {isKonvaGroupShape(shape) && shape.children.length > 0 ? (
          <ul className="mt-0.5 space-y-0.5">
            <OutlinerRows
              shapes={shape.children}
              depth={depth + 1}
              selectedShapeIds={selectedShapeIds}
              onSelectShape={onSelectShape}
            />
          </ul>
        ) : null}
      </li>
    );
  });
}

export function KonvaShapeOutliner({ diagramId }: { diagramId: string }) {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  const shapes = draft?.freeform?.shapes ?? [];
  const selectedShapeIds = useCourseDiagramWorkbenchUiStore((s) => s.selectedKonvaShapeIds);
  const requestKonvaSelection = useCourseDiagramWorkbenchUiStore((s) => s.requestKonvaSelection);

  const handleSelect = (shapeId: string, shapeType: KonvaShapeV1["type"], shiftKey: boolean) => {
    const shape = findKonvaShapeById(shapes, shapeId);
    if (shape == null) {
      return;
    }
    if (shiftKey) {
      const next = selectedShapeIds.includes(shapeId)
        ? selectedShapeIds.filter((id) => id !== shapeId)
        : [...selectedShapeIds, shapeId];
      requestKonvaSelection(next, shape.type);
      return;
    }
    requestKonvaSelection([shapeId], shapeType);
  };

  return (
    <CourseInspectorCard
      title="Layer outliner"
      hint="Top-level shapes and nested groups — syncs with canvas selection."
      titleIcon={<Layers className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded
    >
      {shapes.length === 0 ? (
        <TRNHintText className="!text-[10px]">No shapes yet — use the toolbar to add objects.</TRNHintText>
      ) : (
        <ul className="space-y-0.5">
          <OutlinerRows
            shapes={shapes}
            depth={0}
            selectedShapeIds={selectedShapeIds}
            onSelectShape={handleSelect}
          />
        </ul>
      )}
    </CourseInspectorCard>
  );
}
