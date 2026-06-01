import type { Edge } from "@xyflow/react";
import type { StudioPortType } from "../store/flow-editor.store";
import { FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW } from "../components/flow-canvas-ui-persistence";
import type { FlowCanvasEdgeRoutingStyle } from "../components/flow-canvas-ui-persistence";

export type FlowPortThemeColors = {
  numberColor: string;
  booleanColor: string;
  stringColor: string;
  eventColor: string;
  vector3Color: string;
  quaternionColor: string;
  environmentColor: string;
  cameraColor: string;
  glbAnimationColor: string;
  transformColor: string;
  fogColor: string;
  studioLightColor: string;
  postProcessingColor: string;
  contactShadowsColor: string;
};

export const FLOW_EDGE_FALLBACK_STROKE = "rgb(113 113 122)";

export function buildFlowPortColorMap(colors: FlowPortThemeColors): Record<StudioPortType, string> {
  return {
    number: colors.numberColor,
    boolean: colors.booleanColor,
    string: colors.stringColor,
    event: colors.eventColor,
    vector3: colors.vector3Color,
    quaternion: colors.quaternionColor,
    environment: colors.environmentColor,
    camera: colors.cameraColor,
    glbAnimation: colors.glbAnimationColor,
    transform: colors.transformColor,
    fog: colors.fogColor,
    studioLight: colors.studioLightColor,
    postProcessing: colors.postProcessingColor,
    contactShadows: colors.contactShadowsColor,
  };
}

export function strokeForPortType(
  colorByType: Record<string, string>,
  portType: StudioPortType | null | undefined,
): string {
  if (portType == null) {
    return FLOW_EDGE_FALLBACK_STROKE;
  }
  return colorByType[portType] ?? FLOW_EDGE_FALLBACK_STROKE;
}

export function decorateFlowEdges(
  edges: Edge[],
  colorByType: Record<string, string>,
  edgeRoutingStyle: FlowCanvasEdgeRoutingStyle,
): Edge[] {
  return edges.map((edge) => {
    const type = typeof edge.label === "string" ? edge.label : "";
    const stroke = strokeForPortType(colorByType, type as StudioPortType);
    return {
      ...edge,
      type: FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW[edgeRoutingStyle],
      style: {
        ...(edge.style ?? {}),
        stroke,
        strokeWidth: 2,
      },
      labelStyle: {
        ...(edge.labelStyle ?? {}),
        fill: stroke,
        fontSize: 11,
        fontWeight: 600,
      },
    };
  });
}
