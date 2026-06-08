import assert from "node:assert/strict";
import test from "node:test";

import {
  EXTRACT_LIST_SECTION_KEYS,
  extractListRowKey,
  flattenExtractListRows,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-extract-list-nav";
import type { StudioGltfExtractRow } from "../../src/webview/sensor-studio/features/editor/gltf/studio-gltf-extract";

const animRow: StudioGltfExtractRow = {
  kind: "animation",
  label: "hover",
  ref: "hover",
};

const partRow: StudioGltfExtractRow = {
  kind: "part",
  label: "rotor_a",
  ref: "root/rotor_a",
};

test("flattenExtractListRows preserves section order", () => {
  const filtered = {
    animations: [animRow],
    parts: [partRow],
    materials: [],
    morphs: [],
    lights: [],
    cameras: [],
  };
  const flat = flattenExtractListRows(filtered);
  assert.deepEqual(
    flat.map((row) => row.kind),
    ["animation", "part"],
  );
  assert.deepEqual(EXTRACT_LIST_SECTION_KEYS, [
    "animations",
    "parts",
    "materials",
    "morphs",
    "lights",
    "cameras",
  ]);
});

test("extractListRowKey matches studioGlbExtractRowKey", () => {
  assert.equal(extractListRowKey(animRow), "animation:hover");
});
