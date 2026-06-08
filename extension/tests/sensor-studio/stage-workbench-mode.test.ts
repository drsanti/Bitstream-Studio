import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isStageEditMode,
  isStageSimulateMode,
  shouldRefreshStageSnapshotAfterTick,
} from "../../src/webview/sensor-studio/core/stage/stage-workbench-mode.ts";

describe("stage-workbench-mode", () => {
  it("identifies edit and simulate modes", () => {
    assert.equal(isStageEditMode("edit"), true);
    assert.equal(isStageEditMode("simulate"), false);
    assert.equal(isStageSimulateMode("simulate"), true);
    assert.equal(isStageSimulateMode("edit"), false);
  });

  it("always refreshes in simulate mode", () => {
    assert.equal(
      shouldRefreshStageSnapshotAfterTick({
        workbenchMode: "simulate",
        snapshotHasSceneOutput: true,
      }),
      true,
    );
  });

  it("forces refresh when requested", () => {
    assert.equal(
      shouldRefreshStageSnapshotAfterTick({
        workbenchMode: "edit",
        forceStageSnapshot: true,
        snapshotHasSceneOutput: true,
      }),
      true,
    );
  });

  it("freezes passive ticks in edit mode after first scene commit", () => {
    assert.equal(
      shouldRefreshStageSnapshotAfterTick({
        workbenchMode: "edit",
        snapshotHasSceneOutput: true,
      }),
      false,
    );
  });

  it("allows first snapshot populate in edit mode", () => {
    assert.equal(
      shouldRefreshStageSnapshotAfterTick({
        workbenchMode: "edit",
        snapshotHasSceneOutput: false,
      }),
      true,
    );
  });
});
