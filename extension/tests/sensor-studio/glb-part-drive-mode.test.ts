import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readGlbPartDriveMode,
  readGlbPartDriveScalar,
  STUDIO_GLB_PART_DRIVE_MODE_KEY,
} from "../../src/webview/sensor-studio/features/editor/nodes/events/glb-part-event-config";
import { collectGlbScalarDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";

test("readGlbPartDriveScalar visibility mode binarizes fractional values", () => {
  const cfg = { value: 0.25, [STUDIO_GLB_PART_DRIVE_MODE_KEY]: "visibility" };
  assert.equal(readGlbPartDriveMode(cfg), "visibility");
  assert.equal(readGlbPartDriveScalar(cfg), 0);
  assert.equal(readGlbPartDriveScalar({ ...cfg, value: 0.75 }), 1);
});

test("readGlbPartDriveScalar opacity mode passes through 0–1", () => {
  const cfg = { value: 0.35, [STUDIO_GLB_PART_DRIVE_MODE_KEY]: "opacity" };
  assert.equal(readGlbPartDriveScalar(cfg), 0.35);
  assert.equal(readGlbPartDriveScalar({ ...cfg, value: 1.5 }), 1);
  assert.equal(readGlbPartDriveScalar({ ...cfg, value: -0.2 }), 0);
});

test("collectGlbScalarDrivesForModel respects part opacity mode on number-constant", () => {
  const modelId = "model-1";
  const nodes = [
    {
      id: "n1",
      data: {
        nodeId: "number-constant",
        defaultConfig: {
          value: 0.4,
          glbExtractKind: "part",
          glbExtractRef: "Body/Mesh",
          sourceModelNodeId: modelId,
          [STUDIO_GLB_PART_DRIVE_MODE_KEY]: "opacity",
        },
      },
    },
  ];
  const drives = collectGlbScalarDrivesForModel(nodes, modelId);
  assert.equal(drives.parts["Body/Mesh"], 0.4);
});
