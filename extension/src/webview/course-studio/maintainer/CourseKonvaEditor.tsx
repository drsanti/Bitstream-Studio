import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import {
  getCourseDiagramSourcePath,
  loadCourseDiagram,
} from "../content/diagramRegistry";
import { courseDiagramSourcePathForId } from "../content/diagramTemplates";
import { konvaPropertyBindingsHasContent } from "../schemas/konvaPropertyBindings";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import type { DiagramLiveSnapshot } from "../runtime/diagram/diagramBindingCatalog";
import { evaluateKonvaShapes } from "../runtime/diagram/evaluateKonvaShapes";
import {
  applyKonvaDragOffsetToShape,
  getKonvaShapeDragStartBounds,
  snapKonvaCanvasPoint,
  snapKonvaShapeDragOffset,
  snapKonvaShapeGeometry,
} from "../runtime/diagram/konvaAlignmentSnap";
import { collectKonvaAlignTargets } from "../runtime/diagram/konvaShapeBounds";
import { duplicateKonvaShape } from "../runtime/diagram/konvaShapeMutations";
import {
  konvaShapeZOrderIndex,
  reorderKonvaShapes,
  type KonvaShapeZOrderDirection,
} from "../runtime/diagram/konvaShapeZOrder";
import {
  resetKonvaNodeTransform,
  shapeFromKonvaNode,
} from "../runtime/diagram/konvaShapeTransform";
import {
  konvaRectKonvaCornerRadius,
  nudgeKonvaRectCornerRadius,
} from "../runtime/diagram/konvaCornerRadius";
import {
  konvaSelectionBoxIsDrag,
  konvaShapeIdsInSelectionBox,
  mergeKonvaShapeSelection,
  normalizeKonvaSelectionBox,
  primaryKonvaShapeSelection,
  toggleKonvaShapeSelection,
} from "../runtime/diagram/konvaBoxSelection";
import type { DiagramAlignmentGuide } from "../runtime/diagram/diagramAlignmentSnap";
import {
  COURSE_KONVA_STROKE_COLOR,
  COURSE_KONVA_TEXT_COLOR,
  normalizeKonvaCanvasView,
} from "./courseKonvaTheme";
import { CourseKonvaEditorToolbar } from "./CourseKonvaEditorToolbar";
import { KonvaConnectorEndpointHandles } from "./KonvaConnectorEndpointHandles";
import { KonvaConnectorPathHandles } from "./KonvaConnectorPathHandles";
import { KonvaConnectorMagnetPorts } from "./KonvaConnectorMagnetPorts";
import { KonvaConnectorShapeNode } from "./KonvaConnectorShape";
import {
  insertKonvaConnectorBendPoint,
  removeKonvaConnectorBendPointNear,
  resolveKonvaConnectors,
  syncKonvaConnectorsForMovedShapes,
} from "../runtime/diagram/konvaConnectorPath";
import { snapKonvaConnectorPoint } from "../runtime/diagram/konvaConnectorSnap";
import {
  canGroupKonvaShapes,
  canUngroupKonvaShape,
  groupKonvaShapes,
  ungroupKonvaShape,
  listKonvaGroupableShapeIds,
} from "../runtime/diagram/konvaShapeGroup";
import {
  collectKonvaShapeDescendantIds,
  findKonvaShapeAncestorPath,
  findKonvaShapeById,
  findKonvaShapeParentId,
  flattenKonvaShapesToWorld,
  getKonvaShapeWorldBounds,
  isKonvaTopLevelShapeId,
  removeKonvaShapeById,
  replaceKonvaShapeById,
  translateKonvaShapeLocal,
} from "../runtime/diagram/konvaShapeTree";
import { isKonvaConnectorShape, isKonvaGroupShape } from "../schemas/konvaShapes";
import { KonvaRectCornerRadiusHandles } from "./KonvaRectCornerRadiusHandles";
import { KonvaShapeFloatingPanel } from "./KonvaShapeFloatingPanel";
import { KonvaTextEditOverlay } from "./KonvaTextEditOverlay";
import { registerKonvaEditorShortcutHandlers } from "./konvaEditorShortcutBridge";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { useCourseDiagramWorkbenchUiStore } from "../workbench/course-diagram-workbench-ui.store";

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.15;
const MIN_LINE_LENGTH = 6;

type DrawConnectorPoint = {
  x: number;
  y: number;
  attach?: { shapeId: string; anchor?: string };
};

function snapDrawConnectorPoint(args: {
  x: number;
  y: number;
  shapes: KonvaShapeV1[];
  view: { width: number; height: number };
  snapEnabled: boolean;
}): DrawConnectorPoint & { guides: DiagramAlignmentGuide[] } {
  const targets = collectKonvaAlignTargets(args.shapes, "__drawing__", args.view);
  const aligned = snapKonvaCanvasPoint({
    x: args.x,
    y: args.y,
    targets,
    snapEnabled: args.snapEnabled,
  });
  const magnetShapes = flattenKonvaShapesToWorld(args.shapes);
  const magnet = snapKonvaConnectorPoint({
    x: aligned.x,
    y: aligned.y,
    shapes: magnetShapes,
    magnetEnabled: args.snapEnabled,
  });
  return {
    x: magnet.x,
    y: magnet.y,
    attach: magnet.attach,
    guides: aligned.guides,
  };
}

type PlacementTool = "line" | "arrow" | null;

let shapeIdSequence = 0;

function nextKonvaShapeId(): string {
  shapeIdSequence += 1;
  return `konva-${Date.now().toString(36)}-${shapeIdSequence}`;
}

function computeFitViewport(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): { scale: number; x: number; y: number } {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { scale: 1, x: 0, y: 0 };
  }
  const scale = Math.min(containerWidth / canvasWidth, containerHeight / canvasHeight);
  return {
    scale,
    x: (containerWidth - canvasWidth * scale) / 2,
    y: (containerHeight - canvasHeight * scale) / 2,
  };
}

function pointerToCanvas(stage: Konva.Stage): { x: number; y: number } | null {
  const pointer = stage.getPointerPosition();
  if (pointer == null) {
    return null;
  }
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(pointer);
}

function shapeUsesDragOffset(shape: KonvaShapeV1): boolean {
  return shape.type === "line" || shape.type === "arrow";
}

function getShapeNodePosition(shape: KonvaShapeV1): { x: number; y: number } {
  if (shape.type === "circle") {
    return { x: shape.x, y: shape.y };
  }
  if (shape.type === "line" || shape.type === "arrow") {
    return { x: 0, y: 0 };
  }
  return { x: shape.x, y: shape.y };
}

/** Live geometry for a shape while dragging (before persist on drag end). */
function shapePreviewFromDragNode(shape: KonvaShapeV1, node: Konva.Node): KonvaShapeV1 {
  if (shapeUsesDragOffset(shape)) {
    return applyKonvaDragOffsetToShape(shape, node.x(), node.y());
  }
  if (shape.type === "circle") {
    return { ...shape, x: node.x(), y: node.y() };
  }
  if (isKonvaGroupShape(shape)) {
    return { ...shape, x: node.x(), y: node.y() };
  }
  return { ...shape, x: node.x(), y: node.y() };
}

type GestureShapePreviewMap = Record<string, KonvaShapeV1>;

function applyKonvaGestureShapePreviews(
  shapes: KonvaShapeV1[],
  previews: GestureShapePreviewMap,
): KonvaShapeV1[] {
  if (Object.keys(previews).length === 0) {
    return shapes;
  }
  return shapes.map((shape) => previews[shape.id] ?? shape);
}

function patchGestureShapePreview(
  previews: GestureShapePreviewMap,
  shape: KonvaShapeV1,
): GestureShapePreviewMap {
  return { ...previews, [shape.id]: shape };
}

function clearGestureShapePreview(
  previews: GestureShapePreviewMap,
  shapeId: string,
): GestureShapePreviewMap {
  if (!(shapeId in previews)) {
    return previews;
  }
  const next = { ...previews };
  delete next[shapeId];
  return next;
}

function applyGesturePreviewsInTree(
  shape: KonvaShapeV1,
  previews: GestureShapePreviewMap,
): KonvaShapeV1 {
  const preview = previews[shape.id];
  const base = preview ?? shape;
  if (!isKonvaGroupShape(base)) {
    return base;
  }
  return {
    ...base,
    children: base.children.map((child) => applyGesturePreviewsInTree(child, previews)),
  };
}

function movedShapeIdsForConnectorSync(shape: KonvaShapeV1, shapeId: string): string[] {
  if (isKonvaGroupShape(shape)) {
    return collectKonvaShapeDescendantIds(shape);
  }
  return [shapeId];
}

