import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyGroupInterfaceToSubgraph,
  filterParentEdgesForGroupInterface,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-interface-sync";
import type { StudioGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";
import { defaultGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";

function makeSubgraph(iface: StudioGroupInterface) {
  const inputId = "group_input";
  const outputId = "group_output";
  const inSock = iface.inputs[0]!;
  const outSock = iface.outputs[0]!;
  return {
    nodes: [
      {
        id: inputId,
        type: "studio-group-input",
        position: { x: 0, y: 0 },
        data: { role: "input", interface: iface },
      },
      {
        id: outputId,
        type: "studio-group-output",
        position: { x: 200, y: 0 },
        data: { role: "output", interface: iface },
      },
      { id: "inner", type: "studio", position: { x: 100, y: 0 }, data: {} },
    ],
    edges: [
      {
        id: "e_in",
        source: inputId,
        sourceHandle: inSock.id,
        target: "inner",
        targetHandle: "in",
      },
      {
        id: "e_out",
        source: "inner",
        sourceHandle: "out",
        target: outputId,
        targetHandle: outSock.id,
      },
    ],
    interface: iface,
  };
}

test("applyGroupInterfaceToSubgraph drops inner edges on removed boundary handles", () => {
  const iface = defaultGroupInterface();
  const sub = makeSubgraph(iface);
  const removedInId = iface.inputs[0]!.id;
  const nextIface: StudioGroupInterface = {
    inputs: [
      {
        ...iface.inputs[0]!,
        id: "new_in",
        boundaryKey: "manual:in:number:Value:new_in",
      },
    ],
    outputs: iface.outputs,
  };
  const updated = applyGroupInterfaceToSubgraph(sub, nextIface);
  assert.equal(updated.interface.inputs[0]!.id, "new_in");
  assert.ok(updated.nodes.every((n) => n.type !== "studio-group-input" || n.data.interface === nextIface));
  assert.equal(updated.edges.some((e) => e.sourceHandle === removedInId), false);
});

test("filterParentEdgesForGroupInterface drops parent wires on removed shell handles", () => {
  const iface = defaultGroupInterface();
  const hostId = "group_host";
  const inId = iface.inputs[0]!.id;
  const outId = iface.outputs[0]!.id;
  const edges = [
    { id: "p_in", source: "a", target: hostId, targetHandle: inId },
    { id: "p_out", source: hostId, sourceHandle: outId, target: "b" },
    { id: "keep", source: "x", target: "y" },
  ];
  const nextIface: StudioGroupInterface = {
    inputs: [{ ...iface.inputs[0]!, id: "new_in", boundaryKey: "manual:in:number:Value:new_in" }],
    outputs: [{ ...iface.outputs[0]!, id: "new_out", boundaryKey: "manual:out:number:Value:new_out" }],
  };
  const filtered = filterParentEdgesForGroupInterface(edges, hostId, nextIface);
  assert.deepEqual(
    filtered.map((e) => e.id),
    ["keep"],
  );
});
