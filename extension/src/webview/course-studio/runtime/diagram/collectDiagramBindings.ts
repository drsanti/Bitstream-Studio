import type { DiagramBindingV1, DiagramNodeV1, DiagramV1 } from "../../schemas/diagram.v1";

function collectConnectorBindings(
  node: Extract<DiagramNodeV1, { type: "line" } | { type: "arrow" }>,
  paths: Set<string>,
): void {
  if (node.flowWhen?.path) {
    paths.add(node.flowWhen.path);
  }
  if (node.highlightWhen?.path) {
    paths.add(node.highlightWhen.path);
  }
}

function collectFromNode(node: DiagramNodeV1, paths: Set<string>): void {
  if (node.type === "rect") {
    collectNumericBinding(node.x, paths);
    collectNumericBinding(node.y, paths);
  } else if (node.type === "ellipse") {
    collectNumericBinding(node.cx, paths);
    collectNumericBinding(node.cy, paths);
  } else if (node.type === "text") {
    collectTextBinding(node.content, paths);
  } else if (node.type === "line" || node.type === "arrow") {
    collectConnectorBindings(node, paths);
  } else if (node.type === "group") {
    for (const child of node.children) {
      collectFromNode(child, paths);
    }
  }
}

function collectNumericBinding(
  prop: number | { binding: DiagramBindingV1 },
  paths: Set<string>,
): void {
  if (typeof prop !== "number" && prop.binding?.path) {
    paths.add(prop.binding.path);
  }
}

function collectTextBinding(
  prop: string | { binding: DiagramBindingV1 },
  paths: Set<string>,
): void {
  if (typeof prop !== "string" && prop.binding?.path) {
    paths.add(prop.binding.path);
  }
}

export function collectDiagramBindingPaths(diagram: DiagramV1): string[] {
  const paths = new Set<string>();
  for (const node of diagram.nodes) {
    collectFromNode(node, paths);
  }
  return [...paths].sort();
}
