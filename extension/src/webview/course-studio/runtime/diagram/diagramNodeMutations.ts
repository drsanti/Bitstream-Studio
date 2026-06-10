import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import { evaluateNumericProp } from "./evaluateDiagramScene";
import type { MapScaleDraftV1 } from "../../schemas/diagramBindingSchemas";
import type {
  ArrowNodeV1,
  ConnectorCurveV1,
  DiagramBindingV1,
  DiagramNodeV1,
  DiagramV1,
  LineNodeV1,
  MapOpV1,
  RectNodeV1,
  StyleTokenV1,
  TextNodeV1,
} from "../../schemas/diagram.v1";
import { snapDiagramCoord } from "./diagramCanvasSnap";
import {
  connectorBounds,
  defaultQuadraticControl,
  hasConnectorCurve,
} from "./diagramConnectorPath";

export type RectResizeHandle = "e" | "s" | "se";

export type DiagramNodePatch = {
  x?: number | RectNodeV1["x"];
  y?: number | RectNodeV1["y"];
  cx?: number;
  cy?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  content?: TextNodeV1["content"];
  label?: string;
  width?: number;
  height?: number;
  rx?: number;
  fill?: StyleTokenV1;
  stroke?: StyleTokenV1;
  strokeWidth?: number;
  strokeDasharray?: string | null;
  fontSize?: number;
  curve?: ConnectorCurveV1 | null;
  curveCx?: number;
  curveCy?: number;
  flowWhen?: DiagramBindingV1 | null;
  highlightWhen?: DiagramBindingV1 | null;
  highlightStroke?: StyleTokenV1;
};

export function isStaticNumericProp(
  prop: number | { binding: unknown },
): prop is number {
  return typeof prop === "number";
}

function patchNode(node: DiagramNodeV1, nodeId: string, patch: DiagramNodePatch): DiagramNodeV1 {
  if (node.id !== nodeId) {
    if (node.type === "group") {
      return {
        ...node,
        children: node.children.map((child) => patchNode(child, nodeId, patch)),
      };
    }
    return node;
  }

  if (node.type === "rect") {
    return {
      ...node,
      ...(patch.x !== undefined ? { x: patch.x } : {}),
      ...(patch.y !== undefined ? { y: patch.y } : {}),
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.width !== undefined ? { width: patch.width } : {}),
      ...(patch.height !== undefined ? { height: patch.height } : {}),
      ...(patch.rx !== undefined ? { rx: patch.rx } : {}),
      ...(patch.fill !== undefined ? { fill: patch.fill } : {}),
      ...(patch.stroke !== undefined ? { stroke: patch.stroke } : {}),
      ...(patch.strokeWidth !== undefined ? { strokeWidth: patch.strokeWidth } : {}),
    };
  }
  if (node.type === "ellipse") {
    return {
      ...node,
      cx: patch.cx ?? node.cx,
      cy: patch.cy ?? node.cy,
    };
  }
  if (node.type === "text") {
    return {
      ...node,
      ...(patch.x !== undefined ? { x: patch.x as number } : {}),
      ...(patch.y !== undefined ? { y: patch.y as number } : {}),
      ...(patch.content !== undefined ? { content: patch.content } : {}),
      ...(patch.fill !== undefined ? { fill: patch.fill } : {}),
      ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : {}),
    };
  }
  if (node.type === "line" || node.type === "arrow") {
    let next = {
      ...node,
      x1: patch.x1 ?? node.x1,
      y1: patch.y1 ?? node.y1,
      x2: patch.x2 ?? node.x2,
      y2: patch.y2 ?? node.y2,
      ...(patch.stroke !== undefined ? { stroke: patch.stroke } : {}),
      ...(patch.strokeWidth !== undefined ? { strokeWidth: patch.strokeWidth } : {}),
    };
    if (patch.curveCx !== undefined || patch.curveCy !== undefined) {
      const current = next.curve ?? defaultQuadraticControl(next);
      next = {
        ...next,
        curve: {
          cx: patch.curveCx ?? current.cx,
          cy: patch.curveCy ?? current.cy,
        },
      };
    } else if (patch.curve === null) {
      const { curve: _removed, ...withoutCurve } = next;
      next = withoutCurve as typeof node;
    } else if (patch.curve !== undefined) {
      next = { ...next, curve: patch.curve };
    }
    if (patch.strokeDasharray === null) {
      const { strokeDasharray: _removed, ...withoutDash } = next;
      return withoutDash as typeof node;
    }
    if (patch.strokeDasharray !== undefined) {
      next = { ...next, strokeDasharray: patch.strokeDasharray };
    }
    if (patch.flowWhen === null) {
      const { flowWhen: _removed, ...withoutFlow } = next;
      next = withoutFlow as typeof node;
    } else if (patch.flowWhen !== undefined) {
      next = { ...next, flowWhen: patch.flowWhen };
    }
    if (patch.highlightWhen === null) {
      const { highlightWhen: _removed, ...withoutHighlight } = next;
      next = withoutHighlight as typeof node;
    } else if (patch.highlightWhen !== undefined) {
      next = { ...next, highlightWhen: patch.highlightWhen };
    }
    if (patch.highlightStroke !== undefined) {
      next = { ...next, highlightStroke: patch.highlightStroke };
    }
    return next;
  }
  return node;
}

