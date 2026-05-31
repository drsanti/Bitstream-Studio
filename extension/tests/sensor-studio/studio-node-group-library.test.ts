import assert from "node:assert/strict";
import test from "node:test";

import { buildStudioNodeAssetFromGroup } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/build-node-asset-from-group";
import { collectTransitiveSubgraphKeys } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/collect-transitive-subgraphs";
import { instantiateStudioNodeAsset } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/instantiate-node-asset";
import {
  parseStudioNodeAssetFile,
  serializeStudioNodeAssetFile,
  STUDIO_NODE_ASSET_MARKER,
  STUDIO_NODE_ASSET_VERSION,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/studio-node-asset-file";
import { defaultGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";

test("buildStudioNodeAssetFromGroup exports host and transitive subgraphs", () => {
  const hostId = "group_host";
  const nestedId = "group_nested";
  const subgraphs = {
    [hostId]: {
      nodes: [
        { id: `${hostId}_input`, type: "studio-group-input", position: { x: 0, y: 0 }, data: {} },
        {
          id: "inner_group",
          type: "studio-node-group",
          position: { x: 100, y: 0 },
          data: { subgraphId: nestedId, graphTitle: "Inner" },
        },
        { id: `${hostId}_output`, type: "studio-group-output", position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [],
      interface: defaultGroupInterface(),
      graphTitle: "Outer",
    },
    [nestedId]: {
      nodes: [
        { id: `${nestedId}_input`, type: "studio-group-input", position: { x: 0, y: 0 }, data: {} },
        {
          id: "n_const",
          type: "studio",
          position: { x: 80, y: 0 },
          data: { nodeId: "number-constant", defaultConfig: { value: 1 } },
        },
        { id: `${nestedId}_output`, type: "studio-group-output", position: { x: 160, y: 0 }, data: {} },
      ],
      edges: [],
      interface: defaultGroupInterface(),
    },
  };

  const parentNodes = [
    {
      id: hostId,
      type: "studio-node-group",
      position: { x: 40, y: 40 },
      data: { subgraphId: hostId, graphTitle: "Outer" },
    },
  ];

  const keys = collectTransitiveSubgraphKeys(subgraphs, [hostId]);
  assert.equal(keys.has(hostId), true);
  assert.equal(keys.has(nestedId), true);

  const asset = buildStudioNodeAssetFromGroup(hostId, parentNodes, [], subgraphs);
  assert.ok(asset != null);
  assert.equal(asset.meta.name, "Outer");
  assert.equal(asset.nodes.length, 1);
  assert.ok(asset.subgraphs[hostId] != null);
  assert.ok(asset.subgraphs[nestedId] != null);
});

test("parseStudioNodeAssetFile round-trips serialized assets", () => {
  const asset = {
    marker: STUDIO_NODE_ASSET_MARKER,
    version: STUDIO_NODE_ASSET_VERSION,
    meta: {
      id: "asset-1",
      name: "Demo Group",
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z",
    },
    nodes: [
      {
        id: "host",
        type: "studio-node-group",
        position: { x: 0, y: 0 },
        data: { subgraphId: "sg1", graphTitle: "Demo Group" },
      },
    ],
    edges: [],
    subgraphs: {
      sg1: {
        nodes: [],
        edges: [],
        interface: defaultGroupInterface(),
      },
    },
  };

  const parsed = parseStudioNodeAssetFile(serializeStudioNodeAssetFile(asset));
  assert.ok(parsed != null);
  assert.equal(parsed.meta.name, "Demo Group");
  assert.equal(parsed.nodes[0]?.type, "studio-node-group");
});

test("instantiateStudioNodeAsset deep-copies at drop position", () => {
  const asset = {
    marker: STUDIO_NODE_ASSET_MARKER,
    version: STUDIO_NODE_ASSET_VERSION,
    meta: {
      id: "asset-drop",
      name: "Drop Me",
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z",
    },
    nodes: [
      {
        id: "host_src",
        type: "studio-node-group",
        position: { x: 10, y: 20 },
        data: { subgraphId: "sg_src", graphTitle: "Drop Me" },
      },
    ],
    edges: [],
    subgraphs: {
      sg_src: {
        nodes: [
          { id: "sg_src_input", type: "studio-group-input", position: { x: 0, y: 0 }, data: {} },
          { id: "sg_src_output", type: "studio-group-output", position: { x: 100, y: 0 }, data: {} },
        ],
        edges: [],
        interface: defaultGroupInterface(),
      },
    },
  };

  const result = instantiateStudioNodeAsset(asset, { x: 210, y: 220 }, {});
  assert.equal(result.nodes.length, 1);
  assert.notEqual(result.nodes[0]?.id, "host_src");
  assert.equal(result.nodes[0]?.position.x, 210);
  assert.equal(result.nodes[0]?.position.y, 220);
  assert.equal((result.nodes[0]?.data as { libraryAssetId?: string }).libraryAssetId, "asset-drop");
  assert.ok(Object.keys(result.subgraphs).length > 0);
});
