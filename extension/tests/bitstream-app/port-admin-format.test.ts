import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPortAdminHandshakeLabel,
  formatPortAdminRefreshAge,
} from "../../src/webview/bitstream-app/system-tools/portAdminFormat.js";

test("formatPortAdminRefreshAge", () => {
  const now = 100_000;
  assert.equal(formatPortAdminRefreshAge(null, now), "not refreshed");
  assert.equal(formatPortAdminRefreshAge(now - 2000, now), "just now");
  assert.equal(formatPortAdminRefreshAge(now - 12_000, now), "12s ago");
  assert.equal(formatPortAdminRefreshAge(now - 90_000, now), "1m ago");
});

test("formatPortAdminHandshakeLabel", () => {
  assert.equal(formatPortAdminHandshakeLabel("passed"), "passed");
  assert.equal(formatPortAdminHandshakeLabel("unknown"), "—");
});
