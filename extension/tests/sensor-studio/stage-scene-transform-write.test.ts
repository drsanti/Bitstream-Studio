import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isStageSceneGizmoEligible,
  resolveMeshGroupLeafMeshSourceNodeId,
  resolveStageSceneTransformWriteTarget,
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

describe("stage-scene-transform-write", () => {
  it("prefers wired object-transform over mesh embedded", () => {
    const nodes = [
      studioNode("mesh-1", "mesh-box"),
      studioNode("xf-1", "object-transform", { version: 1 }),
    ];
    const edges = [
      {
        id: "e1",
        source: "xf-1",
        target: "mesh-1",
        targetHandle: "transform",
      },
    ];
    const target = resolveStageSceneTransformWriteTarget({
      meshFlowNodeId: "mesh-1",
      nodes,
      edges,
    });
    assert.deepEqual(target, { kind: "object-transform", nodeId: "xf-1" });
  });

  it("falls back to mesh embedded when transform is unwired", () => {
    const nodes = [studioNode("mesh-2", "mesh-sphere")];
    const target = resolveStageSceneTransformWriteTarget({
      meshFlowNodeId: "mesh-2",
      nodes,
      edges: [],
    });
    assert.deepEqual(target, { kind: "mesh-embedded", nodeId: "mesh-2" });
  });

  it("allows mesh-group leaf gizmo when input wires a primitive mesh", () => {
    const nodes = [
      studioNode("grp-1", "mesh-group", { meshInputCount: 2 }),
      studioNode("box-1", "mesh-box"),
      studioNode("sphere-1", "mesh-sphere"),
    ];
    const edges = [
      {
        id: "e1",
        source: "box-1",
        target: "grp-1",
        targetHandle: "a",
      },
      {
        id: "e2",
        source: "sphere-1",
        target: "grp-1",
        targetHandle: "b",
      },
    ];
    assert.equal(
      resolveMeshGroupLeafMeshSourceNodeId({
        groupNodeId: "grp-1",
        leafIndex: 0,
        nodes,
        edges,
      }),
      "box-1",
    );
    assert.equal(
      isStageSceneGizmoEligible(
        {
          kind: "procedural",
          sourceNodeId: "grp-1",
          objectPath: "proc:grp-1:0",
          modelIndex: 0,
          meshLeafIndex: 0,
        },
        nodes,
        edges,
      ),
      true,
    );
    assert.deepEqual(
      resolveStageSceneTransformWriteTargetForSelection({
        selection: {
          kind: "procedural",
          sourceNodeId: "grp-1",
          objectPath: "proc:grp-1:1",
          modelIndex: 0,
          meshLeafIndex: 1,
        },
        nodes,
        edges,
      }),
      { kind: "mesh-embedded", nodeId: "sphere-1" },
    );
  });

  it("rejects unwired mesh-group leaves and glb selections for gizmo eligibility", () => {
    const nodes = [
      studioNode("grp-1", "mesh-group"),
      studioNode("box-1", "mesh-box"),
    ];
    assert.equal(
      isStageSceneGizmoEligible(
        {
          kind: "procedural",
          sourceNodeId: "grp-1",
          objectPath: "proc:grp-1:0",
          modelIndex: 0,
          meshLeafIndex: 0,
        },
        nodes,
        [],
      ),
      false,
    );
    assert.equal(
      isStageSceneGizmoEligible(
        {
          kind: "glb-instance",
          sourceNodeId: "model-1",
          objectPath: "Armature",
          modelIndex: 0,
        },
        nodes,
      ),
      false,
    );
    assert.equal(
      isStageSceneGizmoEligible(
        {
          kind: "procedural",
          sourceNodeId: "box-1",
          objectPath: "proc:box-1",
          modelIndex: 0,
        },
        nodes,
      ),
      true,
    );
  });
});
