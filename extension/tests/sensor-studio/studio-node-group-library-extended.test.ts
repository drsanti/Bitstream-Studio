import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { graphNeedsMaterialDomainEvalInGraph } from "../../src/webview/sensor-studio/core/flow/material-domain-eval";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";
import { parseRemoteNodeGraphIndex } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/remote-node-graph-index";
import { parseStudioNodeAssetFile } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/studio-node-asset-file";

const NA_DEMO_PATH = resolve(
  "d:/CODE/2026/node-animator/apps/node-animator/public/assets/libraries/node-graph/trn-demo-float-out.trn-node-asset.json",
);

test("parseRemoteNodeGraphIndex accepts trn-library-index shape", () => {
  const index = parseRemoteNodeGraphIndex({
    marker: "trn-library-index",
    version: 1,
    libraryId: "nodeGraph",
    entries: [
      {
        id: "demo",
        name: "Demo",
        file: "demo.trn-node-asset.json",
      },
    ],
  });
  assert.ok(index != null);
  assert.equal(index.entries.length, 1);
  assert.equal(index.entries[0]?.id, "demo");
});

test("parseStudioNodeAssetFile normalizes node-animator nodeGroup presets", () => {
  let text: string;
  try {
    text = readFileSync(NA_DEMO_PATH, "utf8");
  } catch {
    const fallback = {
      marker: "trn-node-asset",
      version: 1,
      meta: { id: "demo", name: "Demo Float Output", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      nodes: [
        {
          id: "ng1",
          type: "nodeGroup",
          position: { x: 0, y: 0 },
          data: { graphTitle: "Demo", subgraphId: "sg1" },
        },
      ],
      edges: [],
      subgraphs: {
        sg1: {
          nodes: [
            { id: "sg1_input", type: "groupInput", position: { x: 0, y: 0 }, data: { role: "input", interface: { inputs: [], outputs: [] } } },
            { id: "f1", type: "float", position: { x: 80, y: 0 }, data: { value: 1, graphTitle: "Constant" } },
            { id: "sg1_output", type: "groupOutput", position: { x: 160, y: 0 }, data: { role: "output", interface: { inputs: [], outputs: [{ id: "out", label: "Value", type: "float", direction: "output" }] } } },
          ],
          edges: [],
          interface: {
            inputs: [],
            outputs: [{ id: "out", label: "Value", type: "float", direction: "output", boundaryKey: "default:out:float:Value" }],
          },
        },
      },
    };
    text = JSON.stringify(fallback);
  }

  const asset = parseStudioNodeAssetFile(text);
  assert.ok(asset != null);
  assert.equal(asset.nodes[0]?.type, "studio-node-group");
  const sub = asset.subgraphs[Object.keys(asset.subgraphs)[0]!];
  assert.ok(sub != null);
  assert.equal(sub.nodes.some((n) => n.type === "studio-group-input"), true);
  assert.equal(sub.nodes.some((n) => n.type === "studio" && (n.data as { nodeId?: string }).nodeId === "number-constant"), true);
});

test("normalizeNodeAssetForStudio maps float port types to number", () => {
  const raw = {
    marker: "trn-node-asset",
    version: 1,
    meta: { id: "x", name: "X", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    nodes: [{ id: "h", type: "nodeGroup", position: { x: 0, y: 0 }, data: { subgraphId: "sg" } }],
    edges: [],
    subgraphs: {
      sg: {
        nodes: [],
        edges: [],
        interface: {
          inputs: [{ id: "in1", label: "A", type: "float", direction: "input", boundaryKey: "k" }],
          outputs: [],
        },
      },
    },
  };
  const asset = normalizeNodeAssetForStudio(raw);
  assert.equal(asset?.subgraphs.sg?.interface.inputs[0]?.portType, "number");
});

test("graphNeedsMaterialDomainEvalInGraph scans nested subgraph nodes", () => {
  assert.equal(
    graphNeedsMaterialDomainEvalInGraph({
      nodes: [{ type: "studio", data: { nodeId: "plotter" } }],
      subgraphs: {
        g1: {
          nodes: [{ type: "studio", data: { nodeId: "material-mix" } }],
        },
      },
    }),
    true,
  );
  assert.equal(
    graphNeedsMaterialDomainEvalInGraph({
      nodes: [{ type: "studio", data: { nodeId: "sine-wave" } }],
      subgraphs: {},
    }),
    false,
  );
});
