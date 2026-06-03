import { describe, expect, test } from "vitest";
import {
  STAGE_DEFAULT_ENVIRONMENT_ASSET_ID,
  stageSceneOutputDefaultScene3d,
} from "../../src/webview/sensor-studio/core/stage/stage-scene-defaults";
import { defaultScene3DConfig } from "../../src/webview/sensor-studio/core/scene3d/scene3d-config";
import {
  buildStagePreviewSceneProps,
  evaluateStageSceneSnapshot,
  graphHasSceneOutputNode,
  SCENE_OUTPUT_NODE_ID,
} from "../../src/webview/sensor-studio/core/stage/evaluate-stage-scene-snapshot";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";

function makeNode(
  id: string,
  nodeId: string,
  extra: Partial<FlowGraphNode["data"]> = {},
): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      defaultConfig: {},
      ...extra,
    },
  } as FlowGraphNode;
}

describe("evaluateStageSceneSnapshot", () => {
  test("empty graph returns default snapshot", () => {
    const snap = evaluateStageSceneSnapshot({ nodes: [], edges: [] });
    expect(snap.sceneOutputNodeId).toBeNull();
    expect(snap.models).toHaveLength(0);
    expect(snap.physicsWire).toBeNull();
  });

  test("keeps baked scene3d.model when no Models wire is connected", () => {
    const baked = stageSceneOutputDefaultScene3d();
    baked.model.url = "models/custom/baked.glb";
    const output = makeNode("out-1", SCENE_OUTPUT_NODE_ID, {
      defaultConfig: { showGrid: false, scene3d: baked },
    });
    const snap = evaluateStageSceneSnapshot({ nodes: [output], edges: [] });
    expect(snap.models).toHaveLength(0);
    expect(snap.scene3d.model.url).toBe("models/custom/baked.glb");
  });

  test("collects model wires into snapshot", () => {
    const output = makeNode("out-1", SCENE_OUTPUT_NODE_ID, {
      defaultConfig: { showGrid: false },
    });
    const model = makeNode("model-1", "model-select", {
      defaultConfig: { selectedModelUrl: "https://example.com/a.glb" },
    });
    const snap = evaluateStageSceneSnapshot({
      nodes: [output, model],
      edges: [
        {
          id: "e1",
          source: "model-1",
          target: "out-1",
          sourceHandle: "out",
          targetHandle: "models",
        },
      ],
    });
    expect(snap.sceneOutputNodeId).toBe("out-1");
    expect(snap.models).toHaveLength(1);
    expect(snap.models[0]!.modelUrl).toBe("https://example.com/a.glb");
    expect(snap.showGrid).toBe(false);
    expect(snap.scene3d.model.url).toBe("https://example.com/a.glb");
    expect(snap.scene3d.helpers.grid.enabled).toBe(false);
  });

  test("syncs studioAssetId from wired model-select (avoids stale baked id)", () => {
    const baked = stageSceneOutputDefaultScene3d();
    baked.model.studioAssetId = "model.plc-traninig-kit";
    baked.model.url = "models/plc-traninig-kit/plc-traninig-kit.glb";
    const output = makeNode("out-1", SCENE_OUTPUT_NODE_ID, {
      defaultConfig: { showGrid: false, scene3d: baked },
    });
    const model = makeNode("model-1", "model-select", {
      defaultConfig: {
        selectedStudioAssetId: "model.tesa-drone",
        selectedModelUrl: "https://example.com/tesa-drone.glb",
      },
    });
    const snap = evaluateStageSceneSnapshot({
      nodes: [output, model],
      edges: [
        {
          id: "e1",
          source: "model-1",
          target: "out-1",
          sourceHandle: "out",
          targetHandle: "models",
        },
      ],
    });
    expect(snap.models[0]!.studioAssetId).toBe("model.tesa-drone");
    expect(snap.scene3d.model.url).toBe("https://example.com/tesa-drone.glb");
    expect(snap.scene3d.model.studioAssetId).toBe("model.tesa-drone");
    const built = buildStagePreviewSceneProps(snap);
    expect(built.stageModelInstances[0]!.studioAssetId).toBe("model.tesa-drone");
    expect(built.scene3d.model.studioAssetId).toBe("model.tesa-drone");
  });

  test("syncs helpers.grid.enabled from showGrid and upgrades legacy cubemap to Park", () => {
    const scene3d = defaultScene3DConfig();
    scene3d.helpers.grid.enabled = true;
    scene3d.environment.studioAssetId = "env.cubemap.yokohama";
    const output = makeNode("out-1", SCENE_OUTPUT_NODE_ID, {
      defaultConfig: { showGrid: false, scene3d },
      liveEnvironmentWire: {
        version: 1,
        presetIndex: 0,
        studioAssetId: "env.cubemap.yokohama",
        showBackgroundTexture: true,
        useCubemapIbl: true,
        iblStrength: 1,
        iblOffStrengthFrac: 0.45,
        yawDeg: 0,
        backgroundColorHex: "#09090b",
      },
    });
    const model = makeNode("model-1", "model-select", {
      defaultConfig: { selectedModelUrl: "https://example.com/a.glb" },
    });
    const snap = evaluateStageSceneSnapshot({
      nodes: [output, model],
      edges: [
        {
          id: "e1",
          source: "model-1",
          target: "out-1",
          sourceHandle: "out",
          targetHandle: "models",
        },
      ],
    });
    expect(snap.scene3d.helpers.grid.enabled).toBe(false);
    expect(snap.scene3d.environment.studioAssetId).toBe(STAGE_DEFAULT_ENVIRONMENT_ASSET_ID);
    const built = buildStagePreviewSceneProps(snap);
    expect(built.scene3d.helpers.grid.enabled).toBe(false);
    expect(built.scene3d.environment.studioAssetId).toBe(STAGE_DEFAULT_ENVIRONMENT_ASSET_ID);
  });

  test("ignores model-viewer scene3d when only scene-output drives Stage", () => {
    const viewerScene = defaultScene3DConfig();
    viewerScene.helpers.grid.enabled = true;
    viewerScene.environment.studioAssetId = "env.cubemap.yokohama";
    const output = makeNode("out-1", SCENE_OUTPUT_NODE_ID, {
      defaultConfig: {
        showGrid: false,
        scene3d: stageSceneOutputDefaultScene3d(),
      },
    });
    const viewer = makeNode("mv-1", "model-viewer", {
      defaultConfig: { showGrid: true, scene3d: viewerScene },
    });
    const model = makeNode("model-1", "model-select", {
      defaultConfig: { selectedModelUrl: "https://example.com/stage.glb" },
    });
    const snap = evaluateStageSceneSnapshot({
      nodes: [output, viewer, model],
      edges: [
        {
          id: "e1",
          source: "model-1",
          target: "out-1",
          sourceHandle: "out",
          targetHandle: "models",
        },
      ],
    });
    expect(snap.scene3d.model.url).toBe("https://example.com/stage.glb");
    expect(snap.scene3d.helpers.grid.enabled).toBe(false);
    expect(snap.scene3d.environment.studioAssetId).toBe(STAGE_DEFAULT_ENVIRONMENT_ASSET_ID);
  });

  test("buildStagePreviewSceneProps respects primaryModelIndex", () => {
    const output = makeNode("out-1", SCENE_OUTPUT_NODE_ID, {
      defaultConfig: {
        showGrid: false,
        scene3d: stageSceneOutputDefaultScene3d(),
      },
    });
    const modelA = makeNode("model-a", "model-select", {
      defaultConfig: { selectedModelUrl: "https://example.com/a.glb" },
      label: "Drone A",
    });
    const modelB = makeNode("model-b", "model-select", {
      defaultConfig: { selectedModelUrl: "https://example.com/b.glb" },
      label: "Drone B",
    });
    const snap = evaluateStageSceneSnapshot({
      nodes: [output, modelA, modelB],
      edges: [
        {
          id: "e1",
          source: "model-a",
          target: "out-1",
          sourceHandle: "out",
          targetHandle: "models",
        },
        {
          id: "e2",
          source: "model-b",
          target: "out-1",
          sourceHandle: "out",
          targetHandle: "models",
        },
      ],
    });
    expect(snap.models).toHaveLength(2);
    expect(buildStagePreviewSceneProps(snap, 0).previewMeshGlbUrl).toBe(
      "https://example.com/a.glb",
    );
    expect(buildStagePreviewSceneProps(snap, 1).previewMeshGlbUrl).toBe(
      "https://example.com/b.glb",
    );
    expect(buildStagePreviewSceneProps(snap).stageModelInstances).toHaveLength(2);
    expect(buildStagePreviewSceneProps(snap, 1).stagePrimaryModelIndex).toBe(1);
  });

  test("graphHasSceneOutputNode", () => {
    expect(graphHasSceneOutputNode([makeNode("a", "plotter")])).toBe(false);
    expect(graphHasSceneOutputNode([makeNode("b", SCENE_OUTPUT_NODE_ID)])).toBe(true);
  });
});
