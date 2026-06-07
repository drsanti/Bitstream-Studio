import assert from "node:assert/strict";
import test from "node:test";

import { buildFlowImportDependencyHint } from "../../src/webview/sensor-studio/features/editor/flow-library/build-flow-import-dependency-hint";
import type { StudioAssetDescriptor } from "../../src/webview/sensor-studio/features/asset-browser/studio-asset.types";

const CATALOG: StudioAssetDescriptor[] = [
  {
    id: "tesa-drone",
    name: "TESA Drone",
    category: "model",
    relativePath: "models/tesa-drone.glb",
  } as StudioAssetDescriptor,
];

test("buildFlowImportDependencyHint returns null when all models are known", () => {
  assert.equal(
    buildFlowImportDependencyHint(
      { modelUrls: ["models/tesa-drone.glb"], dataChannels: [] },
      CATALOG,
    ),
    null,
  );
});

test("buildFlowImportDependencyHint lists missing models", () => {
  const hint = buildFlowImportDependencyHint(
    { modelUrls: ["models/missing-robot.glb"], dataChannels: [] },
    CATALOG,
  );
  assert.notEqual(hint, null);
  assert.match(hint ?? "", /1 model/);
  assert.match(hint ?? "", /missing-robot\.glb/);
});

test("buildFlowImportDependencyHint mentions telemetry channels", () => {
  const hint = buildFlowImportDependencyHint(
    { modelUrls: [], dataChannels: ["imu.accel.z"] },
    CATALOG,
  );
  assert.notEqual(hint, null);
  assert.match(hint ?? "", /telemetry channel/);
});
