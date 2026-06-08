import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluatePartSpinDrive,
  readPartSpinNodeConfig,
  readPartSpinPath,
} from "../../src/webview/sensor-studio/features/editor/nodes/scene/part-spin-config";
import { collectGlbPartSpinDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";

test("readPartSpinPath prefers glb extract tag", () => {
  assert.equal(
    readPartSpinPath({
      glbExtractKind: "part",
      glbExtractRef: "Root/Propeller_L",
    }),
    "Root/Propeller_L",
  );
});

test("evaluatePartSpinDrive applies reverse as negative speed", () => {
  const drive = evaluatePartSpinDrive({
    defaultConfig: {
      glbExtractKind: "part",
      glbExtractRef: "Rotor",
      spinAxis: "z",
      speedRadS: 4,
      reverse: true,
      enabled: true,
    },
  });
  assert.ok(drive != null);
  assert.equal(drive!.partPath, "Rotor");
  assert.equal(drive!.row.axis, "z");
  assert.equal(drive!.row.speedRadS, -4);
  assert.equal(drive!.row.enabled, true);
});

test("evaluatePartSpinDrive wired inputs override config", () => {
  const drive = evaluatePartSpinDrive({
    defaultConfig: {
      glbExtractKind: "part",
      glbExtractRef: "Belt",
      speedRadS: 1,
      enabled: true,
    },
    wired: {
      speedRadS: 12,
      enabled: false,
    },
  });
  assert.ok(drive != null);
  assert.equal(drive!.row.speedRadS, 12);
  assert.equal(drive!.row.enabled, false);
});

test("collectGlbPartSpinDrivesForModel scopes to model and last wins", () => {
  const nodes = [
    {
      id: "model-1",
      data: { nodeId: "model-select", defaultConfig: {} },
    },
    {
      id: "spin-a",
      data: {
        nodeId: "part-spin",
        defaultConfig: {
          sourceModelNodeId: "model-1",
          glbExtractKind: "part",
          glbExtractRef: "Prop",
          spinAxis: "y",
          speedRadS: 2,
          enabled: true,
        },
      },
    },
    {
      id: "spin-b",
      data: {
        nodeId: "part-spin",
        defaultConfig: {
          sourceModelNodeId: "model-1",
          glbExtractKind: "part",
          glbExtractRef: "Prop",
          spinAxis: "x",
          speedRadS: 5,
          enabled: true,
        },
      },
    },
    {
      id: "spin-other",
      data: {
        nodeId: "part-spin",
        defaultConfig: {
          sourceModelNodeId: "other-model",
          glbExtractKind: "part",
          glbExtractRef: "Other",
          speedRadS: 99,
        },
      },
    },
  ] as const;

  const spins = collectGlbPartSpinDrivesForModel(nodes, "model-1");
  assert.equal(Object.keys(spins).length, 1);
  assert.equal(spins.Prop?.axis, "x");
  assert.equal(spins.Prop?.speedRadS, 5);
  assert.equal(readPartSpinNodeConfig({}).partPath, "");
});