export function replaceDiagramNode(
  diagram: DiagramV1,
  nodeId: string,
  nextNode: DiagramNodeV1,
): DiagramV1 {
  const replaceInTree = (nodes: DiagramNodeV1[]): DiagramNodeV1[] =>
    nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...nextNode, id: nodeId };
      }
      if (node.type === "group") {
        return { ...node, children: replaceInTree(node.children) };
      }
      return node;
    });
  return { ...diagram, nodes: replaceInTree(diagram.nodes) };
}

export function addDiagramNode(diagram: DiagramV1, node: DiagramNodeV1): DiagramV1 {
  return { ...diagram, nodes: [...diagram.nodes, node] };
}

export function removeDiagramNode(diagram: DiagramV1, nodeId: string): DiagramV1 {
  const removeFromTree = (nodes: DiagramNodeV1[]): DiagramNodeV1[] =>
    nodes
      .filter((node) => node.id !== nodeId)
      .map((node) =>
        node.type === "group"
          ? { ...node, children: removeFromTree(node.children) }
          : node,
      );
  return { ...diagram, nodes: removeFromTree(diagram.nodes) };
}

export type DiagramNodeZOrderDirection = "forward" | "backward" | "front" | "back";

/** Reorder a top-level node in `diagram.nodes` (later = painted on top). */
export function reorderDiagramNode(
  diagram: DiagramV1,
  nodeId: string,
  direction: DiagramNodeZOrderDirection,
): DiagramV1 {
  const index = diagram.nodes.findIndex((node) => node.id === nodeId);
  if (index < 0) {
    return diagram;
  }

  const nodes = [...diagram.nodes];
  const [node] = nodes.splice(index, 1);
  if (node == null) {
    return diagram;
  }

  let insertAt = index;
  switch (direction) {
    case "forward":
      insertAt = Math.min(index + 1, nodes.length);
      break;
    case "backward":
      insertAt = Math.max(index - 1, 0);
      break;
    case "front":
      insertAt = nodes.length;
      break;
    case "back":
      insertAt = 0;
      break;
    default:
      return diagram;
  }

  nodes.splice(insertAt, 0, node);
  return { ...diagram, nodes };
}

export function isTopLevelDiagramNode(diagram: DiagramV1, nodeId: string): boolean {
  return diagram.nodes.some((node) => node.id === nodeId);
}

