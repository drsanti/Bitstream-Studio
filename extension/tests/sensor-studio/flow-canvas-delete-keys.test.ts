import assert from "node:assert/strict";
import test from "node:test";

import {
  FLOW_CANVAS_DELETE_KEY_CODES,
  FLOW_CANVAS_DELETE_KEY_HINT,
} from "../../src/webview/sensor-studio/features/editor/keyboard/flow-canvas-delete-keys";

test("flow canvas delete keys include Blender X and legacy Del", () => {
  assert.ok(FLOW_CANVAS_DELETE_KEY_CODES.includes("x"));
  assert.ok(FLOW_CANVAS_DELETE_KEY_CODES.includes("X"));
  assert.ok(FLOW_CANVAS_DELETE_KEY_CODES.includes("Delete"));
  assert.ok(FLOW_CANVAS_DELETE_KEY_CODES.includes("Backspace"));
  assert.equal(FLOW_CANVAS_DELETE_KEY_HINT, "X or Del");
});
