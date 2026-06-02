import assert from "node:assert/strict";
import test from "node:test";
import { resolveStartupPresentationMode } from "../../src/webview/startup-checklist/useStartupChecklistPresentation.js";

test("resolveStartupPresentationMode uses sequential for auto overlay", () => {
  assert.equal(
    resolveStartupPresentationMode({ userOpenedPanel: false, autoOverlay: true }),
    "sequential",
  );
});

test("resolveStartupPresentationMode uses instant when user opened panel", () => {
  assert.equal(
    resolveStartupPresentationMode({ userOpenedPanel: true, autoOverlay: true }),
    "instant",
  );
});
