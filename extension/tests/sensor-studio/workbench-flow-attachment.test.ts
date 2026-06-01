import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "../../src/webview/sensor-studio/features/editor/workbench/default-studio-workbench-layout";
import {
  coerceWorkbenchFlowAttachment,
  createWorkbenchFlowAttachment,
} from "../../src/webview/ui/workbench/workbench-flow-attachment";
import { createWorkbenchLayoutSnapshotFromCurrent } from "../../src/webview/ui/workbench/workbench-layout-library";

describe("workbench flow attachment", () => {
  it("round-trips a layout snapshot in flow export envelope", () => {
    const snapshot = createWorkbenchLayoutSnapshotFromCurrent({
      appId: "sensor-studio",
      name: "Flow export",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      dockMemory: { "flow|inspector|left": 0.58 },
    });
    const attachment = createWorkbenchFlowAttachment(snapshot);
    const json = JSON.stringify(attachment);
    const parsed = coerceWorkbenchFlowAttachment(JSON.parse(json));
    assert.ok(parsed);
    assert.equal(parsed?.appId, "sensor-studio");
    assert.deepEqual(parsed?.snapshot.dockMemory, attachment.snapshot.dockMemory);
  });

  it("rejects attachments with mismatched app ids", () => {
    const bad = {
      version: 1,
      appId: "sensor-studio",
      snapshot: {
        version: 1,
        id: "x",
        name: "Bad",
        appId: "other-app",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: "user",
        layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      },
    };
    assert.equal(coerceWorkbenchFlowAttachment(bad), null);
  });
});
