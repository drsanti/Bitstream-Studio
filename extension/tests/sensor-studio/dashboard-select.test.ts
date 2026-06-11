import assert from "node:assert/strict";
import { test } from "node:test";
import {
  coerceDashboardSelectOptions,
  readDashboardSelectValue,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-select-options";

test("coerceDashboardSelectOptions falls back to defaults", () => {
  const options = coerceDashboardSelectOptions(undefined);
  assert.equal(options.length, 3);
  assert.equal(options[0]?.value, "off");
});

test("readDashboardSelectValue uses configured value when valid", () => {
  const options = coerceDashboardSelectOptions([
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ]);
  assert.equal(readDashboardSelectValue({ value: "b" }, options), "b");
  assert.equal(readDashboardSelectValue({ value: "missing" }, options), "a");
});
