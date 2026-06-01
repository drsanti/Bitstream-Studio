import assert from "node:assert/strict";
import test from "node:test";

import {
  compareOperationGlyph,
  COMPARE_OPERATION_PICKER_ORDER,
} from "../../src/webview/sensor-studio/features/editor/nodes/math/compare-operation-display";

test("compareOperationGlyph maps operators to compact symbols", () => {
  assert.equal(compareOperationGlyph(">"), ">");
  assert.equal(compareOperationGlyph(">="), "≥");
  assert.equal(compareOperationGlyph("<="), "≤");
  assert.equal(compareOperationGlyph("=="), "==");
  assert.equal(compareOperationGlyph("!="), "≠");
});

test("COMPARE_OPERATION_PICKER_ORDER lists all six operators", () => {
  assert.equal(COMPARE_OPERATION_PICKER_ORDER.length, 6);
});
