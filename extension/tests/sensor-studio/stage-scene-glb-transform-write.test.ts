import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findGlbPartTransformNodeId,
  isGlbInstanceStageGizmoEligible,
  isGlbPartPathEligibleForStageGizmo,
} from "../../src/webview/sensor-studio/core/stage/stage-scene-glb-transform-write.ts";
import {
  isStageSceneGizmoEligible,
  resolveStageSceneTransformWriteTargetForSelection,
} from "../../src/webview/sensor-studio/core/stage/stage-scene-transform-write.ts";
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

describe("stage-scene-glb-transform-write", () => {
  it("rejects procedural pick paths for GLB gizmo eligibility helper", () => {
    assert.equal(isGlbPartPathEligibleForStageGizmo("proc:mesh-1"), false);
    assert.equal(isGlbPartPathEligibleForStageGizmo("Armature/Hips"), true);
  });

  it("allows GLB instance gizmo when scoped to model-select", () => {
    const nodes = [studioNode("ms-1", "model-select")];
    const selection = {
      kind: "glb-instance" as const,
      sourceNodeId: "ms-1",
      objectPath: "Body/Head",
      modelIndex: 0,
    };
    assert.equal(isGlbInstanceStageGizmoEligible(selection, nodes, []), true);
    assert.equal(isStageSceneGizmoEligible(selection, nodes, []), true);
  });

  it("finds glb-part-transform node by model scope and part path", () => {
    const nodes = [
      studioNode("ms-1", "model-select"),
      studioNode("pt-1", "glb-part-transform", {
        sourceModelNodeId: "ms-1",
        glbExtractRef: "Body/Head",
        version: 1,
      }),
    ];
    const found = findGlbPartTransformNodeId({
      sourceModelNodeId: "ms-1",
      partPath: "Body/Head",
      nodes,
      edges: [],
    });
    assert.equal(found, "pt-1");
  });

  it("returns pending glb-part-transform target before node exists", () => {
    const nodes = [studioNode("ms-1", "model-select")];
    const target = resolveStageSceneTransformWriteTargetForSelection({
      selection: {
        kind: "glb-instance",
        sourceNodeId: "ms-1",
        objectPath: "Body/Head",
        modelIndex: 0,
      },
      nodes,
      edges: [],
    });
    assert.deepEqual(target, { kind: "glb-part-transform", nodeId: "__pending__" });
  });
});
