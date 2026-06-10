import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Trash2,
} from "lucide-react";
import type { KonvaShapeZOrderDirection } from "../runtime/diagram/konvaShapeZOrder";
import { useKonvaShapeStyleEditor } from "./useKonvaShapeStyleEditor";
import { KonvaShapeStyleControls } from "./KonvaShapeStyleControls";
import { CourseMarkdownEditorIconButton } from "./markdown-editor/CourseMarkdownEditorIconButton";

const ICON_PROPS = { size: 14, strokeWidth: 2, "aria-hidden": true as const };

function FloatingPanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="course-konva-style-controls__section course-konva-style-controls__section--compact">
      <span className="course-konva-style-controls__label">{label}</span>
      <div className="course-konva-style-controls__row">{children}</div>
    </div>
  );
}

export function KonvaShapeFloatingPanel({
  diagramId,
  selectedShapeId,
  selectedZOrderIndex,
  shapeCount,
  onDuplicate,
  onDelete,
  onReorder,
  onUngroup,
  canUngroup = false,
  groupChildCount = 0,
}: {
  diagramId: string;
  selectedShapeId: string;
  selectedZOrderIndex: number;
  shapeCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (direction: KonvaShapeZOrderDirection) => void;
  onUngroup?: () => void;
  canUngroup?: boolean;
  groupChildCount?: number;
}) {
  const { shape, patchShape, hasStroke, hasFill, isText, isGroup, hasCornerRadius } = useKonvaShapeStyleEditor(
    diagramId,
    selectedShapeId,
  );

  if (shape == null) {
    return null;
  }

  const canReorderUp = selectedZOrderIndex >= 0 && selectedZOrderIndex < shapeCount - 1;
  const canReorderDown = selectedZOrderIndex > 0;

  return (
    <div
      className="course-konva-floating-panel pointer-events-auto"
      role="toolbar"
      aria-label="Shape properties"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <KonvaShapeStyleControls
        layout="floating"
        shapeId={selectedShapeId}
        shape={shape}
        patchShape={patchShape}
        hasStroke={hasStroke}
        hasFill={hasFill}
        isText={isText}
        isGroup={isGroup}
        groupChildCount={groupChildCount}
        hasCornerRadius={hasCornerRadius}
        onUngroup={onUngroup}
        canUngroup={canUngroup}
      />

      <FloatingPanelSection label="Layers">
        <CourseMarkdownEditorIconButton
          hint="Send to back"
          ariaLabel="Send to back"
          disabled={!canReorderDown}
          onClick={() => onReorder("back")}
        >
          <ChevronsDown {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Send backward"
          ariaLabel="Send backward"
          disabled={!canReorderDown}
          onClick={() => onReorder("backward")}
        >
          <ChevronDown {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Bring forward"
          ariaLabel="Bring forward"
          disabled={!canReorderUp}
          onClick={() => onReorder("forward")}
        >
          <ChevronUp {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Bring to front"
          ariaLabel="Bring to front"
          disabled={!canReorderUp}
          onClick={() => onReorder("front")}
        >
          <ChevronsUp {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
      </FloatingPanelSection>

      <FloatingPanelSection label="Actions">
        <CourseMarkdownEditorIconButton hint="Duplicate (Ctrl+D)" ariaLabel="Duplicate" onClick={onDuplicate}>
          <Copy {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Delete shape" ariaLabel="Delete" onClick={onDelete}>
          <Trash2 {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
      </FloatingPanelSection>
    </div>
  );
}
