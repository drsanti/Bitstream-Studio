import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DiagramV1, RectNodeV1 } from "../schemas/diagram.v1";
import { CourseDiagramRenderer } from "../runtime/diagram/CourseDiagramRenderer";
import { snapDiagramCoord } from "../runtime/diagram/diagramCanvasSnap";
import {
  collectDiagramAlignTargets,
  resolveDiagramDragSnapAxes,
  snapDiagramDragDelta,
  type DiagramAlignmentGuide,
} from "../runtime/diagram/diagramAlignmentSnap";
import {
  buildLineCurvePatch,
  buildLineEndpointPatch,
  buildRectResizePatch,
  findDiagramNode,
  getLineEndpoints,
  getNodeDragOrigin,
  getNodeHitBounds,
  getRectLayout,
  isStaticNumericProp,
  listDiagramNodes,
  patchDiagramNode,
  type DiagramNodePatch,
  type RectResizeHandle,
} from "../runtime/diagram/diagramNodeMutations";
import { hasConnectorCurve } from "../runtime/diagram/diagramConnectorPath";
import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "../runtime/diagram/diagramDesignTimeSnapshot";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

const RESIZE_HANDLES: RectResizeHandle[] = ["e", "s", "se"];
const HANDLE_RADIUS = 5;

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (ctm == null) {
    return { x: 0, y: 0 };
  }
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

function buildDragPatch(
  node: ReturnType<typeof findDiagramNode>,
  origin: { x: number; y: number },
  dx: number,
  dy: number,
): DiagramNodePatch | null {
  if (node == null) {
    return null;
  }
  if (node.type === "rect") {
    const patch: DiagramNodePatch = {};
    if (isStaticNumericProp(node.x)) {
      patch.x = snapDiagramCoord(origin.x + dx);
    }
    if (isStaticNumericProp(node.y)) {
      patch.y = snapDiagramCoord(origin.y + dy);
    }
    return Object.keys(patch).length > 0 ? patch : null;
  }
  if (node.type === "text") {
    return {
      x: snapDiagramCoord(origin.x + dx),
      y: snapDiagramCoord(origin.y + dy),
    };
  }
  if (node.type === "ellipse") {
    const patch: DiagramNodePatch = {};
    if (isStaticNumericProp(node.cx)) {
      patch.cx = snapDiagramCoord(origin.x + dx);
    }
    if (isStaticNumericProp(node.cy)) {
      patch.cy = snapDiagramCoord(origin.y + dy);
    }
    return Object.keys(patch).length > 0 ? patch : null;
  }
  if (node.type === "line" || node.type === "arrow") {
    const patch: DiagramNodePatch = {
      x1: snapDiagramCoord(node.x1 + dx),
      y1: snapDiagramCoord(node.y1 + dy),
      x2: snapDiagramCoord(node.x2 + dx),
      y2: snapDiagramCoord(node.y2 + dy),
    };
    if (hasConnectorCurve(node)) {
      patch.curve = {
        cx: snapDiagramCoord(node.curve.cx + dx),
        cy: snapDiagramCoord(node.curve.cy + dy),
      };
    }
    return patch;
  }
  return null;
}

function resizeHandleCenter(
  layout: { x: number; y: number; width: number; height: number },
  handle: RectResizeHandle,
): { x: number; y: number } {
  if (handle === "e") {
    return { x: layout.x + layout.width, y: layout.y + layout.height / 2 };
  }
  if (handle === "s") {
    return { x: layout.x + layout.width / 2, y: layout.y + layout.height };
  }
  return { x: layout.x + layout.width, y: layout.y + layout.height };
}

function attachPointerSession(
  svg: SVGSVGElement,
  pointerId: number,
  startClientX: number,
  startClientY: number,
  onMove: (dx: number, dy: number, current: { x: number; y: number }) => void,
  onEnd: (dx: number, dy: number, current: { x: number; y: number }) => void,
) {
  const start = clientToSvg(svg, startClientX, startClientY);

  const onMoveEvent = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) {
      return;
    }
    moveEvent.preventDefault();
    const current = clientToSvg(svg, moveEvent.clientX, moveEvent.clientY);
    onMove(current.x - start.x, current.y - start.y, current);
  };

  const onEndEvent = (endEvent: PointerEvent) => {
    if (endEvent.pointerId !== pointerId) {
      return;
    }
    endEvent.preventDefault();
    document.removeEventListener("pointermove", onMoveEvent);
    document.removeEventListener("pointerup", onEndEvent);
    document.removeEventListener("pointercancel", onEndEvent);
    const current = clientToSvg(svg, endEvent.clientX, endEvent.clientY);
    onEnd(current.x - start.x, current.y - start.y, current);
  };

  document.addEventListener("pointermove", onMoveEvent);
  document.addEventListener("pointerup", onEndEvent);
  document.addEventListener("pointercancel", onEndEvent);
}

