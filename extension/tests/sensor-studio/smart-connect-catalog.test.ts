import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NodeCatalogEntry } from "../../src/webview/sensor-studio/core/config/config-types";
import {
  buildSmartConnectAutoWire,
  entryMatchesSmartConnect,
  filterCatalogEntriesForSmartConnect,
  preferredSmartConnectBrowseGroups,
  rankCatalogEntriesForSmartConnect,
  type SmartConnectDragContext,
} from "../../src/webview/sensor-studio/features/editor/connect/smart-connect-catalog";

function entry(
  id: string,
  ports: {
    inputPorts?: NodeCatalogEntry["inputPorts"];
    outputPorts?: NodeCatalogEntry["outputPorts"];
    defaultVisible?: boolean;
  } = {},
): NodeCatalogEntry {
  return {
    id,
    category: "output",
    title: id,
    description: "",
    icon: "box",
    defaultConfig: {},
    defaultVisible: ports.defaultVisible ?? true,
    inputPorts: ports.inputPorts,
    outputPorts: ports.outputPorts,
  };
}

const numberOutCtx: SmartConnectDragContext = {
  nodeId: "n1",
  handleId: "out",
  handleType: "source",
  portType: "number",
};

describe("smart-connect-catalog", () => {
  it("filters consumers for output drags", () => {
    const entries = [
      entry("plotter", {
        inputPorts: [{ id: "ch1", portType: "number", label: "Ch 1" }],
      }),
      entry("indicator", {
        inputPorts: [{ id: "in", portType: "boolean", label: "On" }],
      }),
      entry("hidden", {
        defaultVisible: false,
        inputPorts: [{ id: "in", portType: "number", label: "In" }],
      }),
    ];
    const filtered = filterCatalogEntriesForSmartConnect(entries, numberOutCtx);
    assert.deepEqual(
      filtered.map((e) => e.id),
      ["plotter"],
    );
  });

  it("filters producers for input drags", () => {
    const ctx: SmartConnectDragContext = {
      nodeId: "n2",
      handleId: "in",
      handleType: "target",
      portType: "number",
    };
    const entries = [
      entry("plotter", {
        inputPorts: [{ id: "ch1", portType: "number", label: "Ch 1" }],
      }),
      entry("constant", {
        outputPorts: [{ id: "out", portType: "number", label: "Value" }],
      }),
    ];
    const filtered = filterCatalogEntriesForSmartConnect(entries, ctx);
    assert.deepEqual(
      filtered.map((e) => e.id),
      ["constant"],
    );
  });

  it("ranks recent and number sinks ahead of other compatible nodes", () => {
    const entries = [
      entry("compare", {
        inputPorts: [
          { id: "a", portType: "number", label: "A" },
          { id: "b", portType: "number", label: "B" },
        ],
      }),
      entry("plotter", {
        inputPorts: [{ id: "ch1", portType: "number", label: "Ch 1" }],
      }),
      entry("sparkline", {
        inputPorts: [{ id: "in", portType: "number", label: "Value" }],
      }),
    ];
    const ranked = rankCatalogEntriesForSmartConnect(entries, numberOutCtx, {
      recentCatalogIds: ["compare"],
      preferCompatible: true,
    });
    assert.equal(ranked[0]?.id, "compare");
    assert.equal(ranked[1]?.id, "plotter");
    assert.equal(ranked[2]?.id, "sparkline");
  });

  it("puts compatible entries first when ranking an unfiltered list (Shift)", () => {
    const entries = [
      entry("indicator", {
        inputPorts: [{ id: "in", portType: "boolean", label: "On" }],
      }),
      entry("plotter", {
        inputPorts: [{ id: "ch1", portType: "number", label: "Ch 1" }],
      }),
    ];
    const ranked = rankCatalogEntriesForSmartConnect(entries, numberOutCtx, {
      preferCompatible: true,
    });
    assert.equal(ranked[0]?.id, "plotter");
    assert.equal(ranked[1]?.id, "indicator");
    assert.equal(entryMatchesSmartConnect(numberOutCtx, entries[1]!), true);
    assert.equal(entryMatchesSmartConnect(numberOutCtx, entries[0]!), false);
  });

  it("buildSmartConnectAutoWire wires output drag to new node input", () => {
    const plotter = entry("plotter", {
      inputPorts: [{ id: "ch1", portType: "number", label: "Ch 1" }],
    });
    const wire = buildSmartConnectAutoWire(numberOutCtx, "new-1", plotter);
    assert.deepEqual(wire, {
      source: "n1",
      sourceHandle: "out",
      target: "new-1",
      targetHandle: "ch1",
    });
  });

  it("prefers Output browse group for number output drags", () => {
    const prefs = preferredSmartConnectBrowseGroups(numberOutCtx);
    assert.ok(prefs != null);
    assert.equal(prefs.layoutGroupLast, true);
    assert.equal(prefs.catalogGroupOrder[0], "output");
  });

  it("shows all visible entries when port type is unknown", () => {
    const ctx: SmartConnectDragContext = {
      nodeId: "r1",
      handleId: "in",
      handleType: "target",
      portType: null,
    };
    const entries = [
      entry("plotter", {
        inputPorts: [{ id: "ch1", portType: "number", label: "Ch 1" }],
      }),
      entry("indicator", {
        inputPorts: [{ id: "in", portType: "boolean", label: "On" }],
      }),
    ];
    assert.equal(filterCatalogEntriesForSmartConnect(entries, ctx).length, 2);
  });

  it("resolves wire port type from picked entry when drag context has no type", () => {
    const ctx: SmartConnectDragContext = {
      nodeId: "r1",
      handleId: "in",
      handleType: "target",
      portType: null,
    };
    const constant = entry("constant", {
      outputPorts: [{ id: "value", portType: "number", label: "Value" }],
    });
    const wire = buildSmartConnectAutoWire(ctx, "new-3", constant);
    assert.deepEqual(wire, {
      source: "new-3",
      sourceHandle: "value",
      target: "r1",
      targetHandle: "in",
    });
  });

  it("buildSmartConnectAutoWire wires input drag from new node output", () => {
    const ctx: SmartConnectDragContext = {
      nodeId: "sink",
      handleId: "in",
      handleType: "target",
      portType: "number",
    };
    const constant = entry("constant", {
      outputPorts: [{ id: "value", portType: "number", label: "Value" }],
    });
    const wire = buildSmartConnectAutoWire(ctx, "new-2", constant);
    assert.deepEqual(wire, {
      source: "new-2",
      sourceHandle: "value",
      target: "sink",
      targetHandle: "in",
    });
  });
});
