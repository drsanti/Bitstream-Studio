import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isStageSceneMaterialQuickEditEligible,
  resolveStageSceneMaterialWriteTarget,
  resolveStageSceneMaterialWriteTargetForSelection,
} from "../../src/webview/sensor-studio/core/stage/stage-scene-material-write.ts";
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

describe("stage-scene-material-write", () => {
  it("resolves wired mesh-material-standard upstream of mesh-box", () => {
    const nodes = [
      studioNode("mat-1", "mesh-material-standard", { meshMaterialColorHex: "#ff0000" }),
      studioNode("mesh-1", "mesh-box"),
    ];
    const edges = [
      {
        id: "e1",
        source: "mat-1",
        target: "mesh-1",
        targetHandle: "material",
      },
    ];
    const target = resolveStageSceneMaterialWriteTarget({
      meshFlowNodeId: "mesh-1",
      nodes,
      edges,
    });
    assert.deepEqual(target, {
      materialNodeId: "mat-1",
      catalogNodeId: "mesh-material-standard",
      kind: "standard",
      label: "mesh-material-standard",
    });
  });

  it("returns null when material is unwired", () => {
    const nodes = [studioNode("mesh-2", "mesh-sphere")];
    assert.equal(
      resolveStageSceneMaterialWriteTarget({
        meshFlowNodeId: "mesh-2",
        nodes,
        edges: [],
      }),
      null,
    );
  });

  it("isStageSceneMaterialQuickEditEligible requires procedural + wired material", () => {
    const nodes = [
      studioNode("mat-1", "mesh-material-basic"),
      studioNode("box-1", "mesh-box"),
      studioNode("grp-1", "mesh-group"),
    ];
    const edges = [
      { id: "e1", source: "mat-1", target: "box-1", targetHandle: "material" },
    ];
    assert.equal(
      isStageSceneMaterialQuickEditEligible(
        {
          kind: "procedural",
          sourceNodeId: "box-1",
          objectPath: "proc:box-1",
          modelIndex: 0,
        },
        nodes,
        edges,
      ),
      true,
    );
    assert.equal(
      isStageSceneMaterialQuickEditEligible(
        {
          kind: "glb-instance",
          sourceNodeId: "model-1",
          objectPath: "Armature",
          modelIndex: 0,
        },
        nodes,
        edges,
      ),
      false,
    );
    assert.equal(
      isStageSceneMaterialQuickEditEligible(
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
  });

  it("resolves mesh bundle leaf to wired mesh material", () => {
    const nodes = [
      studioNode("mat-1", "mesh-material-standard"),
      studioNode("box-1", "mesh-box"),
      studioNode("grp-1", "mesh-group", { meshInputCount: 2 }),
    ];
    const edges = [
      { id: "e1", source: "mat-1", target: "box-1", targetHandle: "material" },
      { id: "e2", source: "box-1", target: "grp-1", targetHandle: "a" },
    ];
    assert.deepEqual(
      resolveStageSceneMaterialWriteTargetForSelection({
        selection: {
          kind: "procedural",
          sourceNodeId: "grp-1",
          objectPath: "proc:grp-1:0",
          modelIndex: 0,
          meshLeafIndex: 0,
        },
        nodes,
        edges,
      }),
      {
        materialNodeId: "mat-1",
        catalogNodeId: "mesh-material-standard",
        kind: "standard",
        label: "mesh-material-standard",
      },
    );
  });
});
