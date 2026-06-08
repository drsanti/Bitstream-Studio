import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDefaultExpandedPaths,
  collectAllExpandablePaths,
  flattenVisibleHierarchy,
  parentScenePath,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-hierarchy-nav";
import type { StudioGltfExtractionResult } from "../../src/webview/sensor-studio/features/editor/gltf/studio-gltf-extract";

const extraction: StudioGltfExtractionResult = {
  sceneTree: [
    {
      label: "root",
      path: "root",
      nodeType: "group",
      children: [
        {
          label: "arm",
          path: "root/arm",
          nodeType: "mesh",
          children: [],
        },
      ],
    },
  ],
  animations: [],
  parts: [{ kind: "part", label: "arm", ref: "root/arm" }],
  materials: [],
  morphs: [],
  lights: [],
  cameras: [],
  objectDetailsByPath: {},
  materialDetailsByName: {},
};

test("flattenVisibleHierarchy respects expansion", () => {
  const collapsed = flattenVisibleHierarchy(
    extraction.sceneTree,
    new Set<string>(),
    "",
    "all",
    extraction,
  );
  assert.equal(collapsed.length, 1);

  const expanded = flattenVisibleHierarchy(
    extraction.sceneTree,
    new Set(["root"]),
    "",
    "all",
    extraction,
  );
  assert.equal(expanded.length, 2);
  assert.equal(expanded[1]?.path, "root/arm");
});

test("buildDefaultExpandedPaths expands shallow nodes", () => {
  const paths = buildDefaultExpandedPaths(extraction.sceneTree, 2);
  assert.ok(paths.has("root"));
});

test("parentScenePath returns parent segment", () => {
  assert.equal(parentScenePath("root/arm"), "root");
  assert.equal(parentScenePath("root"), null);
});

test("collectAllExpandablePaths includes every branch with children", () => {
  const paths = collectAllExpandablePaths(extraction.sceneTree);
  assert.ok(paths.has("root"));
  assert.equal(paths.size, 1);
});
