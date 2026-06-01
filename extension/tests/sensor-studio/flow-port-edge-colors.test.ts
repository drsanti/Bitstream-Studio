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
};

describe("flow-port-edge-colors", () => {
  it("maps port types to theme strokes", () => {
    const map = buildFlowPortColorMap(theme);
    assert.equal(strokeForPortType(map, "number"), "#ff0000");
    assert.equal(strokeForPortType(map, "event"), "#ffff00");
    assert.match(strokeForPortType(map, null), /113/);
  });

  it("decorates edges using label port type", () => {
    const map = buildFlowPortColorMap(theme);
    const edges = decorateFlowEdges(
      [{ id: "e1", source: "a", target: "b", label: "number" }],
      map,
      "smoothstep",
    );
    assert.equal(edges[0]?.style?.stroke, "#ff0000");
    assert.equal(edges[0]?.type, "smoothstep");
  });
});