export function diagramNodeZOrderState(
  diagram: DiagramV1,
  nodeId: string,
): { index: number; count: number; canForward: boolean; canBackward: boolean } | null {
  const index = diagram.nodes.findIndex((node) => node.id === nodeId);
  if (index < 0) {
    return null;
  }
  const count = diagram.nodes.length;
  return {
    index,
    count,
    canForward: index < count - 1,
    canBackward: index > 0,
  };
}

export function readNumericBase(
  prop: number | { base?: number; mode?: string; binding: DiagramBindingV1 },
): number {
  if (typeof prop === "number") {
    return prop;
  }
  return prop.base ?? 0;
}

export function defaultAccelYBinding(base = 78): RectNodeV1["y"] {
  return {
    base,
    mode: "add",
    binding: {
      path: "bmi270.ax",
      map: [{ op: "scale", inMin: -1, inMax: 1, outMin: 14, outMax: -14 }],
      fallback: 0,
    },
  };
}

export const DEFAULT_MAP_SCALE_DRAFT = {
  inMin: -1,
  inMax: 1,
  outMin: 14,
  outMax: -14,
} as const;

export function mapScaleDraftFromScale(
  scale: MapOpV1 & { op: "scale" },
): MapScaleDraftV1 {
  return {
    inMin: scale.inMin,
    inMax: scale.inMax,
    outMin: scale.outMin,
    outMax: scale.outMax,
  };
}

export function readMapScaleDraft(binding: DiagramBindingV1 | undefined): MapScaleDraftV1 {
  if (binding?.mapScaleDraft != null) {
    return binding.mapScaleDraft;
  }
  const scale = binding?.map?.find((op) => op.op === "scale");
  if (scale?.op === "scale") {
    return mapScaleDraftFromScale(scale);
  }
  return { ...DEFAULT_MAP_SCALE_DRAFT };
}

export function readScaleMapOp(
  binding: DiagramBindingV1 | undefined,
): MapOpV1 & { op: "scale" } {
  const scale = binding?.map?.find((op) => op.op === "scale");
  if (scale?.op === "scale") {
    return scale;
  }
  const draft = readMapScaleDraft(binding);
  return { op: "scale", ...draft };
}

export function withScaleMapOp(
  binding: DiagramBindingV1,
  scale: MapOpV1 & { op: "scale" },
): DiagramBindingV1 {
  const rest = (binding.map ?? []).filter((op) => op.op !== "scale");
  return { ...binding, map: [scale, ...rest] };
}

export function withScaleMapOpDraftSync(
  binding: DiagramBindingV1,
  scale: MapOpV1 & { op: "scale" },
): DiagramBindingV1 {
  return {
    ...withScaleMapOp(binding, scale),
    mapScaleDraft: mapScaleDraftFromScale(scale),
  };
}

export function disableScaleMapOp(binding: DiagramBindingV1): DiagramBindingV1 {
  const draft = mapScaleDraftFromScale(readScaleMapOp(binding));
  return {
    ...withoutScaleMapOp(binding),
    mapScaleDraft: draft,
  };
}

export function enableScaleMapOp(binding: DiagramBindingV1): DiagramBindingV1 {
  const draft = readMapScaleDraft(binding);
  return withScaleMapOpDraftSync(binding, { op: "scale", ...draft });
}

export function readClampMapOp(
  binding: DiagramBindingV1 | undefined,
): (MapOpV1 & { op: "clamp" }) | null {
  const clamp = binding?.map?.find((op) => op.op === "clamp");
  return clamp?.op === "clamp" ? clamp : null;
}

export function withClampMapOp(
  binding: DiagramBindingV1,
  clamp: (MapOpV1 & { op: "clamp" }) | null,
): DiagramBindingV1 {
  const rest = (binding.map ?? []).filter((op) => op.op !== "clamp");
  if (clamp == null) {
    return { ...binding, map: rest.length > 0 ? rest : undefined };
  }
  return { ...binding, map: [...rest, clamp] };
}

export function hasScaleMapOp(binding: DiagramBindingV1 | undefined): boolean {
  return binding?.map?.some((op) => op.op === "scale") ?? false;
}

