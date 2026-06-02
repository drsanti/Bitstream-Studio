import assert from "node:assert/strict";
import test from "node:test";
import {
  areAllStartupStepsChecked,
  canCloseSetupOverlay,
  isStartupStepCheckSettled,
  shouldShowStartupRecheckButton,
  shouldShowStartupStepActions,
} from "../../src/webview/startup-checklist/startupChecklistCompletion.js";
import type { StartupChecklistStepView } from "../../src/webview/startup-checklist/useStartupChecklist.js";

function step(
  id: StartupChecklistStepView["id"],
  status: StartupChecklistStepView["status"],
): StartupChecklistStepView {
  return { id, status, result: "—", progressPercent: null };
}

test("shouldShowStartupStepActions is true for warn and fail only", () => {
  assert.equal(shouldShowStartupStepActions("fail"), true);
  assert.equal(shouldShowStartupStepActions("warn"), true);
  assert.equal(shouldShowStartupStepActions("ok"), false);
  assert.equal(shouldShowStartupStepActions("active"), false);
});

test("isStartupStepCheckSettled accepts ok, warn, fail only", () => {
  assert.equal(isStartupStepCheckSettled("ok"), true);
  assert.equal(isStartupStepCheckSettled("warn"), true);
  assert.equal(isStartupStepCheckSettled("fail"), true);
  assert.equal(isStartupStepCheckSettled("active"), false);
  assert.equal(isStartupStepCheckSettled("pending"), false);
  assert.equal(isStartupStepCheckSettled("locked"), false);
});

test("shouldShowStartupRecheckButton hides during walkthrough, shows after", () => {
  assert.equal(
    shouldShowStartupRecheckButton({ isSequentialActive: true, walkthroughComplete: false }),
    false,
  );
  assert.equal(
    shouldShowStartupRecheckButton({ isSequentialActive: true, walkthroughComplete: true }),
    true,
  );
  assert.equal(
    shouldShowStartupRecheckButton({ isSequentialActive: false, walkthroughComplete: false }),
    true,
  );
});

test("canCloseSetupOverlay requires walkthrough complete only", () => {
  const steps = [step("assets", "ok"), step("network", "warn")];
  assert.equal(canCloseSetupOverlay(steps, { walkthroughComplete: false }), false);
  assert.equal(canCloseSetupOverlay(steps, { walkthroughComplete: true }), true);
  assert.equal(
    canCloseSetupOverlay([...steps, step("mode", "active"), step("bridge", "locked")], {
      walkthroughComplete: true,
    }),
    true,
  );
  assert.equal(areAllStartupStepsChecked([step("bridge", "fail")]), true);
  assert.equal(areAllStartupStepsChecked([step("bridge", "active")]), false);
});
