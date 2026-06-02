import assert from "node:assert/strict";
import test from "node:test";
import { isTwinTagVisibleForFilter } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-tag-filter.js";

test("isTwinTagVisibleForFilter all and hidden", () => {
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "all",
      health: "ok",
      componentId: "motor-fl",
      selectedComponentId: null,
    }),
    true,
  );
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "hidden",
      health: "error",
      componentId: "motor-fl",
      selectedComponentId: null,
    }),
    false,
  );
});

test("isTwinTagVisibleForFilter severity modes keep selected subsystem", () => {
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "issues",
      health: "ok",
      componentId: "motor-fl",
      selectedComponentId: "motor-fl",
    }),
    true,
  );
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "warnings",
      health: "caution",
      componentId: "motor-fr",
      selectedComponentId: null,
    }),
    false,
  );
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "warnings",
      health: "warning",
      componentId: "motor-fr",
      selectedComponentId: null,
    }),
    true,
  );
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "errors",
      health: "warning",
      componentId: "motor-fr",
      selectedComponentId: null,
    }),
    false,
  );
  assert.equal(
    isTwinTagVisibleForFilter({
      filterMode: "errors",
      health: "error",
      componentId: "motor-fr",
      selectedComponentId: null,
    }),
    true,
  );
});
