import {
  coerceFlowWireMeshV1,
  flattenFlowWireMeshesForStage,
  type FlowWireMeshV1,
} from "./flow-wire-mesh";

export function mergeFlowWireMeshesV1(
  wires: readonly (FlowWireMeshV1 | null | undefined)[],
): FlowWireMeshV1 | null {
  const children: FlowWireMeshV1[] = [];
  for (const wire of wires) {
    if (wire == null) {
      continue;
    }
    const coerced = coerceFlowWireMeshV1(wire);
    if (coerced == null) {
      continue;
    }
    children.push(...flattenFlowWireMeshesForStage(coerced));
  }
  if (children.length === 0) {
    return null;
  }
  if (children.length === 1) {
    return children[0]!;
  }
  return { version: 1, kind: "group", children };
}

export function resolveMeshGroupWireSocketLabel(wire: FlowWireMeshV1 | null | undefined): string {
  if (wire == null) {
    return "";
  }
  const coerced = coerceFlowWireMeshV1(wire);
  if (coerced == null) {
    return "";
  }
  if (coerced.kind === "group") {
    const count = coerced.children?.length ?? 0;
    return count > 0 ? `Bundle · ${count} meshes` : "Bundle";
  }
  return "";
}