type KonvaShapeNodeProps = {
  shape: KonvaShapeV1;
  readOnly: boolean;
  onSelect: (
    shapeId: string,
    shapeType: KonvaShapeV1["type"],
    modifiers?: { shiftKey?: boolean },
  ) => void;
  onGestureStart: (shapeId: string) => void;
  onDragMove: (id: string, node: Konva.Node) => void;
  onDragEnd: (id: string, node: Konva.Node) => void;
  onTransformStart: (id: string) => void;
  onTransform: (id: string, node: Konva.Node) => void;
  onTransformEnd: (id: string) => void;
  onEditText?: (id: string) => void;
  showCornerRadiusHandles?: boolean;
  onCornerRadiusGestureStart?: () => void;
  onCornerRadiusCommit?: (next: Extract<KonvaShapeV1, { type: "rect" }>) => void;
  onAddConnectorBendPoint?: (shapeId: string, point: { x: number; y: number }) => void;
  onRemoveConnectorBendPoint?: (shapeId: string, point: { x: number; y: number }) => void;
  groupEditId?: string | null;
  onEnterGroupEdit?: (groupId: string) => void;
  onShapeRef?: (shapeId: string, node: Konva.Node | null) => void;
};

function KonvaGroupedChildShape({
  shape,
  onSelect,
  onEnterGroupEdit,
}: {
  shape: KonvaShapeV1;
  onSelect: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onEnterGroupEdit?: (groupId: string) => void;
}) {
  const handleSelect = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true;
    onSelect(event);
  };

  if (shape.type === "rect") {
    return (
      <Group x={shape.x} y={shape.y} rotation={shape.rotation} opacity={shape.opacity ?? 1}>
        <Rect
          x={0}
          y={0}
          width={shape.width}
          height={shape.height}
          cornerRadius={konvaRectKonvaCornerRadius(shape)}
          stroke={shape.stroke ?? COURSE_KONVA_STROKE_COLOR}
          strokeWidth={shape.strokeWidth ?? 2}
          fill={shape.fill ?? "transparent"}
          onClick={handleSelect}
          onTap={handleSelect}
        />
      </Group>
    );
  }

  if (shape.type === "diamond") {
    const { x, y, width, height } = shape;
    return (
      <Group x={x} y={y} rotation={shape.rotation} opacity={shape.opacity ?? 1}>
        <Line
          points={[width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]}
          closed
          stroke={shape.stroke ?? COURSE_KONVA_STROKE_COLOR}
          strokeWidth={shape.strokeWidth ?? 2}
          fill={shape.fill ?? "transparent"}
          shadowForStrokeEnabled={false}
          onClick={handleSelect}
          onTap={handleSelect}
        />
      </Group>
    );
  }

  if (shape.type === "circle") {
    return (
      <Circle
        x={shape.x}
        y={shape.y}
        radius={shape.radius}
        stroke={shape.stroke ?? COURSE_KONVA_STROKE_COLOR}
        strokeWidth={shape.strokeWidth ?? 2}
        fill={shape.fill ?? "transparent"}
        opacity={shape.opacity ?? 1}
        rotation={shape.rotation}
        onClick={handleSelect}
        onTap={handleSelect}
      />
    );
  }

  if (shape.type === "text") {
    return (
      <Text
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize ?? 20}
        fill={shape.fill ?? COURSE_KONVA_TEXT_COLOR}
        opacity={shape.opacity ?? 1}
        rotation={shape.rotation}
        onClick={handleSelect}
        onTap={handleSelect}
      />
    );
  }

  if (isKonvaGroupShape(shape)) {
    const handleEnterGroup = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      event.cancelBubble = true;
      onEnterGroupEdit?.(shape.id);
    };
    return (
      <Group
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        opacity={shape.opacity ?? 1}
        onClick={handleSelect}
        onTap={handleSelect}
        onDblClick={handleEnterGroup}
        onDblTap={handleEnterGroup}
      >
        {shape.children.map((child) => (
          <KonvaGroupedChildShape
            key={child.id}
            shape={child}
            onSelect={onSelect}
            onEnterGroupEdit={onEnterGroupEdit}
          />
        ))}
      </Group>
    );
  }

  return null;
}

const KonvaShapeNode = forwardRef(function KonvaShapeNode(
  {
    shape,
    readOnly,
    onSelect,
    onGestureStart,
    onDragMove,
    onDragEnd,
    onTransformStart,
    onTransform,
    onTransformEnd,
    onEditText,
    showCornerRadiusHandles,
    onCornerRadiusGestureStart,
    onCornerRadiusCommit,
    onAddConnectorBendPoint,
    onRemoveConnectorBendPoint,
    groupEditId,
    onEnterGroupEdit,
    onShapeRef,
  }: KonvaShapeNodeProps,
  ref: Ref<Konva.Node>,
) {
  const handleDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    onDragMove(shape.id, event.target);
  };

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(shape.id, event.target);
  };

  const handleTransformEnd = (event: Konva.KonvaEventObject<Event>) => {
    onTransformEnd(shape.id);
    event.target.getLayer()?.batchDraw();
  };

  const handleTransformStart = () => {
    onTransformStart(shape.id);
  };

  const handleTransform = (event: Konva.KonvaEventObject<Event>) => {
    onTransform(shape.id, event.target);
  };

  const handleSelect = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true;
    onSelect(shape.id, shape.type, {
      shiftKey: "shiftKey" in event.evt ? event.evt.shiftKey : false,
    });
  };

  if (isKonvaGroupShape(shape)) {
    const editingThisGroup = groupEditId === shape.id;
    const handleEnterGroup = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      event.cancelBubble = true;
      onEnterGroupEdit?.(shape.id);
    };
    return (
      <Group
        ref={ref as Ref<Konva.Group>}
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        opacity={shape.opacity ?? 1}
        draggable={!readOnly && !editingThisGroup}
        onClick={handleSelect}
        onTap={handleSelect}
        onDblClick={handleEnterGroup}
        onDblTap={handleEnterGroup}
        onDragStart={() => onGestureStart(shape.id)}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformStart={() => {
          onGestureStart(shape.id);
          handleTransformStart();
        }}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      >
        {shape.children.map((child) =>
          editingThisGroup || groupEditId === child.id ? (
            <KonvaShapeNode
              key={child.id}
              ref={(node) => onShapeRef?.(child.id, node)}
              shape={child}
              readOnly={readOnly}
              onSelect={onSelect}
              onGestureStart={onGestureStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onTransformStart={onTransformStart}
              onTransform={onTransform}
              onTransformEnd={onTransformEnd}
              onEditText={onEditText}
              groupEditId={groupEditId}
              onEnterGroupEdit={onEnterGroupEdit}
              onShapeRef={onShapeRef}
              onAddConnectorBendPoint={onAddConnectorBendPoint}
              onRemoveConnectorBendPoint={onRemoveConnectorBendPoint}
            />
          ) : (
            <KonvaGroupedChildShape
              key={child.id}
              shape={child}
              onSelect={handleSelect}
              onEnterGroupEdit={onEnterGroupEdit}
            />
          ),
        )}
      </Group>
    );
  }

  if (shape.type === "rect") {
    return (
      <Group
        ref={ref as Ref<Konva.Group>}
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        opacity={shape.opacity ?? 1}
        draggable={!readOnly}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragStart={() => onGestureStart(shape.id)}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformStart={() => {
          onGestureStart(shape.id);
          handleTransformStart();
        }}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      >
        <Rect
          id={`shape-${shape.id}`}
          x={0}
          y={0}
          width={shape.width}
          height={shape.height}
          cornerRadius={konvaRectKonvaCornerRadius(shape)}
          stroke={shape.stroke ?? COURSE_KONVA_STROKE_COLOR}
          strokeWidth={shape.strokeWidth ?? 2}
          fill={shape.fill ?? "transparent"}
        />
        {showCornerRadiusHandles && onCornerRadiusGestureStart != null && onCornerRadiusCommit != null ? (
          <KonvaRectCornerRadiusHandles
            shape={shape}
            onGestureStart={onCornerRadiusGestureStart}
            onCommit={onCornerRadiusCommit}
          />
        ) : null}
      </Group>
    );
  }

  if (shape.type === "diamond") {
    const { x, y, width, height } = shape;
    return (
      <Group
        ref={ref as Ref<Konva.Group>}
        x={x}
        y={y}
        rotation={shape.rotation}
        opacity={shape.opacity ?? 1}
        draggable={!readOnly}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragStart={() => onGestureStart(shape.id)}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformStart={() => {
          onGestureStart(shape.id);
          onTransformStart(shape.id);
        }}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      >
        <Line
          points={[width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]}
          closed
          stroke={shape.stroke ?? COURSE_KONVA_STROKE_COLOR}
          strokeWidth={shape.strokeWidth ?? 2}
          fill={shape.fill ?? "transparent"}
          shadowForStrokeEnabled={false}
        />
      </Group>
    );
  }

  if (shape.type === "circle") {
    return (
      <Circle
        ref={ref as Ref<Konva.Circle>}
        x={shape.x}
        y={shape.y}
        radius={shape.radius}
        stroke={shape.stroke ?? COURSE_KONVA_STROKE_COLOR}
        strokeWidth={shape.strokeWidth ?? 2}
        fill={shape.fill ?? "transparent"}
        opacity={shape.opacity ?? 1}
        rotation={shape.rotation}
        draggable={!readOnly}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragStart={() => onGestureStart(shape.id)}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformStart={() => {
          onGestureStart(shape.id);
          onTransformStart(shape.id);
        }}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      />
    );
  }

  if (shape.type === "line" || shape.type === "arrow") {
    return (
      <KonvaConnectorShapeNode
        ref={ref as Ref<Konva.Group>}
        shape={shape}
        readOnly={readOnly}
        onSelect={(modifiers) => onSelect(shape.id, shape.type, modifiers)}
        onAddBendPoint={onAddConnectorBendPoint}
        onRemoveBendPoint={onRemoveConnectorBendPoint}
        onGestureStart={() => onGestureStart(shape.id)}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  return (
    <Text
      ref={ref as Ref<Konva.Text>}
      x={shape.x}
      y={shape.y}
      text={shape.text}
      fontSize={shape.fontSize ?? 20}
      fill={shape.fill ?? COURSE_KONVA_TEXT_COLOR}
      opacity={shape.opacity ?? 1}
      rotation={shape.rotation}
      draggable={!readOnly}
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={() => onEditText?.(shape.id)}
      onDblTap={() => onEditText?.(shape.id)}
      onDragStart={() => onGestureStart(shape.id)}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformStart={() => {
        onGestureStart(shape.id);
        onTransformStart(shape.id);
      }}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
    />
  );
});

