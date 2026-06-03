import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Edge } from "@xyflow/react";
import type { NodeCatalogEntry } from "../../src/webview/sensor-studio/core/config/config-types";
import { resolveConnectPortType } from "../../src/webview/sensor-studio/features/editor/connect/resolve-connect-port-type";
import {
  entryMatchesSmartConnect,
  filterCatalogEntriesForSmartConnect,
  type SmartConnectDragContext,
} from "../../src/webview/sensor-studio/features/editor/connect/smart-connect-catalog";
import type { Node } from "@xyflow/react";
import type { StudioSubgraphDocument } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";
import { inferLayoutNodeSmartConnectPortType } from "../../src/webview/sensor-studio/features/editor/layout/layout-port-resolution";

function catalogEntry(
  id: string,
  opts: {
    inputPorts?: NodeCatalogEntry["inputPorts"];
    outputPorts?: NodeCatalogEntry["outputPorts"];
  } = {},
): NodeCatalogEntry {
  return {
    id,
    category: "output",
    title: id,
    description: "",
    icon: "box",
    defaultConfig: {},
    inputPorts: opts.inputPorts,
    outputPorts: opts.outputPorts,
  };
}

describe("resolve-connect-port-type (group / subgraph)", () => {
  const subgraphId = "sub-1";
  const outSockId = "gsock_out_number";
  const inSockId = "gsock_in_number";

  const subgraphs: Record<string, StudioSubgraphDocument> = {
    [subgraphId]: {
      nodes: [],
      edges: [],
      interface: {
        inputs: [
          {
            id: inSockId,
            label: "In",
            portType: "number",
            direction: "input",
            boundaryKey: "in:number",
          },
        ],
        outputs: [
          {
            id: outSockId,
            label: "Out",
            portType: "number",
            direction: "output",
            boundaryKey: "out:number",
          },
        ],
      },
    },
  };

  const groupHost: Node = {
    id: "group-1",
    type: "studio-node-group",
    position: { x: 0, y: 0 },
    data: {
      subgraphId,
      graphTitle: "Test group",
    },
  };

  const groupInput: Node = {
    id: "gi",
    type: "studio-group-input",
    position: { x: 0, y: 0 },
    data: {
      role: "input",
      interface: subgraphs[subgraphId]!.interface,
    },
  };

  const groupOutput: Node = {
    id: "go",
    type: "studio-group-output",
    position: { x: 0, y: 0 },
    data: {
      role: "output",
      interface: subgraphs[subgraphId]!.interface,
    },
  };

  it("resolves host group output and input handles from subgraph interface", () => {
    assert.equal(
      resolveConnectPortType(groupHost, outSockId, "source", subgraphs),
      "number",
    );
    assert.equal(
      resolveConnectPortType(groupHost, inSockId, "target", subgraphs),
      "number",
    );
  });

  it("resolves boundary nodes for smart connect drag context", () => {
    assert.equal(
      resolveConnectPortType(groupInput, inSockId, "source", subgraphs),
      "number",
    );
    assert.equal(
      resolveConnectPortType(groupOutput, outSockId, "target", subgraphs),
      "number",
    );
  });

  it("filters catalog by resolved group-output port type (target drag → producers)", () => {
    const ctx: SmartConnectDragContext = {
      nodeId: "go",
      handleId: outSockId,
      handleType: "target",
      portType: resolveConnectPortType(groupOutput, outSockId, "target", subgraphs),
    };
    assert.equal(ctx.portType, "number");
    const entries = [
      catalogEntry("constant", {
        outputPorts: [{ id: "value", portType: "number", label: "Value" }],
      }),
      catalogEntry("indicator", {
        outputPorts: [{ id: "on", portType: "boolean", label: "On" }],
      }),
    ];
    const filtered = filterCatalogEntriesForSmartConnect(entries, ctx);
    assert.deepEqual(filtered.map((e) => e.id), ["constant"]);
    assert.equal(entryMatchesSmartConnect(ctx, entries[0]!), true);
    assert.equal(entryMatchesSmartConnect(ctx, entries[1]!), false);
  });

  it("infers reroute type from wire into group output boundary", () => {
    const animSockId = "gsock_anim";
    const animGroupOut: Node = {
      id: "go-anim",
      type: "studio-group-output",
      position: { x: 0, y: 0 },
      data: {
        role: "output",
        interface: {
          inputs: [],
          outputs: [
            {
              id: animSockId,
              label: "Playback",
              portType: "glbAnimation",
              direction: "output",
              boundaryKey: "out:glbAnimation",
            },
          ],
        },
      },
    };
    const reroute: Node = {
      id: "rr",
      type: "studio-reroute",
      position: { x: 100, y: 0 },
      data: { socketType: null },
    };
    const player: Node = {
      id: "player",
      type: "studio",
      position: { x: 0, y: 0 },
      data: {
        nodeId: "glb-animation-bundle",
        label: "Player",
        category: "output",
        defaultConfig: {},
        outputType: "glbAnimation",
      },
    };
    const nodes = [player, animGroupOut, reroute];
    const edges: Edge[] = [
      {
        id: "e1",
        source: "player",
        target: "go-anim",
        sourceHandle: "out",
        targetHandle: animSockId,
        label: "glbAnimation",
      },
      {
        id: "e2",
        source: "go-anim",
        target: "rr",
        sourceHandle: animSockId,
        targetHandle: "in",
        label: "glbAnimation",
      },
    ];
    const inferred = inferLayoutNodeSmartConnectPortType(
      reroute,
      "out",
      "source",
      edges,
      nodes,
    );
    assert.equal(inferred, "glbAnimation");
    assert.equal(
      resolveConnectPortType(animGroupOut, animSockId, "target", {}),
      "glbAnimation",
    );
  });
});