export function withoutScaleMapOp(binding: DiagramBindingV1): DiagramBindingV1 {
  const rest = (binding.map ?? []).filter((op) => op.op !== "scale");
  return { ...binding, map: rest.length > 0 ? rest : undefined };
}

export function defaultPipelineFlowWhenBinding(): DiagramBindingV1 {
  return {
    path: "bmi270.accValid",
    fallback: 0,
  };
}

export function defaultPipelineHighlightWhenBinding(): DiagramBindingV1 {
  return {
    path: "bmi270.axAbs",
    map: [
      { op: "scale", inMin: 0.08, inMax: 0.6, outMin: 0, outMax: 1 },
      { op: "clamp", min: 0, max: 1 },
    ],
    fallback: 0,
  };
}

export function patchDiagramNode(
  diagram: DiagramV1,
  nodeId: string,
  patch: DiagramNodePatch,
): DiagramV1 {
  return {
    ...diagram,
    nodes: diagram.nodes.map((node) => patchNode(node, nodeId, patch)),
  };
}

export type DiagramNodeListEntry = {
  id: string;
  type: DiagramNodeV1["type"];
  draggable: boolean;
  bindingNote?: string;
};

function listNodes(nodes: DiagramNodeV1[], out: DiagramNodeListEntry[]): void {
  for (const node of nodes) {
    if (node.type === "group") {
      listNodes(node.children, out);
      continue;
    }
    if (node.type === "rect") {
      const xBound = !isStaticNumericProp(node.x);
      const yBound = !isStaticNumericProp(node.y);
      out.push({
        id: node.id,
        type: node.type,
        draggable: isStaticNumericProp(node.x) || isStaticNumericProp(node.y),
        bindingNote:
          xBound || yBound
            ? `bound: ${xBound ? "x" : ""}${xBound && yBound ? ", " : ""}${yBound ? "y" : ""}`
            : undefined,
      });
    } else if (node.type === "text") {
      out.push({ id: node.id, type: node.type, draggable: true });
    } else if (node.type === "ellipse") {
      const cxBound = !isStaticNumericProp(node.cx);
      const cyBound = !isStaticNumericProp(node.cy);
      out.push({
        id: node.id,
        type: node.type,
        draggable: isStaticNumericProp(node.cx) || isStaticNumericProp(node.cy),
        bindingNote:
          cxBound || cyBound
            ? `bound: ${cxBound ? "cx" : ""}${cxBound && cyBound ? ", " : ""}${cyBound ? "cy" : ""}`
            : undefined,
      });
    } else if (node.type === "line" || node.type === "arrow") {
      out.push({ id: node.id, type: node.type, draggable: true });
    }
  }
}

export function listDiagramNodes(diagram: DiagramV1): DiagramNodeListEntry[] {
  const out: DiagramNodeListEntry[] = [];
  listNodes(diagram.nodes, out);
  return out;
}

export function findDiagramNode(diagram: DiagramV1, nodeId: string): DiagramNodeV1 | null {
  const walk = (nodes: DiagramNodeV1[]): DiagramNodeV1 | null => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.type === "group") {
        const found = walk(node.children);
        if (found != null) {
          return found;
        }
      }
    }
    return null;
  };
  return walk(diagram.nodes);
}

export function getNodeDragOrigin(node: DiagramNodeV1): { x: number; y: number } | null {
  if (node.type === "rect") {
    const x = isStaticNumericProp(node.x) ? node.x : readNumericBase(node.x);
    const y = isStaticNumericProp(node.y) ? node.y : readNumericBase(node.y);
    if (isStaticNumericProp(node.x) || isStaticNumericProp(node.y)) {
      return { x, y };
    }
    return null;
  }
  if (node.type === "text") {
    return { x: node.x, y: node.y };
  }
  if (node.type === "ellipse" && isStaticNumericProp(node.cx) && isStaticNumericProp(node.cy)) {
    return { x: node.cx, y: node.cy };
  }
  if (node.type === "line" || node.type === "arrow") {
    return { x: (node.x1 + node.x2) / 2, y: (node.y1 + node.y2) / 2 };
  }
  return null;
}