type DragSession = {
  primaryShapeId: string;
  shapeIds: string[];
  startShapes: Record<string, KonvaShapeV1>;
  startBounds: ReturnType<typeof getKonvaShapeDragStartBounds>;
};

function dragOffsetFromNode(shape: KonvaShapeV1, node: Konva.Node): { dx: number; dy: number } {
  if (shapeUsesDragOffset(shape)) {
    return { dx: node.x(), dy: node.y() };
  }
  const anchor = getShapeNodePosition(shape);
  return { dx: node.x() - anchor.x, dy: node.y() - anchor.y };
}

function translateStoredKonvaShape(shape: KonvaShapeV1, dx: number, dy: number): KonvaShapeV1 {
  return translateKonvaShapeLocal(shape, dx, dy);
}

export function CourseKonvaEditor({
  diagramId,
  readOnly = false,
  livePreview = false,
  liveSnapshot = null,
  onSelectedShapeChange,
  diagramDirty = false,
  diagramSaving = false,
  onDiscardDiagram,
  onSaveDiagram,
}: {
  diagramId: string;
  readOnly?: boolean;
  livePreview?: boolean;
  liveSnapshot?: DiagramLiveSnapshot | null;
  onSelectedShapeChange?: (selection: {
    shapeId: string | null;
    shapeIds?: string[];
    shapeType?: string;
  }) => void;
  diagramDirty?: boolean;
  diagramSaving?: boolean;
  onDiscardDiagram?: () => void;
  onSaveDiagram?: () => void;
}) {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  const initDiagram = useCourseDiagramEditorStore((s) => s.initDiagram);
  const storedSourcePath = useCourseDiagramEditorStore((s) => s.sourcePaths[diagramId]);
  const updateKonvaFreeform = useCourseDiagramEditorStore((s) => s.updateKonvaFreeform);
  const pushDiagramUndoSnapshot = useCourseDiagramEditorStore((s) => s.pushDiagramUndoSnapshot);
  const undoDiagram = useCourseDiagramEditorStore((s) => s.undoDiagram);
  const redoDiagram = useCourseDiagramEditorStore((s) => s.redoDiagram);
  const canUndo = useCourseDiagramEditorStore((s) => s.canUndoDiagram(diagramId));
  const canRedo = useCourseDiagramEditorStore((s) => s.canRedoDiagram(diagramId));

  const konvaSelectionRequestNonce = useCourseDiagramWorkbenchUiStore(
    (s) => s.konvaSelectionRequestNonce,
  );
  const requestedKonvaShapeIds = useCourseDiagramWorkbenchUiStore((s) => s.selectedKonvaShapeIds);

  const diagram = draft ?? loadCourseDiagram(diagramId);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const dragSessionRef = useRef<DragSession | null>(null);
  const gestureSnapshotTakenRef = useRef(false);
  const batchTransformRef = useRef(false);
  const textEditCommittedRef = useRef(false);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);
  const marqueeAdditiveRef = useRef(false);
  const [panToolActive, setPanToolActive] = useState(false);
  const [placementTool, setPlacementTool] = useState<PlacementTool>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [alignGuides, setAlignGuides] = useState<DiagramAlignmentGuide[]>([]);
  const [gestureShapePreviews, setGestureShapePreviews] = useState<GestureShapePreviewMap>({});
  const [transformingShapeIds, setTransformingShapeIds] = useState<Set<string>>(() => new Set());
  const [groupEditId, setGroupEditId] = useState<string | null>(null);
  const [drawingStart, setDrawingStart] = useState<DrawConnectorPoint | null>(null);
  const [drawingCurrent, setDrawingCurrent] = useState<DrawConnectorPoint | null>(null);
  const [textEdit, setTextEdit] = useState<{
    shapeId: string;
    value: string;
    left: number;
    top: number;
    width: number;
    fontSize: number;
  } | null>(null);
  const mountedDiagramIdRef = useRef(diagramId);
  const hasInitialViewportFitRef = useRef(false);

  const view = normalizeKonvaCanvasView(diagram?.freeform?.view);
  const storedShapes = diagram?.freeform?.shapes ?? [];

  const hasLiveBindings =
    diagram?.freeform != null && konvaPropertyBindingsHasContent(diagram.freeform.propertyBindings);

  const applyLiveResolution = readOnly || (livePreview && hasLiveBindings);

  const layoutShapes = useMemo(() => {
    if (diagram?.freeform == null) {
      return [];
    }
    if (liveSnapshot != null && hasLiveBindings && readOnly) {
      return evaluateKonvaShapes(diagram.freeform, liveSnapshot);
    }
    return storedShapes;
  }, [diagram, hasLiveBindings, liveSnapshot, readOnly, storedShapes]);

  const connectorResolvedShapes = useMemo(() => {
    return resolveKonvaConnectors(applyKonvaGestureShapePreviews(layoutShapes, gestureShapePreviews));
  }, [gestureShapePreviews, layoutShapes]);

  const shapeForRender = useCallback(
    (shape: KonvaShapeV1): KonvaShapeV1 => {
      if (isKonvaConnectorShape(shape)) {
        return connectorResolvedShapes.find((entry) => entry.id === shape.id) ?? shape;
      }
      let resolved = shape;
      if (transformingShapeIds.has(shape.id)) {
        resolved = findKonvaShapeById(layoutShapes, shape.id) ?? shape;
      } else if (gestureShapePreviews[shape.id] != null) {
        resolved = gestureShapePreviews[shape.id]!;
      }
      if (isKonvaGroupShape(resolved) && Object.keys(gestureShapePreviews).length > 0) {
        return applyGesturePreviewsInTree(resolved, gestureShapePreviews);
      }
      return resolved;
    },
    [connectorResolvedShapes, gestureShapePreviews, layoutShapes, transformingShapeIds],
  );

  const displayShapes = connectorResolvedShapes;

  const primarySelectedShapeId = primaryKonvaShapeSelection(selectedShapeIds);

  const selectedShape = useMemo(
    () =>
      primarySelectedShapeId != null
        ? findKonvaShapeById(storedShapes, primarySelectedShapeId)
        : null,
    [primarySelectedShapeId, storedShapes],
  );

  const transformableSelectedIds = useMemo(
    () =>
      selectedShapeIds.filter((id) => {
        const shape = findKonvaShapeById(storedShapes, id);
        return shape != null && !isKonvaConnectorShape(shape);
      }),
    [selectedShapeIds, storedShapes],
  );

  const canGroupSelection = canGroupKonvaShapes(storedShapes, selectedShapeIds);
  const canUngroupSelection = canUngroupKonvaShape(storedShapes, selectedShapeIds);

  const selectedGroupChildCount =
    selectedShape?.type === "group" ? selectedShape.children.length : 0;

  const selectedConnector = useMemo(() => {
    if (selectedShapeIds.length !== 1) {
      return null;
    }
    const shape = displayShapes.find((entry) => entry.id === selectedShapeIds[0]);
    if (shape?.type === "line" || shape?.type === "arrow") {
      return shape;
    }
    return null;
  }, [displayShapes, selectedShapeIds]);

  const selectedZOrderIndex =
    primarySelectedShapeId != null
      ? konvaShapeZOrderIndex(storedShapes, primarySelectedShapeId)
      : -1;

  const transformerEnabled = transformableSelectedIds.length > 0;

  const fitViewport = useCallback(() => {
    setViewport(computeFitViewport(containerSize.width, containerSize.height, view.width, view.height));
  }, [containerSize.height, containerSize.width, view.height, view.width]);

  const embedViewport = useMemo(
    () => computeFitViewport(containerSize.width, containerSize.height, view.width, view.height),
    [containerSize.height, containerSize.width, view.height, view.width],
  );

  const persistShapes = useCallback(
    (shapes: KonvaShapeV1[], options?: { recordUndo?: boolean }) => {
      if (readOnly || mountedDiagramIdRef.current !== diagramId) {
        return;
      }
      updateKonvaFreeform(
        diagramId,
        { shapes, view },
        { recordUndo: options?.recordUndo ?? false },
      );
    },
    [diagramId, readOnly, updateKonvaFreeform, view],
  );

  const setCanvasBackground = useCallback(
    (background: string) => {
      if (readOnly || mountedDiagramIdRef.current !== diagramId) {
        return;
      }
      updateKonvaFreeform(
        diagramId,
        { shapes: storedShapes, view: { ...view, background } },
        { recordUndo: true },
      );
    },
    [diagramId, readOnly, storedShapes, updateKonvaFreeform, view],
  );

  const applySelection = useCallback(
    (shapeIds: string[]) => {
      setSelectedShapeIds(shapeIds);
      const primary = primaryKonvaShapeSelection(shapeIds);
      const primaryShape =
        primary != null ? findKonvaShapeById(storedShapes, primary) : undefined;
      onSelectedShapeChange?.({
        shapeId: primary,
        shapeIds,
        shapeType: primaryShape?.type,
      });
    },
    [onSelectedShapeChange, storedShapes],
  );

  const selectShape = useCallback(
    (shapeId: string | null, shapeType?: string) => {
      if (shapeId == null) {
        applySelection([]);
        return;
      }
      applySelection([shapeId]);
      if (shapeType != null) {
        onSelectedShapeChange?.({ shapeId, shapeType });
      }
    },
    [applySelection, onSelectedShapeChange],
  );

  const enterGroupEdit = useCallback(
    (groupId: string) => {
      setGroupEditId(groupId);
      applySelection([groupId]);
    },
    [applySelection],
  );

  const exitGroupEdit = useCallback(() => {
    if (groupEditId == null) {
      return;
    }
    applySelection([groupEditId]);
    setGroupEditId(null);
  }, [applySelection, groupEditId]);

  const handleShapeSelect = useCallback(
    (shapeId: string, shapeType: KonvaShapeV1["type"], modifiers?: { shiftKey?: boolean }) => {
      if (groupEditId != null) {
        const parentId = findKonvaShapeParentId(storedShapes, shapeId);
        if (parentId === groupEditId || shapeId === groupEditId) {
          if (modifiers?.shiftKey) {
            applySelection(toggleKonvaShapeSelection(selectedShapeIds, shapeId));
            return;
          }
          selectShape(shapeId, shapeType);
          return;
        }
        setGroupEditId(null);
      }

      if (modifiers?.shiftKey) {
        applySelection(toggleKonvaShapeSelection(selectedShapeIds, shapeId));
        return;
      }
      selectShape(shapeId, shapeType);
    },
    [applySelection, groupEditId, selectShape, selectedShapeIds, storedShapes],
  );

  const registerShapeRef = useCallback((shapeId: string, node: Konva.Node | null) => {
    if (node != null) {
      shapeRefs.current.set(shapeId, node);
      return;
    }
    shapeRefs.current.delete(shapeId);
  }, []);

  const commitMarqueeSelection = useCallback(
    (marqueeState: { start: { x: number; y: number }; current: { x: number; y: number } }) => {
      const box = normalizeKonvaSelectionBox(marqueeState.start, marqueeState.current);
      if (konvaSelectionBoxIsDrag(box)) {
        const hits = konvaShapeIdsInSelectionBox(storedShapes, box);
        applySelection(
          mergeKonvaShapeSelection(selectedShapeIds, hits, marqueeAdditiveRef.current),
        );
      } else {
        applySelection([]);
      }
      setMarquee(null);
    },
    [applySelection, selectedShapeIds, storedShapes],
  );

  const resolveDragShapeIds = useCallback(
    (shapeId: string): string[] => {
      if (groupEditId != null) {
        return [shapeId];
      }
      if (
        selectedShapeIds.includes(shapeId) &&
        selectedShapeIds.length > 1 &&
        selectedShapeIds.every((id) => isKonvaTopLevelShapeId(storedShapes, id))
      ) {
        return selectedShapeIds.filter((id) => isKonvaTopLevelShapeId(storedShapes, id));
      }
      return [shapeId];
    },
    [groupEditId, selectedShapeIds, storedShapes],
  );

  const beginShapeGesture = useCallback(
    (shapeId: string) => {
      if (gestureSnapshotTakenRef.current) {
        return;
      }
      gestureSnapshotTakenRef.current = true;
      pushDiagramUndoSnapshot(diagramId);
      const dragShapeIds = resolveDragShapeIds(shapeId);
      const startShapes: Record<string, KonvaShapeV1> = {};
      for (const id of dragShapeIds) {
        const shape = findKonvaShapeById(storedShapes, id);
        if (shape != null) {
          startShapes[id] = shape;
        }
      }
      const primaryShape = startShapes[shapeId];
      if (primaryShape != null) {
        dragSessionRef.current = {
          primaryShapeId: shapeId,
          shapeIds: dragShapeIds.filter((id) => startShapes[id] != null),
          startShapes,
          startBounds: getKonvaShapeDragStartBounds(primaryShape),
        };
      }
    },
    [diagramId, pushDiagramUndoSnapshot, resolveDragShapeIds, storedShapes],
  );

  const handleShapeDragMove = useCallback(
    (_shapeId: string, node: Konva.Node) => {
      const session = dragSessionRef.current;
      if (session == null) {
        return;
      }
      const primaryStart = session.startShapes[session.primaryShapeId];
      if (primaryStart == null) {
        return;
      }
      const targets = collectKonvaAlignTargets(storedShapes, session.primaryShapeId, view);
      const anchor = getShapeNodePosition(primaryStart);
      const snapEnabled = !altHeld;

      if (shapeUsesDragOffset(primaryStart)) {
        const snapped = snapKonvaShapeDragOffset({
          shape: primaryStart,
          startBounds: session.startBounds,
          offsetX: node.x(),
          offsetY: node.y(),
          targets,
          snapEnabled,
        });
        node.position({ x: snapped.offsetX, y: snapped.offsetY });
        setAlignGuides(snapped.guides);
        const { dx, dy } = dragOffsetFromNode(primaryStart, node);
        setGestureShapePreviews((current) => {
          let next = current;
          for (const id of session.shapeIds) {
            const start = session.startShapes[id];
            if (start == null) {
              continue;
            }
            next = patchGestureShapePreview(
              next,
              translateStoredKonvaShape(start, dx, dy),
            );
          }
          return next;
        });
        return;
      }

      const snapped = snapKonvaShapeDragOffset({
        shape: primaryStart,
        startBounds: session.startBounds,
        offsetX: node.x() - anchor.x,
        offsetY: node.y() - anchor.y,
        targets,
        snapEnabled,
      });
      node.position({ x: anchor.x + snapped.offsetX, y: anchor.y + snapped.offsetY });
      setAlignGuides(snapped.guides);
      const dx = snapped.offsetX;
      const dy = snapped.offsetY;
      setGestureShapePreviews((current) => {
        let next = current;
        for (const id of session.shapeIds) {
          const start = session.startShapes[id];
          if (start == null) {
            continue;
          }
          next = patchGestureShapePreview(next, translateStoredKonvaShape(start, dx, dy));
        }
        return next;
      });
    },
    [altHeld, storedShapes, view],
  );

  const handleShapeDragEnd = useCallback(
    (_shapeId: string, node: Konva.Node) => {
      const session = dragSessionRef.current;
      gestureSnapshotTakenRef.current = false;
      setAlignGuides([]);
      dragSessionRef.current = null;

      const primaryStart =
        session?.startShapes[session.primaryShapeId] ??
        findKonvaShapeById(storedShapes, _shapeId);
      if (primaryStart == null) {
        setGestureShapePreviews({});
        return;
      }

      const { dx, dy } = dragOffsetFromNode(primaryStart, node);
      if (shapeUsesDragOffset(primaryStart)) {
        node.position({ x: 0, y: 0 });
      }

      const dragShapeIds = session?.shapeIds ?? [_shapeId];
      let nextShapes = storedShapes;
      const movedIds: string[] = [];
      for (const id of dragShapeIds) {
        const start =
          session?.startShapes[id] ?? (id === _shapeId ? primaryStart : findKonvaShapeById(storedShapes, id));
        if (start == null) {
          continue;
        }
        const updated = translateStoredKonvaShape(start, dx, dy);
        nextShapes = replaceKonvaShapeById(nextShapes, id, updated);
        movedIds.push(...movedShapeIdsForConnectorSync(updated, id));
        setGestureShapePreviews((current) => clearGestureShapePreview(current, id));
      }

      persistShapes(syncKonvaConnectorsForMovedShapes(nextShapes, [...new Set(movedIds)]));
    },
    [persistShapes, storedShapes],
  );

  const handleShapeTransformStart = useCallback(
    (shapeId: string) => {
      if (transformableSelectedIds.length > 1) {
        return;
      }
      setTransformingShapeIds((current) => new Set(current).add(shapeId));
    },
    [transformableSelectedIds.length],
  );

  const handleShapeTransform = useCallback(
    (shapeId: string, node: Konva.Node) => {
      if (transformableSelectedIds.length > 1) {
        return;
      }
      const shape = findKonvaShapeById(storedShapes, shapeId);
      if (shape == null) {
        return;
      }
      setGestureShapePreviews((current) =>
        patchGestureShapePreview(current, shapeFromKonvaNode(shape, node)),
      );
    },
    [storedShapes, transformableSelectedIds.length],
  );

  const handleShapeTransformEnd = useCallback(
    (shapeId: string) => {
      if (transformableSelectedIds.length > 1) {
        return;
      }
      setTransformingShapeIds((current) => {
        const next = new Set(current);
        next.delete(shapeId);
        return next;
      });
      setGestureShapePreviews((current) => clearGestureShapePreview(current, shapeId));

      const node = shapeRefs.current.get(shapeId);
      const shape = findKonvaShapeById(storedShapes, shapeId);
      if (node == null || shape == null) {
        return;
      }

      gestureSnapshotTakenRef.current = false;
      const baked = shapeFromKonvaNode(shape, node);
      const targets = collectKonvaAlignTargets(storedShapes, shapeId, view);
      const updated = snapKonvaShapeGeometry(baked, targets, !altHeld);
      resetKonvaNodeTransform(node);
      persistShapes(
        syncKonvaConnectorsForMovedShapes(
          replaceKonvaShapeById(storedShapes, shapeId, updated),
          movedShapeIdsForConnectorSync(updated, shapeId),
        ),
      );
      setAlignGuides([]);
    },
    [altHeld, persistShapes, storedShapes, transformableSelectedIds.length, view],
  );

  const groupEditBounds = useMemo(() => {
    if (groupEditId == null) {
      return null;
    }
    const shape = findKonvaShapeById(storedShapes, groupEditId);
    if (shape == null) {
      return null;
    }
    return getKonvaShapeWorldBounds(shape);
  }, [groupEditId, storedShapes]);

  const groupEditBreadcrumb = useMemo(() => {
    if (groupEditId == null) {
      return [] as string[];
    }
    return findKonvaShapeAncestorPath(storedShapes, groupEditId) ?? [groupEditId];
  }, [groupEditId, storedShapes]);

  const commitCornerRadius = useCallback(
    (next: Extract<KonvaShapeV1, { type: "rect" }>) => {
      gestureSnapshotTakenRef.current = false;
      persistShapes(
        storedShapes.map((entry) => (entry.id === next.id ? next : entry)),
        { recordUndo: false },
      );
    },
    [persistShapes, storedShapes],
  );

  const addShape = useCallback(
    (type: KonvaShapeV1["type"]) => {
      setPlacementTool(null);
      const id = nextKonvaShapeId();
      const cx = view.width / 2 - 60;
      const cy = view.height / 2 - 40;
      let shape: KonvaShapeV1;
      if (type === "rect") {
        shape = {
          id,
          type: "rect",
          x: cx,
          y: cy,
          width: 120,
          height: 80,
          stroke: COURSE_KONVA_STROKE_COLOR,
          fill: "transparent",
        };
      } else if (type === "diamond") {
        shape = {
          id,
          type: "diamond",
          x: cx,
          y: cy,
          width: 120,
          height: 120,
          stroke: COURSE_KONVA_STROKE_COLOR,
          fill: "transparent",
        };
      } else if (type === "circle") {
        shape = {
          id,
          type: "circle",
          x: view.width / 2,
          y: view.height / 2,
          radius: 48,
          stroke: COURSE_KONVA_STROKE_COLOR,
          fill: "transparent",
        };
      } else if (type === "line") {
        shape = {
          id,
          type: "line",
          x1: cx,
          y1: cy + 40,
          x2: cx + 140,
          y2: cy + 40,
          stroke: COURSE_KONVA_STROKE_COLOR,
        };
      } else if (type === "arrow") {
        shape = {
          id,
          type: "arrow",
          x1: cx,
          y1: cy + 80,
          x2: cx + 140,
          y2: cy + 80,
          stroke: COURSE_KONVA_STROKE_COLOR,
        };
      } else {
        shape = {
          id,
          type: "text",
          x: cx,
          y: cy + 100,
          text: "Label",
          fontSize: 20,
          fill: COURSE_KONVA_TEXT_COLOR,
        };
      }
      persistShapes([...storedShapes, shape], { recordUndo: true });
      selectShape(id, type);
    },
    [persistShapes, selectShape, storedShapes, view.height, view.width],
  );

  const commitPlacementShape = useCallback(
    (start: DrawConnectorPoint, end: DrawConnectorPoint) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      if (Math.hypot(dx, dy) < MIN_LINE_LENGTH || placementTool == null) {
        setAlignGuides([]);
        return;
      }
      const id = nextKonvaShapeId();
      const base = {
        id,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        stroke: COURSE_KONVA_STROKE_COLOR,
        ...(start.attach != null ? { startAttach: start.attach } : {}),
        ...(end.attach != null ? { endAttach: end.attach } : {}),
      };
      const shape: KonvaShapeV1 =
        placementTool === "arrow"
          ? { ...base, type: "arrow" as const }
          : { ...base, type: "line" as const };
      persistShapes([...storedShapes, shape], { recordUndo: true });
      selectShape(id, shape.type);
      setPlacementTool(null);
      setAlignGuides([]);
    },
    [persistShapes, placementTool, selectShape, storedShapes],
  );

  const reorderSelectedShape = useCallback(
    (direction: KonvaShapeZOrderDirection) => {
      if (primarySelectedShapeId == null) {
        return;
      }
      const next = reorderKonvaShapes(storedShapes, primarySelectedShapeId, direction);
      if (next === storedShapes) {
        return;
      }
      persistShapes(next, { recordUndo: true });
    },
    [persistShapes, primarySelectedShapeId, storedShapes],
  );

  const commitConnectorPatch = useCallback(
    (shapeId: string, next: Extract<KonvaShapeV1, { type: "line" | "arrow" }>) => {
      gestureSnapshotTakenRef.current = false;
      persistShapes(storedShapes.map((shape) => (shape.id === shapeId ? next : shape)));
    },
    [persistShapes, storedShapes],
  );

  const commitConnectorChange = useCallback(
    (
      shapeId: string,
      next: Extract<KonvaShapeV1, { type: "line" | "arrow" }>,
      options?: { recordUndo?: boolean },
    ) => {
      if (options?.recordUndo) {
        pushDiagramUndoSnapshot(diagramId);
      }
      commitConnectorPatch(shapeId, next);
    },
    [commitConnectorPatch, diagramId, pushDiagramUndoSnapshot],
  );

  const handleRemoveConnectorBendPoint = useCallback(
    (shapeId: string, point: { x: number; y: number }) => {
      if (readOnly || placementTool != null) {
        return;
      }
      const shape = storedShapes.find((entry) => entry.id === shapeId);
      if (shape?.type !== "line" && shape?.type !== "arrow") {
        return;
      }
      const next = removeKonvaConnectorBendPointNear(shape, point);
      if (next == null) {
        return;
      }
      pushDiagramUndoSnapshot(diagramId);
      persistShapes(
        storedShapes.map((entry) => (entry.id === shapeId ? next : entry)),
        { recordUndo: false },
      );
      selectShape(shapeId, shape.type);
    },
    [
      diagramId,
      persistShapes,
      placementTool,
      pushDiagramUndoSnapshot,
      readOnly,
      selectShape,
      storedShapes,
    ],
  );

  const handleAddConnectorBendPoint = useCallback(
    (shapeId: string, point: { x: number; y: number }) => {
      if (readOnly || placementTool != null) {
        return;
      }
      const shape = storedShapes.find((entry) => entry.id === shapeId);
      if (shape?.type !== "line" && shape?.type !== "arrow") {
        return;
      }
      const snapped = snapDrawConnectorPoint({
        x: point.x,
        y: point.y,
        shapes: storedShapes,
        view,
        snapEnabled: !altHeld,
      });
      const next = insertKonvaConnectorBendPoint(shape, {
        x: snapped.x,
        y: snapped.y,
      });
      if (next == null) {
        return;
      }
      pushDiagramUndoSnapshot(diagramId);
      persistShapes(
        storedShapes.map((entry) => (entry.id === shapeId ? next : entry)),
        { recordUndo: false },
      );
      selectShape(shapeId, shape.type);
    },
    [
      altHeld,
      diagramId,
      persistShapes,
      placementTool,
      pushDiagramUndoSnapshot,
      readOnly,
      selectShape,
      storedShapes,
      view,
    ],
  );

  const groupSelectedShapes = useCallback(() => {
    const groupableIds = listKonvaGroupableShapeIds(storedShapes, selectedShapeIds);
    if (groupableIds.length < 2) {
      return;
    }
    pushDiagramUndoSnapshot(diagramId);
    const next = groupKonvaShapes(storedShapes, groupableIds);
    if (next == null) {
      return;
    }
    persistShapes(next, { recordUndo: false });
    const grouped = next.find(
      (shape) => isKonvaGroupShape(shape) && !storedShapes.some((entry) => entry.id === shape.id),
    );
    if (grouped != null) {
      applySelection([grouped.id]);
    }
  }, [
    applySelection,
    diagramId,
    persistShapes,
    pushDiagramUndoSnapshot,
    selectedShapeIds,
    storedShapes,
  ]);

  const ungroupSelectedShape = useCallback(() => {
    if (!canUngroupSelection || selectedShapeIds.length !== 1) {
      return;
    }
    const groupId = selectedShapeIds[0];
    if (groupId == null) {
      return;
    }
    pushDiagramUndoSnapshot(diagramId);
    const next = ungroupKonvaShape(storedShapes, groupId);
    if (next == null) {
      return;
    }
    const before = storedShapes.find((entry) => entry.id === groupId);
    const restoredIds =
      before != null && isKonvaGroupShape(before) ? before.children.map((child) => child.id) : [];
    persistShapes(
      syncKonvaConnectorsForMovedShapes(next, restoredIds),
      { recordUndo: false },
    );
    applySelection(restoredIds);
  }, [
    applySelection,
    canUngroupSelection,
    diagramId,
    persistShapes,
    pushDiagramUndoSnapshot,
    selectedShapeIds,
    storedShapes,
  ]);

  const duplicateSelectedShape = useCallback(() => {
    if (selectedShapeIds.length === 0) {
      return;
    }
    const copies = selectedShapeIds
      .map((id) => storedShapes.find((shape) => shape.id === id))
      .filter((shape): shape is KonvaShapeV1 => shape != null)
      .map((shape) => duplicateKonvaShape(shape));
    if (copies.length === 0) {
      return;
    }
    persistShapes([...storedShapes, ...copies], { recordUndo: true });
    applySelection(copies.map((copy) => copy.id));
  }, [applySelection, persistShapes, selectedShapeIds, storedShapes]);

  const removeSelectedShape = useCallback(() => {
    if (selectedShapeIds.length === 0) {
      return;
    }
    let nextShapes = storedShapes;
    for (const id of selectedShapeIds) {
      nextShapes = removeKonvaShapeById(nextShapes, id);
    }
    if (selectedShapeIds.includes(groupEditId ?? "")) {
      setGroupEditId(null);
    }
    persistShapes(nextShapes, { recordUndo: true });
    applySelection([]);
  }, [applySelection, groupEditId, persistShapes, selectedShapeIds, storedShapes]);

  const openTextEdit = useCallback((shapeId: string) => {
    if (readOnly) {
      return;
    }
    const node = shapeRefs.current.get(shapeId) as Konva.Text | undefined;
    const shape = storedShapes.find((entry) => entry.id === shapeId);
    const container = containerRef.current;
    if (node == null || shape?.type !== "text" || container == null) {
      return;
    }
    const rect = node.getClientRect();
    const containerRect = container.getBoundingClientRect();
    textEditCommittedRef.current = false;
    setTextEdit({
      shapeId,
      value: shape.text,
      left: rect.x - containerRect.left,
      top: rect.y - containerRect.top,
      width: Math.max(rect.width, 120),
      fontSize: shape.fontSize ?? 20,
    });
    selectShape(shapeId, "text");
  }, [readOnly, selectShape, storedShapes]);

  const commitTextEdit = useCallback(() => {
    if (textEdit == null || textEditCommittedRef.current) {
      return;
    }
    textEditCommittedRef.current = true;
    const trimmed = textEdit.value.trim();
    if (trimmed.length === 0) {
      setTextEdit(null);
      return;
    }
    const next = storedShapes.map((shape) =>
      shape.id === textEdit.shapeId && shape.type === "text"
        ? { ...shape, text: trimmed }
        : shape,
    );
    persistShapes(next, { recordUndo: true });
    setTextEdit(null);
  }, [persistShapes, storedShapes, textEdit]);

  const cancelTextEdit = useCallback(() => {
    textEditCommittedRef.current = true;
    setTextEdit(null);
  }, []);

  const zoomAroundCenter = useCallback(
    (factor: number) => {
      const current = readOnly ? embedViewport : viewport;
      const nextScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current.scale * factor));
      const centerX = containerSize.width / 2;
      const centerY = containerSize.height / 2;
      const mousePointTo = {
        x: (centerX - current.x) / current.scale,
        y: (centerY - current.y) / current.scale,
      };
      setViewport({
        scale: nextScale,
        x: centerX - mousePointTo.x * nextScale,
        y: centerY - mousePointTo.y * nextScale,
      });
    },
    [containerSize.height, containerSize.width, embedViewport, readOnly, viewport],
  );

  const handleWheel = useCallback(
    (event: Konva.KonvaEventObject<WheelEvent>) => {
      if (readOnly) {
        return;
      }
      event.evt.preventDefault();
      const stage = stageRef.current;
      if (stage == null) {
        return;
      }
      const pointer = stage.getPointerPosition();
      if (pointer == null) {
        return;
      }
      const factor = event.evt.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const nextScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, viewport.scale * factor));
      const mousePointTo = {
        x: (pointer.x - viewport.x) / viewport.scale,
        y: (pointer.y - viewport.y) / viewport.scale,
      };
      setViewport({
        scale: nextScale,
        x: pointer.x - mousePointTo.x * nextScale,
        y: pointer.y - mousePointTo.y * nextScale,
      });
    },
    [readOnly, viewport.scale, viewport.x, viewport.y],
  );

  useEffect(() => {
    if (readOnly || draft != null) {
      return;
    }
    const loaded = loadCourseDiagram(diagramId);
    if (loaded == null) {
      return;
    }
    const sourcePath =
      storedSourcePath ??
      getCourseDiagramSourcePath(diagramId) ??
      courseDiagramSourcePathForId(diagramId);
    initDiagram(loaded, sourcePath);
  }, [diagramId, draft, initDiagram, readOnly, storedSourcePath]);

  useEffect(() => {
    mountedDiagramIdRef.current = diagramId;
    hasInitialViewportFitRef.current = false;
    setSelectedShapeIds([]);
    setMarquee(null);
    setGroupEditId(null);
    onSelectedShapeChange?.({ shapeId: null });
  }, [diagramId, onSelectedShapeChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (el == null) {
      return;
    }
    const update = () => {
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (readOnly || containerSize.width <= 0 || containerSize.height <= 0) {
      return;
    }
    if (!hasInitialViewportFitRef.current) {
      setViewport(
        computeFitViewport(containerSize.width, containerSize.height, view.width, view.height),
      );
      hasInitialViewportFitRef.current = true;
    }
  }, [containerSize.height, containerSize.width, readOnly, view.height, view.width]);

  useEffect(() => {
    if (readOnly || marquee == null) {
      return;
    }
    const onWindowMouseUp = () => {
      commitMarqueeSelection(marquee);
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, [commitMarqueeSelection, marquee, readOnly]);

  useEffect(() => {
    if (readOnly) {
      return;
    }
    const transformer = transformerRef.current;
    if (transformer == null) {
      return;
    }
    const nodes = transformerEnabled
      ? transformableSelectedIds
          .map((shapeId) => shapeRefs.current.get(shapeId) ?? null)
          .filter((node): node is Konva.Node => node != null)
      : [];
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [layoutShapes, readOnly, transformableSelectedIds, transformerEnabled]);

  useEffect(() => {
    if (readOnly || konvaSelectionRequestNonce === 0) {
      return;
    }
    setSelectedShapeIds(requestedKonvaShapeIds);
    if (groupEditId != null && !requestedKonvaShapeIds.includes(groupEditId)) {
      setGroupEditId(null);
    }
  }, [groupEditId, konvaSelectionRequestNonce, readOnly, requestedKonvaShapeIds]);

  useEffect(() => {
    if (readOnly) {
      return;
    }
    const transformer = transformerRef.current;
    if (transformer == null) {
      return;
    }

    const handleBatchTransformStart = () => {
      if (transformableSelectedIds.length < 2) {
        return;
      }
      batchTransformRef.current = true;
      const primaryId = transformableSelectedIds[0];
      if (primaryId != null) {
        beginShapeGesture(primaryId);
      }
      setTransformingShapeIds(new Set(transformableSelectedIds));
    };

    const handleBatchTransform = () => {
      if (transformableSelectedIds.length < 2) {
        return;
      }
      batchTransformRef.current = true;
      let previews: GestureShapePreviewMap = {};
      for (const shapeId of transformableSelectedIds) {
        const node = shapeRefs.current.get(shapeId);
        const shape = findKonvaShapeById(storedShapes, shapeId);
        if (node == null || shape == null) {
          continue;
        }
        previews = patchGestureShapePreview(previews, shapeFromKonvaNode(shape, node));
      }
      setGestureShapePreviews((current) => ({ ...current, ...previews }));
    };

    const handleBatchTransformEnd = () => {
      if (transformableSelectedIds.length < 2 || !batchTransformRef.current) {
        return;
      }
      batchTransformRef.current = false;
      let nextShapes = storedShapes;
      const movedIds: string[] = [];
      for (const shapeId of transformableSelectedIds) {
        const node = shapeRefs.current.get(shapeId);
        const shape = findKonvaShapeById(storedShapes, shapeId);
        if (node == null || shape == null) {
          continue;
        }
        const baked = shapeFromKonvaNode(shape, node);
        const targets = collectKonvaAlignTargets(storedShapes, shapeId, view);
        const updated = snapKonvaShapeGeometry(baked, targets, !altHeld);
        resetKonvaNodeTransform(node);
        nextShapes = replaceKonvaShapeById(nextShapes, shapeId, updated);
        movedIds.push(...movedShapeIdsForConnectorSync(updated, shapeId));
      }
      gestureSnapshotTakenRef.current = false;
      persistShapes(
        syncKonvaConnectorsForMovedShapes(nextShapes, [...new Set(movedIds)]),
      );
      setGestureShapePreviews((current) => {
        const next = { ...current };
        for (const shapeId of transformableSelectedIds) {
          delete next[shapeId];
        }
        return next;
      });
      setTransformingShapeIds(new Set());
      setAlignGuides([]);
    };

    transformer.on("transformstart", handleBatchTransformStart);
    transformer.on("transform", handleBatchTransform);
    transformer.on("transformend", handleBatchTransformEnd);
    return () => {
      transformer.off("transformstart", handleBatchTransformStart);
      transformer.off("transform", handleBatchTransform);
      transformer.off("transformend", handleBatchTransformEnd);
    };
  }, [
    altHeld,
    beginShapeGesture,
    persistShapes,
    readOnly,
    storedShapes,
    transformableSelectedIds,
    view,
  ]);

  useEffect(() => {
    if (readOnly) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setAltHeld(true);
      }
      if (event.code === "Space" && !event.repeat) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA") {
          event.preventDefault();
        }
        setSpaceHeld(true);
      }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "d") {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
          return;
        }
        event.preventDefault();
        duplicateSelectedShape();
        return;
      }
      if (event.key === "Escape") {
        if (marquee != null) {
          setMarquee(null);
          return;
        }
        if (placementTool != null) {
          setPlacementTool(null);
          setDrawingStart(null);
          setDrawingCurrent(null);
          setAlignGuides([]);
          return;
        }
        if (groupEditId != null) {
          exitGroupEdit();
          return;
        }
        applySelection([]);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
          return;
        }
        event.preventDefault();
        removeSelectedShape();
        return;
      }
      if (
        (event.key === "[" || event.key === "]") &&
        selectedShape?.type === "rect"
      ) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
          return;
        }
        event.preventDefault();
        const step = event.shiftKey ? 4 : 1;
        const delta = event.key === "[" ? -step : step;
        const next = nudgeKonvaRectCornerRadius(selectedShape, delta);
        persistShapes(
          storedShapes.map((entry) => (entry.id === next.id ? next : entry)),
          { recordUndo: true },
        );
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setAltHeld(false);
        setAlignGuides([]);
      }
      if (event.code === "Space") {
        setSpaceHeld(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    applySelection,
    duplicateSelectedShape,
    marquee,
    persistShapes,
    placementTool,
    readOnly,
    exitGroupEdit,
    groupEditId,
    removeSelectedShape,
    selectedShape,
    storedShapes,
  ]);

  useEffect(() => {
    if (readOnly) {
      registerKonvaEditorShortcutHandlers({});
      return;
    }
    registerKonvaEditorShortcutHandlers({
      group: groupSelectedShapes,
      ungroup: ungroupSelectedShape,
    });
    return () => registerKonvaEditorShortcutHandlers({});
  }, [groupSelectedShapes, readOnly, ungroupSelectedShape]);

  if (diagram == null) {
    return null;
  }

  const stageDraggable = !readOnly && (panToolActive || spaceHeld);
  const activeViewport = readOnly ? embedViewport : viewport;
  const marqueeBox = marquee != null ? normalizeKonvaSelectionBox(marquee.start, marquee.current) : null;
  const stageCursor =
    placementTool != null || marquee != null
      ? "crosshair"
      : stageDraggable
        ? "grab"
        : "default";
  const previewLine =
    drawingStart != null && drawingCurrent != null
      ? [drawingStart.x, drawingStart.y, drawingCurrent.x, drawingCurrent.y]
      : null;
  const statusLabel = applyLiveResolution
    ? "Live preview on"
    : placementTool != null
      ? `Drag ${placementTool} · cyan dots snap targets · Alt free · Esc cancel`
      : marquee != null
        ? "Release to select · Shift add · Esc cancel"
        : altHeld
          ? "Snap off (Alt)"
          : groupEditId != null
            ? `Editing group · Esc exit · ${Math.round(activeViewport.scale * 100)}%`
            : selectedShapeIds.length > 1
              ? `${selectedShapeIds.length} selected · drag moves all · ${Math.round(activeViewport.scale * 100)}%`
              : `${Math.round(activeViewport.scale * 100)}%`;

  return (
    <div
      className={`course-konva-editor flex h-full min-h-0 w-full flex-col${
        readOnly ? " course-konva-editor--embed-preview" : ""
      }`}
    >
      {!readOnly ? (
        <CourseKonvaEditorToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => undoDiagram(diagramId)}
          onRedo={() => redoDiagram(diagramId)}
          onAddShape={addShape}
          placementTool={placementTool}
          onPlacementToolChange={(tool) => {
            setPlacementTool(tool);
            setPanToolActive(false);
            setDrawingStart(null);
            setDrawingCurrent(null);
          }}
          selectedShapeId={primarySelectedShapeId}
          selectedZOrderIndex={selectedZOrderIndex}
          shapeCount={storedShapes.length}
          onDuplicate={duplicateSelectedShape}
          onDelete={removeSelectedShape}
          onGroup={groupSelectedShapes}
          onUngroup={ungroupSelectedShape}
          canGroup={canGroupSelection}
          canUngroup={canUngroupSelection}
          onReorder={reorderSelectedShape}
          panToolActive={panToolActive}
          onPanToolToggle={() => {
            setPanToolActive((value) => !value);
            setPlacementTool(null);
          }}
          onZoomIn={() => zoomAroundCenter(ZOOM_STEP)}
          onZoomOut={() => zoomAroundCenter(1 / ZOOM_STEP)}
          onFitView={fitViewport}
          canvasBackground={view.background}
          onCanvasBackgroundChange={readOnly ? undefined : setCanvasBackground}
          dirty={diagramDirty}
          saving={diagramSaving}
          onDiscard={onDiscardDiagram}
          onSave={onSaveDiagram}
          statusLabel={statusLabel}
          groupEditBreadcrumb={groupEditBreadcrumb}
          onExitGroupEdit={groupEditId != null ? exitGroupEdit : undefined}
        />
      ) : null}
      <div
        ref={containerRef}
        tabIndex={readOnly ? undefined : -1}
        className="relative min-h-0 flex-1 outline-none"
        style={{ cursor: stageCursor, backgroundColor: view.background }}
        onMouseDown={() => {
          if (!readOnly) {
            containerRef.current?.focus({ preventScroll: true });
          }
        }}
      >
        {!readOnly &&
        primarySelectedShapeId != null &&
        selectedShapeIds.length === 1 &&
        placementTool == null &&
        textEdit == null ? (
          <KonvaShapeFloatingPanel
            diagramId={diagramId}
            selectedShapeId={primarySelectedShapeId}
            selectedZOrderIndex={selectedZOrderIndex}
            shapeCount={storedShapes.length}
            onDuplicate={duplicateSelectedShape}
            onDelete={removeSelectedShape}
            onReorder={reorderSelectedShape}
            onUngroup={ungroupSelectedShape}
            canUngroup={canUngroupSelection}
            groupChildCount={selectedGroupChildCount}
          />
        ) : null}
        {textEdit != null ? (
          <KonvaTextEditOverlay
            left={textEdit.left}
            top={textEdit.top}
            width={textEdit.width}
            fontSize={textEdit.fontSize}
            value={textEdit.value}
            onChange={(value) => setTextEdit((current) => (current != null ? { ...current, value } : current))}
            onCommit={commitTextEdit}
            onCancel={cancelTextEdit}
          />
        ) : null}
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          scaleX={activeViewport.scale}
          scaleY={activeViewport.scale}
          x={activeViewport.x}
          y={activeViewport.y}
          draggable={stageDraggable}
          onWheel={handleWheel}
          onDragEnd={(event) => {
            if (!readOnly && stageDraggable) {
              setViewport((current) => ({
                ...current,
                x: event.target.x(),
                y: event.target.y(),
              }));
            }
          }}
          onMouseDown={(event) => {
            if (readOnly) {
              return;
            }
            if (event.evt.button === 1) {
              event.evt.preventDefault();
              stageRef.current?.startDrag();
              return;
            }
            const stage = stageRef.current;
            if (stage == null) {
              return;
            }
            if (placementTool != null && event.target === stage) {
              const pos = pointerToCanvas(stage);
              if (pos != null) {
                const snapped = snapDrawConnectorPoint({
                  x: pos.x,
                  y: pos.y,
                  shapes: storedShapes,
                  view,
                  snapEnabled: !altHeld,
                });
                setDrawingStart({
                  x: snapped.x,
                  y: snapped.y,
                  attach: snapped.attach,
                });
                setDrawingCurrent({
                  x: snapped.x,
                  y: snapped.y,
                  attach: snapped.attach,
                });
                setAlignGuides(snapped.guides);
              }
              return;
            }
            if (
              event.target === stage &&
              event.evt.button === 0 &&
              !stageDraggable &&
              placementTool == null
            ) {
              const pos = pointerToCanvas(stage);
              if (pos != null) {
                marqueeAdditiveRef.current = event.evt.shiftKey;
                setMarquee({ start: pos, current: pos });
              }
            }
          }}
          onMouseMove={() => {
            if (readOnly) {
              return;
            }
            const stage = stageRef.current;
            if (stage == null) {
              return;
            }
            const pos = pointerToCanvas(stage);
            if (pos == null) {
              return;
            }
            if (marquee != null) {
              setMarquee((current) =>
                current != null ? { ...current, current: pos } : current,
              );
              return;
            }
            if (drawingStart == null) {
              return;
            }
            const snapped = snapDrawConnectorPoint({
              x: pos.x,
              y: pos.y,
              shapes: storedShapes,
              view,
              snapEnabled: !altHeld,
            });
            setDrawingCurrent({
              x: snapped.x,
              y: snapped.y,
              attach: snapped.attach,
            });
            setAlignGuides(snapped.guides);
          }}
          onMouseUp={() => {
            if (readOnly || drawingStart == null || drawingCurrent == null) {
              return;
            }
            commitPlacementShape(drawingStart, drawingCurrent);
            setDrawingStart(null);
            setDrawingCurrent(null);
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={view.width}
              height={view.height}
              fill={view.background}
              listening={false}
            />
            {alignGuides.map((guide, index) =>
              guide.axis === "x" ? (
                <Line
                  key={`guide-x-${index}`}
                  points={[guide.position, 0, guide.position, view.height]}
                  stroke={COURSE_KONVA_STROKE_COLOR}
                  strokeWidth={1}
                  dash={[4, 4]}
                  opacity={0.85}
                  listening={false}
                />
              ) : (
                <Line
                  key={`guide-y-${index}`}
                  points={[0, guide.position, view.width, guide.position]}
                  stroke={COURSE_KONVA_STROKE_COLOR}
                  strokeWidth={1}
                  dash={[4, 4]}
                  opacity={0.85}
                  listening={false}
                />
              ),
            )}
            {previewLine != null ? (
              <Line
                points={previewLine}
                stroke={COURSE_KONVA_STROKE_COLOR}
                strokeWidth={2}
                opacity={0.7}
                listening={false}
              />
            ) : null}
            {drawingCurrent?.attach != null ? (
              <Circle
                x={drawingCurrent.x}
                y={drawingCurrent.y}
                radius={5}
                stroke={COURSE_KONVA_STROKE_COLOR}
                strokeWidth={2}
                fill="rgba(34, 211, 238, 0.35)"
                listening={false}
              />
            ) : null}
            {marqueeBox != null && konvaSelectionBoxIsDrag(marqueeBox) ? (
              <Rect
                x={marqueeBox.x}
                y={marqueeBox.y}
                width={marqueeBox.width}
                height={marqueeBox.height}
                fill="rgba(34, 211, 238, 0.16)"
                stroke={COURSE_KONVA_STROKE_COLOR}
                strokeWidth={1}
                dash={[4, 3]}
                listening={false}
              />
            ) : null}
            {groupEditBounds != null && !readOnly ? (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={view.width}
                  height={Math.max(0, groupEditBounds.y)}
                  fill="rgba(0,0,0,0.42)"
                  listening={false}
                />
                <Rect
                  x={0}
                  y={groupEditBounds.y + groupEditBounds.height}
                  width={view.width}
                  height={Math.max(0, view.height - groupEditBounds.y - groupEditBounds.height)}
                  fill="rgba(0,0,0,0.42)"
                  listening={false}
                />
                <Rect
                  x={0}
                  y={groupEditBounds.y}
                  width={Math.max(0, groupEditBounds.x)}
                  height={groupEditBounds.height}
                  fill="rgba(0,0,0,0.42)"
                  listening={false}
                />
                <Rect
                  x={groupEditBounds.x + groupEditBounds.width}
                  y={groupEditBounds.y}
                  width={Math.max(0, view.width - groupEditBounds.x - groupEditBounds.width)}
                  height={groupEditBounds.height}
                  fill="rgba(0,0,0,0.42)"
                  listening={false}
                />
                <Rect
                  x={groupEditBounds.x}
                  y={groupEditBounds.y}
                  width={groupEditBounds.width}
                  height={groupEditBounds.height}
                  stroke={COURSE_KONVA_STROKE_COLOR}
                  strokeWidth={1}
                  dash={[6, 4]}
                  listening={false}
                />
              </>
            ) : null}
            {layoutShapes.map((shape) => (
              <KonvaShapeNode
                key={shape.id}
                ref={(node) => registerShapeRef(shape.id, node)}
                shape={shapeForRender(shape)}
                readOnly={readOnly || placementTool != null}
                onSelect={(shapeId, shapeType, modifiers) => {
                  if (placementTool == null) {
                    handleShapeSelect(shapeId, shapeType, modifiers);
                  }
                }}
                onGestureStart={beginShapeGesture}
                groupEditId={groupEditId}
                onEnterGroupEdit={enterGroupEdit}
                onShapeRef={registerShapeRef}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                onTransformStart={handleShapeTransformStart}
                onTransform={handleShapeTransform}
                onTransformEnd={handleShapeTransformEnd}
                onEditText={openTextEdit}
                showCornerRadiusHandles={
                  !readOnly &&
                  shape.type === "rect" &&
                  selectedShapeIds.length === 1 &&
                  selectedShapeIds[0] === shape.id &&
                  transformingShapeIds.size === 0 &&
                  placementTool == null &&
                  textEdit == null
                }
                onCornerRadiusGestureStart={
                  shape.type === "rect" ? () => beginShapeGesture(shape.id) : undefined
                }
                onCornerRadiusCommit={
                  shape.type === "rect" ? commitCornerRadius : undefined
                }
                onAddConnectorBendPoint={
                  !readOnly && placementTool == null ? handleAddConnectorBendPoint : undefined
                }
                onRemoveConnectorBendPoint={
                  !readOnly && placementTool == null ? handleRemoveConnectorBendPoint : undefined
                }
              />
            ))}
            {placementTool != null && !readOnly ? (
              <KonvaConnectorMagnetPorts shapes={flattenKonvaShapesToWorld(storedShapes)} />
            ) : null}
            {!readOnly && selectedConnector != null ? (
              <>
                <KonvaConnectorEndpointHandles
                  shape={selectedConnector}
                  shapes={flattenKonvaShapesToWorld(storedShapes)}
                  alignTargets={collectKonvaAlignTargets(storedShapes, selectedConnector.id, view)}
                  snapEnabled={!altHeld}
                  onGestureStart={() => beginShapeGesture(selectedConnector.id)}
                  onGuidesChange={setAlignGuides}
                  onCommit={(next, options) =>
                    commitConnectorChange(selectedConnector.id, next, options)
                  }
                />
                <KonvaConnectorPathHandles
                  shape={selectedConnector}
                  alignTargets={collectKonvaAlignTargets(storedShapes, selectedConnector.id, view)}
                  snapEnabled={!altHeld}
                  onGestureStart={() => beginShapeGesture(selectedConnector.id)}
                  onGuidesChange={setAlignGuides}
                  onCommit={(next, options) =>
                    commitConnectorChange(selectedConnector.id, next, options)
                  }
                />
              </>
            ) : null}
            {!readOnly && transformerEnabled ? (
              <Transformer
                ref={transformerRef}
                resizeEnabled
                rotateEnabled={
                  !(selectedShapeIds.length === 1 && selectedShape?.type === "text")
                }
                keepRatio={selectedShapeIds.length === 1 && selectedShape?.type === "circle"}
                enabledAnchors={
                  selectedShape?.type === "text"
                    ? ["top-left", "top-right", "bottom-left", "bottom-right"]
                    : undefined
                }
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 8 || newBox.height < 8) {
                    return oldBox;
                  }
                  return newBox;
                }}
                anchorFill={COURSE_KONVA_STROKE_COLOR}
                anchorStroke="#000000"
                borderStroke={COURSE_KONVA_STROKE_COLOR}
                anchorSize={7}
                anchorCornerRadius={2}
                padding={4}
              />
            ) : null}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
