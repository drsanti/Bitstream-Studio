import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectGlbMaterialTextureDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import {
  mergeGlbMaterialTextureDriveRow,
  readGlbMaterialTextureSlot,
  readGlbMaterialTextureUrl,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-material-texture";

describe("studio-glb-material-texture helpers", () => {
  it("readGlbMaterialTextureSlot defaults to map", () => {
    assert.equal(readGlbMaterialTextureSlot({}), "map");
  });

  it("readGlbMaterialTextureUrl prefers liveValue over config", () => {
    assert.equal(
      readGlbMaterialTextureUrl({ textureUrl: "https://a/x.jpg" }, "https://b/y.jpg"),
      "https://b/y.jpg",
    );
  });

  it("mergeGlbMaterialTextureDriveRow merges slots per material", () => {
    const row = mergeGlbMaterialTextureDriveRow(undefined, "map", "https://a/map.jpg");
    const merged = mergeGlbMaterialTextureDriveRow(row, "normalMap", "https://a/n.jpg");
    assert.deepEqual(merged, {
      map: "https://a/map.jpg",
      normalMap: "https://a/n.jpg",
    });
  });
});

describe("collectGlbMaterialTextureDrivesForModel", () => {
  it("collects texture URL drives linked to the same model", () => {
    const nodes = [
      {
        id: "model-1",
        data: { nodeId: "model-select", defaultConfig: {} },
      },
      {
        id: "tex-1",
        data: {
          nodeId: "glb-material-texture",
          defaultConfig: {
            sourceModelNodeId: "model-1",
            glbExtractKind: "material",
            glbExtractRef: "robot_base",
            glbMaterialTextureSlot: "map",
            textureUrl: "https://example.com/albedo.jpg",
          },
          liveValue: undefined,
        },
      },
    ] as const;

    const drives = collectGlbMaterialTextureDrivesForModel(nodes, "model-1");
    assert.deepEqual(drives, {
      robot_base: { map: "https://example.com/albedo.jpg" },
    });
  });
});