export function getNodeHitBounds(
  node: DiagramNodeV1,
  snapshot?: DiagramLiveSnapshot,
): { x: number; y: number; width: number; height: number } | null {
  if (node.type === "rect") {
    if (snapshot != null) {
      return {
        x: evaluateNumericProp(node.x, snapshot),
        y: evaluateNumericProp(node.y, snapshot),
        width: node.width,
        height: node.height,
      };
    }
    const x = isStaticNumericProp(node.x) ? node.x : readNumericBase(node.x);
    const y = isStaticNumericProp(node.y) ? node.y : readNumericBase(node.y);
    return { x, y, width: node.width, height: node.height };
  }
  if (node.type === "text") {
    return { x: node.x - 4, y: node.y - 14, width: 120, height: 18 };
  }
  if (node.type === "ellipse") {
    if (snapshot != null) {
      const cx = evaluateNumericProp(node.cx, snapshot);
      const cy = evaluateNumericProp(node.cy, snapshot);
      return {
        x: cx - node.rx,
        y: cy - node.ry,
        width: node.rx * 2,
        height: node.ry * 2,
      };
    }
    if (isStaticNumericProp(node.cx) && isStaticNumericProp(node.cy)) {
      return {
        x: node.cx - node.rx,
        y: node.cy - node.ry,
        width: node.rx * 2,
        height: node.ry * 2,
      };
    }
    return null;
  }
  if (node.type === "line" || node.type === "arrow") {
    return connectorBounds(node, node.curve);
  }
  return null;
}

export function getRectLayout(
  node: RectNodeV1,
  snapshot?: DiagramLiveSnapshot,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (snapshot != null) {
    return {
      x: evaluateNumericProp(node.x, snapshot),
      y: evaluateNumericProp(node.y, snapshot),
      width: node.width,
      height: node.height,
    };
  }
  return {
    x: isStaticNumericProp(node.x) ? node.x : readNumericBase(node.x),
    y: isStaticNumericProp(node.y) ? node.y : readNumericBase(node.y),
    width: node.width,
    height: node.height,
  };
}

const MIN_RECT_SIZE = 8;

export function buildRectResizePatch(
  origin: { width: number; height: number },
  handle: RectResizeHandle,
  dx: number,
  dy: number,
): DiagramNodePatch | null {
  const snap = snapDiagramCoord;
  const patch: DiagramNodePatch = {};
  if (handle === "e" || handle === "se") {
    patch.width = Math.max(MIN_RECT_SIZE, snap(origin.width + dx));
  }
  if (handle === "s" || handle === "se") {
    patch.height = Math.max(MIN_RECT_SIZE, snap(origin.height + dy));
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

export function buildLineCurvePatch(x: number, y: number): DiagramNodePatch {
  return {
    curveCx: snapDiagramCoord(x),
    curveCy: snapDiagramCoord(y),
  };
}

export function buildLineEndpointPatch(
  endpoint: 1 | 2,
  x: number,
  y: number,
): DiagramNodePatch {
  const snapped = { x: snapDiagramCoord(x), y: snapDiagramCoord(y) };
  if (endpoint === 1) {
    return { x1: snapped.x, y1: snapped.y };
  }
  return { x2: snapped.x, y2: snapped.y };
}

export function getLineEndpoints(
  node: LineNodeV1 | ArrowNodeV1,
): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: node.x1, y1: node.y1, x2: node.x2, y2: node.y2 };
}

export function getLineCurveControl(
  node: LineNodeV1 | ArrowNodeV1,
): ConnectorCurveV1 {
  return node.curve ?? defaultQuadraticControl(node);
}

export { defaultQuadraticControl };
