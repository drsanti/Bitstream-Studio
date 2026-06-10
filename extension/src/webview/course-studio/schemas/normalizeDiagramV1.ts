import type {
  DiagramLayerV1,
  DiagramNodeV1,
  DiagramV1,
  DiagramV1Input,
} from "./diagram.v1";

/** Normalize legacy `nodes` or explicit `layers` into canonical `layers` + top-level `nodes`. */
export function normalizeDiagramLayers(input: DiagramV1Input): {
  layers: DiagramLayerV1[];
  nodes: DiagramNodeV1[];
} {
  if (input.layers != null && input.layers.length > 0) {
    const layers = input.layers.map((layer) => {
      if (layer.kind === "2d") {
        return { kind: "2d" as const, nodes: layer.nodes };
      }
      return {
        kind: "3d" as const,
        nodes: layer.nodes,
        ...(layer.camera != null ? { camera: layer.camera } : {}),
      };
    });
    const nodes = layers.find((layer) => layer.kind === "2d")?.nodes ?? [];
    return { layers, nodes };
  }

  const nodes = input.nodes ?? [];
  return {
    layers: [{ kind: "2d", nodes }],
    nodes,
  };
}

export function getDiagram2dLayer(
  diagram: DiagramV1,
): Extract<DiagramLayerV1, { kind: "2d" }> | undefined {
  return diagram.layers.find((layer): layer is Extract<DiagramLayerV1, { kind: "2d" }> => {
    return layer.kind === "2d";
  });
}

export function getDiagram3dLayer(
  diagram: DiagramV1,
): Extract<DiagramLayerV1, { kind: "3d" }> | undefined {
  return diagram.layers.find((layer): layer is Extract<DiagramLayerV1, { kind: "3d" }> => {
    return layer.kind === "3d";
  });
}

export function getDiagram2dNodes(diagram: DiagramV1): DiagramNodeV1[] {
  return diagram.nodes;
}

export function getDiagram3dNodes(diagram: DiagramV1) {
  return getDiagram3dLayer(diagram)?.nodes ?? [];
}

export function diagramHas3dLayer(diagram: DiagramV1): boolean {
  return getDiagram3dLayer(diagram) != null;
}

/** Keep `layers[]` in sync with top-level `nodes` and the optional 3D layer. */
export function syncDiagramLayers(diagram: DiagramV1): DiagramV1 {
  const existing3d = getDiagram3dLayer(diagram);
  const layers: DiagramLayerV1[] = [{ kind: "2d", nodes: diagram.nodes }];
  if (existing3d != null && existing3d.nodes.length > 0) {
    layers.push({
      kind: "3d",
      nodes: existing3d.nodes,
      ...(existing3d.camera != null ? { camera: existing3d.camera } : {}),
    });
  }
  return { ...diagram, layers };
}
