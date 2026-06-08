import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDeleteStageSceneSelection,
  resolveStageSceneDeletionNodeIds,
} from "../../src/webview/sensor-studio/core/stage/stage-scene-selection-delete.ts";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types.ts";

function studioNode(
  id: string,
  nodeId: string,
  defaultConfig: Record<string, unknown> = {},
): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      defaultConfig,
      inputPorts: [],
      outputPorts: [],
    },
  } as FlowGraphNode;
}

describe("stage-scene-selection-delete", () => {
  it("deletes procedural mesh source node", () => {
    const nodes = [studioNode("box-1", "mesh-box")];
    const ids = resolveStageSceneDeletionNodeIds({
      selection: {
        kind: "procedural",
        sourceNodeId: "box-1",
        objectPath: "proc:box-1",
        modelIndex: 0,
      },
      nodes,
      edges: [],
    });
    assert.deepEqual(ids, ["box-1"]);
  });

  it("deletes glb-part-transform when present", () => {
    const nodes = [
      studioNode("ms-1", "model-select"),
      studioNode("pt-1", "glb-part-transform", {
        sourceModelNodeId: "ms-1",
        glbExtractRef: "Body",
      }),
    ];
    const ids = resolveStageSceneDeletionNodeIds({
      selection: {
        kind: "glb-instance",
        sourceNodeId: "ms-1",
        objectPath: "Body",
        modelIndex: 0,
      },
      nodes,
      edges: [],
    });
    assert.deepEqual(ids, ["pt-1"]);
  });

  it("reports not deletable when GLB part has no transform node", () => {
    const nodes = [studioNode("ms-1", "model-select")];
    assert.equal(
      canDeleteStageSceneSelection({
        selection: {
          kind: "glb-instance",
          sourceNodeId: "ms-1",
          objectPath: "Body",
          modelIndex: 0,
        },
        nodes,
        edges: [],
      }),
      false,
    );
  });
});
