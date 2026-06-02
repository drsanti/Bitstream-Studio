import assert from "node:assert/strict";
import test from "node:test";

import type { NodeCatalogEntry } from "../../src/webview/sensor-studio/core/config/config-types";
import { VECTOR_QUATERNION_MATH_CATALOG_ENTRIES } from "../../src/webview/sensor-studio/config/vector-quaternion-math-catalog.entries";
import { filterPaletteEntries } from "../../src/webview/sensor-studio/features/editor/components/node-palette/filter-palette-entries";

const scalarLerpEntry: NodeCatalogEntry = {
  id: "lerp",
  category: "utility",
  title: "Scalar Lerp",
  description: "Scalar linear interpolation.",
  icon: "blend",
  defaultVisible: true,
  defaultConfig: {},
  inputPorts: [],
  outputPorts: [],
};

test('search "scalar" matches Scalar Lerp (id lerp)', () => {
  const hits = filterPaletteEntries([scalarLerpEntry], "scalar");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.id, "lerp");
});

test('search "slerp" matches Vector Lerp and Quaternion Slerp', () => {
  const hits = filterPaletteEntries(VECTOR_QUATERNION_MATH_CATALOG_ENTRIES, "slerp");
  const ids = new Set(hits.map((e) => e.id));
  assert.equal(ids.has("vector-lerp"), true);
  assert.equal(ids.has("quaternion-slerp"), true);
});
