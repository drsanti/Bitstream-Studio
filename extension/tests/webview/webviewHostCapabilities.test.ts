import assert from "node:assert/strict";
import test from "node:test";

test("webviewHostCapabilities module exports capability helpers", async () => {
  const mod = await import("../../src/webview/webviewHostCapabilities.js");
  assert.equal(typeof mod.canUseHostedAssetBootstrap, "function");
  assert.equal(typeof mod.shouldBlockShellUntilAssetsReady, "function");
  assert.equal(typeof mod.canOpenAppInSystemBrowser, "function");
});
