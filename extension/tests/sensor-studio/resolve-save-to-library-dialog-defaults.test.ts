import assert from "node:assert/strict";
import test from "node:test";

import { resolveSaveToLibraryDialogDefaults } from "../../src/webview/sensor-studio/features/editor/flow-library/resolve-save-to-library-dialog-defaults";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("resolveSaveToLibraryDialogDefaults pre-fills linked group preset metadata", () => {
  const nodes = [
    {
      id: "group-1",
      type: "studio-node-group",
      selected: true,
      data: { graphTitle: "Animation Mix" },
    },
  ] as unknown as FlowGraphNode[];

  const defaults = resolveSaveToLibraryDialogDefaults({
    nodes,
    activeGraphId: "__root__",
    nodeGroupLibrary: [
      {
        marker: "trn-node-asset",
        version: 1,
        meta: {
          id: "asset-1",
          name: "Saved Mix",
          description: "Float into mix",
          category: "animation",
          sourceNodeId: "group-1",
          presetKind: "nodeGraph",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        nodes: [],
        edges: [],
        subgraphs: {},
      },
    ],
    flowPresetLibrary: [],
  });

  assert.equal(defaults.target, "group");
  assert.equal(defaults.defaultName, "Saved Mix");
  assert.equal(defaults.defaultDescription, "Float into mix");
  assert.equal(defaults.defaultGroupCategory, "animation");
  assert.equal(defaults.linkedPresetName, "Saved Mix");
});

test("resolveSaveToLibraryDialogDefaults uses group title when not yet linked", () => {
  const nodes = [
    {
      id: "group-2",
      type: "studio-node-group",
      selected: true,
      data: { graphTitle: "My Group" },
    },
  ] as unknown as FlowGraphNode[];

  const defaults = resolveSaveToLibraryDialogDefaults({
    nodes,
    activeGraphId: "__root__",
    nodeGroupLibrary: [],
    flowPresetLibrary: [],
  });

  assert.equal(defaults.defaultName, "My Group");
  assert.equal(defaults.linkedPresetName, null);
  assert.equal(defaults.defaultGroupCategory, "composition");
});
