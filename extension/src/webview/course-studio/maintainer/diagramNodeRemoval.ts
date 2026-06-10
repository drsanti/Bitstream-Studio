import type { DiagramNodeV1 } from "../schemas/diagram.v1";

export function isDiagramFrameNode(node: DiagramNodeV1): boolean {
  return node.type === "rect" && node.id === "frame";
}

/** Returns true when the maintainer should proceed with removal. */
export function requestRemoveDiagramNode(node: DiagramNodeV1): boolean {
  if (!isDiagramFrameNode(node)) {
    return true;
  }

  return window.confirm(
    "Delete the diagram background card (frame)? Other shapes stay on the canvas without the rounded backdrop.",
  );
}
