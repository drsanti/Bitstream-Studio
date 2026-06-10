import type { DiagramNodeV1, DiagramV1 } from "../../schemas/diagram.v1";
import { getDiagram2dNodes } from "../../schemas/normalizeDiagramV1";
import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import {
  evaluateBindingGate,
  evaluateNumericProp,
  evaluateTextProp,
} from "./evaluateDiagramScene";

export type ResolvedNodeProps = {
  id: string;
  type: DiagramNodeV1["type"];
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  content?: string;
  flowActive?: boolean;
  highlighted?: boolean;
};

export type ResolvedDiagramProps = {
  diagramId: string;
  nodes: ResolvedNodeProps[];
};

function resolveNode(
  node: DiagramNodeV1,
  snapshot: DiagramLiveSnapshot,
  linkHealthy: boolean,
): ResolvedNodeProps {
  const base: ResolvedNodeProps = { id: node.id, type: node.type };

  if (node.type === "rect") {
    return {
      ...base,
      x: evaluateNumericProp(node.x, snapshot),
      y: evaluateNumericProp(node.y, snapshot),
    };
  }

  if (node.type === "ellipse") {
    return {
      ...base,
      cx: evaluateNumericProp(node.cx, snapshot),
      cy: evaluateNumericProp(node.cy, snapshot),
    };
  }

  if (node.type === "text") {
    return {
      ...base,
      content: evaluateTextProp(node.content, snapshot),
    };
  }

  if (node.type === "line" || node.type === "arrow") {
    const flowGate = evaluateBindingGate(node.flowWhen, snapshot);
    const highlightGate = evaluateBindingGate(node.highlightWhen, snapshot);
    const dashedFlow =
      linkHealthy &&
      node.type === "line" &&
      node.strokeDasharray != null &&
      node.flowWhen == null;
    return {
      ...base,
      flowActive: dashedFlow || (linkHealthy && flowGate),
      highlighted: highlightGate,
    };
  }

  if (node.type === "group") {
    return base;
  }

  return base;
}

function walkNodes(
  nodes: DiagramNodeV1[],
  snapshot: DiagramLiveSnapshot,
  linkHealthy: boolean,
  out: ResolvedNodeProps[],
): void {
  for (const node of nodes) {
    out.push(resolveNode(node, snapshot, linkHealthy));
    if (node.type === "group") {
      walkNodes(node.children, snapshot, linkHealthy, out);
    }
  }
}

/** Evaluate all bindable diagram properties into plain values for render/tests. */
export function evaluateDiagramProps(
  diagram: DiagramV1,
  snapshot: DiagramLiveSnapshot,
  options?: { linkHealthy?: boolean },
): ResolvedDiagramProps {
  const linkHealthy = options?.linkHealthy ?? true;
  const nodes: ResolvedNodeProps[] = [];
  walkNodes(getDiagram2dNodes(diagram), snapshot, linkHealthy, nodes);
  return { diagramId: diagram.id, nodes };
}

export function findResolvedNode(
  resolved: ResolvedDiagramProps,
  nodeId: string,
): ResolvedNodeProps | undefined {
  return resolved.nodes.find((node) => node.id === nodeId);
}
