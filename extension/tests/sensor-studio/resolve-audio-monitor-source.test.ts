import assert from "node:assert/strict";
import test from "node:test";
import type { Node } from "@xyflow/react";

import {
  findWiredAudioBusSourceNodeId,
  readMonitorModeEnabled,
  resolveAudioSinkSourceNodeId,
} from "../../src/webview/sensor-studio/core/audio/resolve-audio-monitor-source";

function studioNode(id: string, nodeId: string, x: number, y: number): Node {
  return {
    id,
    type: "studio",
    position: { x, y },
    data: {
      nodeId,
      label: nodeId,
      category: "audio",
      defaultConfig: {},
      inputHandles: [],
      outputHandles: [],
    },
  } as Node;
}

test("findWiredAudioBusSourceNodeId returns the audio edge source", () => {
  const edges = [
    { source: "osc-1", target: "out-1", targetHandle: "audio" },
  ];
  assert.equal(findWiredAudioBusSourceNodeId("out-1", edges), "osc-1");
  assert.equal(findWiredAudioBusSourceNodeId("scope-1", edges), null);
});

test("readMonitorModeEnabled is opt-in only", () => {
  assert.equal(readMonitorModeEnabled({}), false);
  assert.equal(readMonitorModeEnabled({ sourceMode: "auto" }), false);
  assert.equal(readMonitorModeEnabled({ monitorModeEnabled: false }), false);
  assert.equal(readMonitorModeEnabled({ monitorModeEnabled: true }), true);
});

test("resolveAudioSinkSourceNodeId prefers wired audio over monitor auto", () => {
  const nodes = [
    studioNode("osc-1", "audio-oscillator", 0, 0),
    studioNode("mic-1", "mic-input", 400, 0),
    studioNode("out-1", "audio-output", 200, 0),
  ];
  const edges = [{ source: "osc-1", target: "out-1", targetHandle: "audio" }];
  assert.equal(
    resolveAudioSinkSourceNodeId({
      sinkNodeId: "out-1",
      cfg: { monitorModeEnabled: true, sourceMode: "auto" },
      nodes,
      edges,
    }),
    "osc-1",
  );
});

test("resolveAudioSinkSourceNodeId returns null when unwired and monitor off", () => {
  const nodes = [
    studioNode("osc-1", "audio-oscillator", 0, 0),
    studioNode("scope-1", "audio-scope", 200, 0),
  ];
  assert.equal(
    resolveAudioSinkSourceNodeId({
      sinkNodeId: "scope-1",
      cfg: { sourceMode: "auto", enabled: true },
      nodes,
      edges: [],
    }),
    null,
  );
});

test("resolveAudioSinkSourceNodeId uses monitor auto when explicitly enabled", () => {
  const nodes = [
    studioNode("osc-1", "audio-oscillator", 0, 0),
    studioNode("scope-1", "audio-scope", 40, 0),
  ];
  assert.equal(
    resolveAudioSinkSourceNodeId({
      sinkNodeId: "scope-1",
      cfg: { monitorModeEnabled: true, sourceMode: "auto" },
      nodes,
      edges: [],
    }),
    "osc-1",
  );
});
