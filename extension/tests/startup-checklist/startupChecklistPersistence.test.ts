import assert from "node:assert/strict";
import test from "node:test";
import {
  isStartupChecklistMarkedComplete,
  readStartupChecklistCompletedVersion,
  STARTUP_CHECKLIST_VERSION,
} from "../../src/webview/startup-checklist/startupChecklistPersistence.js";

test("startup checklist version gates completion skip", () => {
  assert.equal(STARTUP_CHECKLIST_VERSION, 2);
  assert.equal(readStartupChecklistCompletedVersion(), 0);
  assert.equal(isStartupChecklistMarkedComplete(), false);
});
