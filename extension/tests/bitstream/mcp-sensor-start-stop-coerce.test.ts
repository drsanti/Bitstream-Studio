import assert from "node:assert/strict";
import test from "node:test";
import { coerceEnabledBoolean } from "../../src/bitstream/mcp-server/tools/sensor-start-stop-set";

test("coerceEnabledBoolean accepts booleans", () => {
  assert.equal(coerceEnabledBoolean(true), true);
  assert.equal(coerceEnabledBoolean(false), false);
});

test("coerceEnabledBoolean accepts 0/1", () => {
  assert.equal(coerceEnabledBoolean(1), true);
  assert.equal(coerceEnabledBoolean(0), false);
  assert.equal(coerceEnabledBoolean(2), null);
});

test("coerceEnabledBoolean accepts common LLM string forms", () => {
  assert.equal(coerceEnabledBoolean("false"), false);
  assert.equal(coerceEnabledBoolean("FALSE"), false);
  assert.equal(coerceEnabledBoolean("true"), true);
  assert.equal(coerceEnabledBoolean("off"), false);
  assert.equal(coerceEnabledBoolean("on"), true);
  assert.equal(coerceEnabledBoolean("maybe"), null);
});
