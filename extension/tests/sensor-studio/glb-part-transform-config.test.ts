import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readGlbPartTransformFromConfig,
  readGlbPartTransformPath,
} from "../../src/webview/sensor-studio/features/editor/nodes/scene/glb-part-transform-config.ts";
import { collectGlbPartTransformDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives.ts";

describe("glb-part-transform-config", () => {
  it("reads part path and transform from node config", () => {
    const cfg = {
      sourceModelNodeId: "ms-1",
      glbExtractRef: "Rotor/Blade",
      version: 1,
      position: { x: 1, y: 2, z: 3 },
      rotationDeg: { x: 0, y: 90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
    assert.equal(readGlbPartTransformPath(cfg), "Rotor/Blade");
    const xf = readGlbPartTransformFromConfig(cfg);
    assert.equal(xf.position.x, 1);
    assert.equal(xf.rotationDeg.y, 90);
  });

  it("collects scoped part transforms for a model", () => {
    const nodes = [
      {
        id: "ms-1",
        data: {
          nodeId: "model-select",
          defaultConfig: {},
        },
      },
      {
        id: "pt-1",
        data: {
          nodeId: "glb-part-transform",
          defaultConfig: {
            sourceModelNodeId: "ms-1",
            glbExtractRef: "A/B",
            version: 1,
            position: { x: 0, y: 1, z: 0 },
            rotationDeg: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
      },
    ];
    const drives = collectGlbPartTransformDrivesForModel(nodes, "ms-1", []);
    assert.equal(Object.keys(drives).length, 1);
    assert.equal(drives["A/B"]?.position.y, 1);
  });
});