export function CourseDiagramCanvasEditor({ diagram }: { diagram: DiagramV1 }) {
  const overlayRef = useRef<SVGSVGElement>(null);
  const selectedNodeId = useCourseDiagramEditorStore(
    (s) => s.selectedNodeIds[diagram.id] ?? null,
  );
  const setSelectedNodeId = useCourseDiagramEditorStore((s) => s.setSelectedNodeId);
  const patchNode = useCourseDiagramEditorStore((s) => s.patchNode);
  const pushDiagramUndoSnapshot = useCourseDiagramEditorStore((s) => s.pushDiagramUndoSnapshot);
  const [dragPreview, setDragPreview] = useState<DiagramNodePatch | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<DiagramAlignmentGuide[]>([]);

  const [minX, minY, viewWidth, viewHeight] = diagram.viewBox;
  const nodes = listDiagramNodes(diagram);
  const previewDiagram =
    dragPreview != null && selectedNodeId != null
      ? patchDiagramNode(diagram, selectedNodeId, dragPreview)
      : diagram;

  const selectedNode =
    selectedNodeId != null ? findDiagramNode(previewDiagram, selectedNodeId) : null;
  const selectedRect =
    selectedNode?.type === "rect" ? (selectedNode as RectNodeV1) : null;
  const editorSnapshot = DIAGRAM_DESIGN_TIME_SNAPSHOT;
  const selectedRectLayout =
    selectedRect != null ? getRectLayout(selectedRect, editorSnapshot) : null;

  const startDrag = (nodeId: string, event: ReactPointerEvent<SVGRectElement>) => {
    event.stopPropagation();
    setSelectedNodeId(diagram.id, nodeId);
    const node = findDiagramNode(diagram, nodeId);
    const origin = node != null ? getNodeDragOrigin(node) : null;
    const startBounds = node != null ? getNodeHitBounds(node, editorSnapshot) : null;
    if (node == null || origin == null || startBounds == null || overlayRef.current == null) {
      return;
    }

    const targets = collectDiagramAlignTargets(diagram, nodeId);
    const axes = resolveDiagramDragSnapAxes(node);

    const previewDrag = (dx: number, dy: number) => {
      const snapped = snapDiagramDragDelta({
        startBounds,
        dx,
        dy,
        targets,
        snapX: axes.snapX,
        snapY: axes.snapY,
      });
      setAlignmentGuides(snapped.guides);
      return buildDragPatch(node, origin, snapped.dx, snapped.dy);
    };

    const svg = overlayRef.current;
    pushDiagramUndoSnapshot(diagram.id);
    attachPointerSession(
      svg,
      event.pointerId,
      event.clientX,
      event.clientY,
      (dx, dy) => setDragPreview(previewDrag(dx, dy)),
      (dx, dy) => {
        const patch = previewDrag(dx, dy);
        if (patch != null) {
          patchNode(diagram.id, nodeId, patch, { recordUndo: false });
        }
        setDragPreview(null);
        setAlignmentGuides([]);
      },
    );
  };

  const startResize = (
    nodeId: string,
    handle: RectResizeHandle,
    originSize: { width: number; height: number },
    event: ReactPointerEvent<SVGCircleElement>,
  ) => {
    event.stopPropagation();
    if (overlayRef.current == null) {
      return;
    }
    const svg = overlayRef.current;
    pushDiagramUndoSnapshot(diagram.id);
    attachPointerSession(
      svg,
      event.pointerId,
      event.clientX,
      event.clientY,
      (dx, dy) => setDragPreview(buildRectResizePatch(originSize, handle, dx, dy)),
      (dx, dy) => {
        const patch = buildRectResizePatch(originSize, handle, dx, dy);
        if (patch != null) {
          patchNode(diagram.id, nodeId, patch, { recordUndo: false });
        }
        setDragPreview(null);
      },
    );
  };

  const startEndpointDrag = (
    nodeId: string,
    endpoint: 1 | 2,
    event: ReactPointerEvent<SVGCircleElement>,
  ) => {
    event.stopPropagation();
    if (overlayRef.current == null) {
      return;
    }
    const svg = overlayRef.current;
    pushDiagramUndoSnapshot(diagram.id);
    attachPointerSession(
      svg,
      event.pointerId,
      event.clientX,
      event.clientY,
      (_dx, _dy, current) =>
        setDragPreview(buildLineEndpointPatch(endpoint, current.x, current.y)),
      (_dx, _dy, current) => {
        patchNode(
          diagram.id,
          nodeId,
          buildLineEndpointPatch(endpoint, current.x, current.y),
          { recordUndo: false },
        );
        setDragPreview(null);
      },
    );
  };

  const startCurveDrag = (
    nodeId: string,
    event: ReactPointerEvent<SVGCircleElement>,
  ) => {
    event.stopPropagation();
    if (overlayRef.current == null) {
      return;
    }
    const svg = overlayRef.current;
    pushDiagramUndoSnapshot(diagram.id);
    attachPointerSession(
      svg,
      event.pointerId,
      event.clientX,
      event.clientY,
      (_dx, _dy, current) => setDragPreview(buildLineCurvePatch(current.x, current.y)),
      (_dx, _dy, current) => {
        patchNode(
          diagram.id,
          nodeId,
          buildLineCurvePatch(current.x, current.y),
          { recordUndo: false },
        );
        setDragPreview(null);
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="course-diagram-canvas-editor relative w-full overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)] outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          setSelectedNodeId(diagram.id, null);
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <CourseDiagramRenderer diagram={previewDiagram} designTime />
        </div>
        <svg
          ref={overlayRef}
          className="absolute inset-0 h-full w-full"
          viewBox={diagram.viewBox.join(" ")}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {alignmentGuides.map((guide, index) =>
            guide.axis === "x" ? (
              <line
                key={`guide-x-${guide.position}-${index}`}
                className="course-diagram-align-guide"
                x1={guide.position}
                y1={minY}
                x2={guide.position}
                y2={minY + viewHeight}
              />
            ) : (
              <line
                key={`guide-y-${guide.position}-${index}`}
                className="course-diagram-align-guide"
                x1={minX}
                y1={guide.position}
                x2={minX + viewWidth}
                y2={guide.position}
              />
            ),
          )}

          {nodes.map((entry) => {
            const node = findDiagramNode(previewDiagram, entry.id);
            if (node == null) {
              return null;
            }
            const bounds = getNodeHitBounds(node, editorSnapshot);
            if (bounds == null) {
              return null;
            }
            const selected = selectedNodeId === entry.id;
            const cornerRadius = node.type === "rect" ? (node.rx ?? 0) : 0;
            return (
              <rect
                key={entry.id}
                x={bounds.x}
                y={bounds.y}
                width={bounds.width}
                height={bounds.height}
                rx={selected ? cornerRadius : 0}
                ry={selected ? cornerRadius : 0}
                fill={
                  selected
                    ? "color-mix(in srgb, var(--accent-amber) 18%, transparent)"
                    : "transparent"
                }
                stroke={
                  selected
                    ? "var(--accent-amber)"
                    : "color-mix(in srgb, var(--accent-amber) 35%, transparent)"
                }
                strokeWidth={selected ? 2 : 1}
                strokeDasharray={entry.draggable ? undefined : "4 3"}
                className={entry.draggable ? "cursor-move" : "cursor-not-allowed"}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  overlayRef.current?.parentElement?.focus({ preventScroll: true });
                  if (entry.draggable) {
                    startDrag(entry.id, event);
                  } else {
                    setSelectedNodeId(diagram.id, entry.id);
                  }
                }}
              />
            );
          })}

          {selectedRectLayout != null && selectedNodeId != null
            ? RESIZE_HANDLES.map((handle) => {
                const center = resizeHandleCenter(selectedRectLayout, handle);
                const cursor =
                  handle === "se" ? "nwse-resize" : handle === "e" ? "ew-resize" : "ns-resize";
                return (
                  <circle
                    key={handle}
                    cx={center.x}
                    cy={center.y}
                    r={HANDLE_RADIUS}
                    className="course-diagram-canvas-handle"
                    style={{ cursor }}
                    onPointerDown={(event) =>
                      startResize(
                        selectedNodeId,
                        handle,
                        {
                          width: selectedRectLayout.width,
                          height: selectedRectLayout.height,
                        },
                        event,
                      )
                    }
                  />
                );
              })
            : null}

          {selectedNode != null &&
          (selectedNode.type === "line" || selectedNode.type === "arrow") &&
          selectedNodeId != null
            ? (() => {
                const endpoints = getLineEndpoints(selectedNode);
                const curve = hasConnectorCurve(selectedNode)
                  ? selectedNode.curve
                  : null;
                return (
                  <g key="line-endpoints">
                    {([1, 2] as const).map((endpoint) => {
                      const x = endpoint === 1 ? endpoints.x1 : endpoints.x2;
                      const y = endpoint === 1 ? endpoints.y1 : endpoints.y2;
                      return (
                        <circle
                          key={endpoint}
                          cx={x}
                          cy={y}
                          r={HANDLE_RADIUS}
                          className="course-diagram-canvas-handle"
                          style={{ cursor: "crosshair" }}
                          onPointerDown={(event) =>
                            startEndpointDrag(selectedNodeId, endpoint, event)
                          }
                        />
                      );
                    })}
                    {curve != null ? (
                      <circle
                        cx={curve.cx}
                        cy={curve.cy}
                        r={HANDLE_RADIUS}
                        className="course-diagram-canvas-handle course-diagram-curve-handle"
                        style={{ cursor: "grab" }}
                        onPointerDown={(event) => startCurveDrag(selectedNodeId, event)}
                      />
                    ) : null}
                  </g>
                );
              })()
            : null}
        </svg>
      </div>
      <div className="text-2xs text-[var(--text-muted)]">
        Edit canvas — static layout (live bindings apply on the page preview only) · top layers
        receive clicks · node picker · Ctrl+Z undo
      </div>
    </div>
  );
}
