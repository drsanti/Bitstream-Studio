import type { ReactNode } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Diamond,
  Circle as CircleIcon,
  Group as GroupIcon,
  Hand,
  LogOut,
  Maximize2,
  Minus,
  Redo2,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import type { KonvaShapeZOrderDirection } from "../runtime/diagram/konvaShapeZOrder";
import { TRNColorRingPicker } from "../../ui/TRN/TRNColorRingPicker";
import { CourseMarkdownEditorIconButton } from "./markdown-editor/CourseMarkdownEditorIconButton";

type PlacementTool = "line" | "arrow" | null;

function KonvaToolbarGroup({ separator, children }: { separator: boolean; children: ReactNode }) {
  return (
    <>
      {separator ? (
        <span className="course-md-editor-toolbar-sep mx-0.5 h-4 w-px shrink-0" aria-hidden />
      ) : null}
      {children}
    </>
  );
}

const ICON_PROPS = { size: 14, strokeWidth: 2, "aria-hidden": true as const };

export function CourseKonvaEditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddShape,
  placementTool,
  onPlacementToolChange,
  selectedShapeId,
  selectedZOrderIndex,
  shapeCount,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  canGroup,
  canUngroup,
  onReorder,
  panToolActive,
  onPanToolToggle,
  onZoomIn,
  onZoomOut,
  onFitView,
  canvasBackground,
  onCanvasBackgroundChange,
  dirty = false,
  saving = false,
  onDiscard,
  onSave,
  statusLabel,
  groupEditBreadcrumb = [],
  onExitGroupEdit,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddShape: (type: KonvaShapeV1["type"]) => void;
  placementTool: PlacementTool;
  onPlacementToolChange: (tool: PlacementTool) => void;
  selectedShapeId: string | null;
  selectedZOrderIndex: number;
  shapeCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  canGroup: boolean;
  canUngroup: boolean;
  onReorder: (direction: KonvaShapeZOrderDirection) => void;
  panToolActive: boolean;
  onPanToolToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  canvasBackground: string;
  onCanvasBackgroundChange?: (hex: string) => void;
  dirty?: boolean;
  saving?: boolean;
  onDiscard?: () => void;
  onSave?: () => void;
  statusLabel: string;
  groupEditBreadcrumb?: string[];
  onExitGroupEdit?: () => void;
}) {
  const showDocumentActions = dirty && onDiscard != null && onSave != null;
  const hasSelection = selectedShapeId != null;
  const canReorderUp = hasSelection && selectedZOrderIndex >= 0 && selectedZOrderIndex < shapeCount - 1;
  const canReorderDown = hasSelection && selectedZOrderIndex > 0;

  return (
    <div className="course-md-editor-toolbar course-konva-editor-toolbar flex min-h-8 flex-wrap items-center gap-0 px-1.5 py-0.5">
      <KonvaToolbarGroup separator={false}>
        <CourseMarkdownEditorIconButton
          hint="Undo (Ctrl+Z)"
          ariaLabel="Undo"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Redo (Ctrl+Shift+Z)"
          ariaLabel="Redo"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
      </KonvaToolbarGroup>

      <KonvaToolbarGroup separator>
        <CourseMarkdownEditorIconButton hint="Rectangle" ariaLabel="Rectangle" onClick={() => onAddShape("rect")}>
          <Square {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Diamond" ariaLabel="Diamond" onClick={() => onAddShape("diamond")}>
          <Diamond {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Circle" ariaLabel="Circle" onClick={() => onAddShape("circle")}>
          <CircleIcon {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Text label" ariaLabel="Text label" onClick={() => onAddShape("text")}>
          <Type {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Draw line — drag on canvas"
          ariaLabel="Draw line"
          selected={placementTool === "line"}
          onClick={() => onPlacementToolChange(placementTool === "line" ? null : "line")}
        >
          <Minus {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Draw arrow — drag on canvas"
          ariaLabel="Draw arrow"
          selected={placementTool === "arrow"}
          onClick={() => onPlacementToolChange(placementTool === "arrow" ? null : "arrow")}
        >
          <ArrowRight {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
      </KonvaToolbarGroup>

      <KonvaToolbarGroup separator>
        <CourseMarkdownEditorIconButton
          hint="Group selection (Ctrl+G)"
          ariaLabel="Group"
          disabled={!canGroup}
          onClick={onGroup}
        >
          <GroupIcon {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Ungroup (Ctrl+Shift+G)"
          ariaLabel="Ungroup"
          disabled={!canUngroup}
          onClick={onUngroup}
        >
          <GroupIcon {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Duplicate (Ctrl+D)"
          ariaLabel="Duplicate"
          disabled={!hasSelection}
          onClick={onDuplicate}
        >
          <Copy {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton
          hint="Delete selected shape"
          ariaLabel="Delete"
          disabled={!hasSelection}
          onClick={onDelete}
        >
          <Trash2 {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
      </KonvaToolbarGroup>

      <KonvaToolbarGroup separator>
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
      </KonvaToolbarGroup>

      <KonvaToolbarGroup separator>
        <CourseMarkdownEditorIconButton
          hint="Pan canvas — hold Space or middle-mouse"
          ariaLabel="Pan"
          selected={panToolActive}
          onClick={onPanToolToggle}
        >
          <Hand {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Zoom in" ariaLabel="Zoom in" onClick={onZoomIn}>
          <ZoomIn {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Zoom out" ariaLabel="Zoom out" onClick={onZoomOut}>
          <ZoomOut {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        <CourseMarkdownEditorIconButton hint="Fit canvas in view" ariaLabel="Fit view" onClick={onFitView}>
          <Maximize2 {...ICON_PROPS} />
        </CourseMarkdownEditorIconButton>
        {onCanvasBackgroundChange != null ? (
          <span className="inline-flex shrink-0 items-center px-0.5">
            <TRNColorRingPicker
              ariaLabel="Canvas background color"
              valueHex={canvasBackground}
              triggerVariant="swatch"
              size="sm"
              onValueHexChange={onCanvasBackgroundChange}
            />
          </span>
        ) : null}
      </KonvaToolbarGroup>

      {showDocumentActions ? (
        <KonvaToolbarGroup separator>
          <CourseMarkdownEditorIconButton
            hint="Discard unsaved diagram changes"
            ariaLabel="Discard"
            onClick={onDiscard}
          >
            <RotateCcw {...ICON_PROPS} />
          </CourseMarkdownEditorIconButton>
          <CourseMarkdownEditorIconButton
            hint={saving ? "Saving diagram…" : "Save diagram to repo"}
            ariaLabel="Save diagram"
            selected={dirty}
            disabled={saving}
            className={dirty ? "course-konva-editor-icon-btn--save" : undefined}
            onClick={onSave}
          >
            <Save {...ICON_PROPS} />
          </CourseMarkdownEditorIconButton>
        </KonvaToolbarGroup>
      ) : null}

      {groupEditBreadcrumb.length > 0 && onExitGroupEdit != null ? (
        <KonvaToolbarGroup separator>
          <span className="max-w-[220px] truncate px-1 text-[11px] text-zinc-400">
            {groupEditBreadcrumb.join(" › ")}
          </span>
          <CourseMarkdownEditorIconButton
            hint="Exit group (Esc)"
            ariaLabel="Exit group"
            onClick={onExitGroupEdit}
          >
            <LogOut {...ICON_PROPS} />
          </CourseMarkdownEditorIconButton>
        </KonvaToolbarGroup>
      ) : null}

      <span className="ml-auto shrink-0 pr-0.5 text-[11px] text-[var(--text-muted)]">{statusLabel}</span>
    </div>
  );
}
