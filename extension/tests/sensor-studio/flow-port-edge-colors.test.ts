import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlowPortColorMap,
  decorateFlowEdges,
  strokeForPortType,
} from "../../src/webview/sensor-studio/features/editor/edges/flow-port-edge-colors";

const theme = {
  numberColor: "#ff0000",
  booleanColor: "#00ff00",
  stringColor: "#0000ff",
  eventColor: "#ffff00",
  vector3Color: "#ff00ff",
  quaternionColor: "#00ffff",
  environmentColor: "#111111",
  cameraColor: "#222222",
  glbAnimationColor: "#333333",
  transformColor: "#444444",
  fogColor: "#555555",
  studioLightColor: "#666666",
  postProcessingColor: "#777777",
  contactShadowsColor: "#888888",
  particleEmitterColor: "#999999",
};

describe("flow-port-edge-colors", () => {
  it("maps port types to theme strokes", () => {
    const map = buildFlowPortColorMap(theme);
    assert.equal(strokeForPortType(map, "number"), "#ff0000");
    assert.equal(strokeForPortType(map, "event"), "#ffff00");
    assert.equal(strokeForPortType(map, "postProcessing"), "#777777");
    assert.equal(strokeForPortType(map, "contactShadows"), "#888888");
    assert.equal(strokeForPortType(map, "particleEmitter"), "#999999");
    assert.match(strokeForPortType(map, null), /113/);
  });

  it("decorates edges using label port type", () => {
    const map = buildFlowPortColorMap(theme);
    const prefs = {
      edgeRoutingStyle: "smoothstep" as const,
      edgeStrokeWidth: 2 as const,
      edgeAnimated: false,
      edgeIdleOpacity: 1,
      dimUnrelatedEdgesOnSelection: false,
      smoothStepBorderRadius: 12,
      edgeShowMarkers: true,
      edgeMarkerSize: "small" as const,
      edgeMarkerHideBelowZoom: 0.5,
      edgeShowTypeLabel: "never" as const,
      edgeSelectionHighlight: "normal" as const,
      liveEdgeHighlight: false,
      staleEdgeDash: false,
      edgeParallelSpacing: 0,
      edgeBundleMode: "off",
      edgeBundleSpacing: 12,
      edgeBusLaneSpacing: 0,
      edgeBusLaneSort: "vertical",
      edgeInteractionWidth: 20,
      edgeStepLaneHop: false,
    };
    const edges = decorateFlowEdges(
      [{ id: "e1", source: "a", target: "b", label: "number" }],
      map,
      prefs,
    );
    assert.equal(edges[0]?.style?.stroke, "#ff0000");
    assert.equal(edges[0]?.type, "smoothstep");
    assert.equal(edges[0]?.animated, false);
    assert.equal(edges[0]?.pathOptions?.borderRadius, 12);
    assert.ok(edges[0]?.markerEnd != null);
    assert.equal(edges[0]?.label, undefined);
    assert.equal(edges[0]?.labelShowBg, false);
  });

  it("shows label when mode is selected and edge is selected", () => {
    const map = buildFlowPortColorMap(theme);
    const prefs = {
      edgeRoutingStyle: "bezier" as const,
      edgeStrokeWidth: 2 as const,
      edgeAnimated: false,
      edgeIdleOpacity: 1,
      dimUnrelatedEdgesOnSelection: false,
      smoothStepBorderRadius: 8,
      edgeShowMarkers: false,
      edgeMarkerSize: "small" as const,
      edgeMarkerHideBelowZoom: 0.55,
      edgeShowTypeLabel: "selected" as const,
      edgeSelectionHighlight: "normal" as const,
      liveEdgeHighlight: false,
      staleEdgeDash: false,
      edgeParallelSpacing: 0,
      edgeBundleMode: "off" as const,
      edgeBundleSpacing: 12,
      edgeBusLaneSpacing: 0,
      edgeBusLaneSort: "vertical" as const,
      edgeInteractionWidth: 20,
      edgeStepLaneHop: false,
    };
    const edges = decorateFlowEdges(
      [{ id: "e1", source: "a", target: "b", label: "number", selected: true }],
      map,
      prefs,
    );
    assert.equal(edges[0]?.label, "Number");
  });

  it("applies port-colored glow when edge is selected", () => {
    const map = buildFlowPortColorMap(theme);
    const prefs = {
      edgeRoutingStyle: "bezier" as const,
      edgeStrokeWidth: 2 as const,
      edgeAnimated: false,
      edgeIdleOpacity: 1,
      dimUnrelatedEdgesOnSelection: false,
      smoothStepBorderRadius: 8,
      edgeShowMarkers: false,
      edgeMarkerSize: "small" as const,
      edgeMarkerHideBelowZoom: 0.55,
      edgeShowTypeLabel: "never" as const,
      edgeSelectionHighlight: "strong" as const,
      liveEdgeHighlight: false,
      staleEdgeDash: false,
      edgeParallelSpacing: 0,
      edgeBundleMode: "off" as const,
      edgeBundleSpacing: 12,
      edgeBusLaneSpacing: 0,
      edgeBusLaneSort: "vertical" as const,
      edgeInteractionWidth: 20,
      edgeStepLaneHop: false,
    };
    const edges = decorateFlowEdges(
      [{ id: "e1", source: "a", target: "b", label: "number", selected: true }],
      map,
      prefs,
    );
    assert.ok(edges[0]?.className?.includes("studio-flow-edge--selected"));
    assert.ok(edges[0]?.style?.filter?.includes("#ff0000"));
    assert.equal(edges[0]?.style?.strokeWidth, 3.75);
  });

  it("dims unrelated edges when selection context is set", () => {
    const map = buildFlowPortColorMap(theme);
    const prefs = {
      edgeRoutingStyle: "bezier" as const,
      edgeStrokeWidth: 2 as const,
      edgeAnimated: true,
      edgeIdleOpacity: 0.8,
      dimUnrelatedEdgesOnSelection: true,
      smoothStepBorderRadius: 8,
      edgeShowMarkers: false,
      edgeMarkerSize: "small" as const,
      edgeMarkerHideBelowZoom: 0.55,
      edgeShowTypeLabel: "never" as const,
      edgeSelectionHighlight: "normal" as const,
      liveEdgeHighlight: false,
      staleEdgeDash: false,
      edgeParallelSpacing: 0,
      edgeBundleMode: "off",
      edgeBundleSpacing: 12,
      edgeBusLaneSpacing: 0,
      edgeBusLaneSort: "vertical",
      edgeInteractionWidth: 20,
      edgeStepLaneHop: false,
    };
    const edges = decorateFlowEdges(
      [
        { id: "e1", source: "a", target: "b", label: "number" },
        { id: "e2", source: "c", target: "d", label: "boolean" },
      ],
      map,
      prefs,
      { selectedNodeIds: new Set(["a"]) },
    );
    assert.equal(edges[0]?.style?.opacity, 1);
    assert.ok((edges[1]?.style?.opacity as number) <= 0.42);
  });
});
