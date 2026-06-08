import assert from "node:assert/strict";
import test from "node:test";

import { defaultFlowWireEnvironmentV1 } from "../../src/webview/sensor-studio/features/editor/nodes/environment/flow-wire-environment";
import {
  resolveFlowNodeSocketPreviewChromeKey,
  resolveFlowNodeSocketPreviewLayoutKey,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/flow-node-socket-preview-chrome-key";
import type { StudioNodeData } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("resolveFlowNodeSocketPreviewChromeKey tolerates missing descriptors for environment wire", () => {
  const data = {
    nodeId: "scene-output",
    liveEnvironmentWire: {
      ...defaultFlowWireEnvironmentV1(),
      studioAssetId: "env.test.sky",
    },
  } as StudioNodeData;

  assert.doesNotThrow(() => {
    resolveFlowNodeSocketPreviewChromeKey("node-1", data, []);
  });
});

test("resolveFlowNodeSocketPreviewChromeKey includes catalog environment label", () => {
  const data = {
    nodeId: "scene-output",
    liveEnvironmentWire: {
      ...defaultFlowWireEnvironmentV1(),
      studioAssetId: "env.test.sky",
    },
  } as StudioNodeData;

  const catalog = [
    {
      id: "env.test.sky",
      label: "Sunset HDRI",
      category: "environment" as const,
      source: "bundled" as const,
      url: "/textures/env/sunset",
    },
  ];

  const withoutCatalog = resolveFlowNodeSocketPreviewChromeKey("node-1", data, [], []);
  const withCatalog = resolveFlowNodeSocketPreviewChromeKey("node-1", data, [], catalog);

  assert.match(withCatalog, /Sunset HDRI/);
  assert.doesNotMatch(withoutCatalog, /Sunset HDRI/);
});

test("resolveFlowNodeSocketPreviewLayoutKey ignores per-tick liveValue and scalar maps", () => {
  const base = {
    nodeId: "sine-wave",
    liveValue: 0.1,
    liveNumberByHandle: { out: 0.1 },
  } as StudioNodeData;

  const tick = {
    ...base,
    liveValue: 0.99,
    liveNumberByHandle: { out: 0.99 },
    liveInputBooleanByHandle: { in: true },
  } as StudioNodeData;

  const layoutA = resolveFlowNodeSocketPreviewLayoutKey("node-1", base, []);
  const layoutB = resolveFlowNodeSocketPreviewLayoutKey("node-1", tick, []);
  assert.equal(layoutA, layoutB);

  const chromeA = resolveFlowNodeSocketPreviewChromeKey("node-1", base, []);
  const chromeB = resolveFlowNodeSocketPreviewChromeKey("node-1", tick, []);
  assert.notEqual(chromeA, chromeB);
});
