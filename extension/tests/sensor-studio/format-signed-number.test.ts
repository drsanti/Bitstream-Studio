import assert from "node:assert/strict";
import test from "node:test";

import { formatSignedFixed } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/readings/format-signed-number";

test("formatSignedFixed prefixes finite positive values with +", () => {
  assert.equal(formatSignedFixed(0.77, 2), "+0.77");
  assert.equal(formatSignedFixed(1, 0), "+1");
});

test("formatSignedFixed keeps negative sign from toFixed", () => {
  assert.equal(formatSignedFixed(-1.39, 2), "-1.39");
});

test("formatSignedFixed shows zero without leading +", () => {
  assert.equal(formatSignedFixed(0, 2), "0.00");
  assert.equal(formatSignedFixed(-0, 3), "0.000");
});

test("formatSignedFixed returns em dash for non-finite numbers", () => {
  assert.equal(formatSignedFixed(Number.NaN, 2), "—");
  assert.equal(formatSignedFixed(Number.POSITIVE_INFINITY, 2), "—");
  assert.equal(formatSignedFixed(Number.NEGATIVE_INFINITY, 2), "—");
});
