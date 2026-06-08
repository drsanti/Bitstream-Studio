import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateDashboardSnapshot } from "../../src/webview/sensor-studio/core/dashboard/evaluate-dashboard-snapshot";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";
import {
  STUDIO_HANDLE_OUT,
  STUDIO_HANDLE_TAB,
  STUDIO_HANDLE_TABS,
  STUDIO_HANDLE_THEME,
  STUDIO_HANDLE_WIDGET,
  STUDIO_HANDLE_WIDGETS,
} from "../../src/webview/sensor-studio/features/editor/studio-handle-ids";

function studioNode(
  id: string,
  nodeId: string,
  data: Partial<FlowGraphNode["data"]> = {},
): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      defaultConfig: {},
      ...data,
    },
  } as FlowGraphNode;
}

test("evaluateDashboardSnapshot returns empty snapshot when Dashboard Output is absent", () => {
  const snap = evaluateDashboardSnapshot({ nodes: [], edges: [] });
  assert.equal(snap.dashboardOutputNodeId, null);
  assert.deepEqual(snap.items, []);
  assert.deepEqual(snap.tabs, []);
  assert.equal(snap.theme.preset, "studio-dark");
});

test("evaluateDashboardSnapshot collects wired widgets and detects overlap", () => {
  const output = studioNode("out-1", "dashboard-output", {
    defaultConfig: {
      layout: {
        version: 1,
        mode: "grid",
        grid: { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 },
      },
    },
  });
  const button = studioNode("btn-1", "dashboard-button", {
    defaultConfig: {
      label: "Go",
      placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    },
  });
  const led = studioNode("led-1", "dashboard-led", {
    defaultConfig: {
      placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    },
    liveValue: true,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, button, led],
    edges: [
      {
        id: "e1",
        source: button.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
      {
        id: "e2",
        source: led.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.dashboardOutputNodeId, "out-1");
  assert.equal(snap.items.length, 2);
  assert.equal(snap.items[0]?.kind, "widget");
  assert.equal(snap.items[1]?.kind === "widget" ? snap.items[1].widget.liveValue : null, true);
  assert.ok(snap.layoutWarnings.length > 0);
});

test("evaluateDashboardSnapshot ignores non-widget sources on widgets socket", () => {
  const output = studioNode("out-1", "dashboard-output");
  const sine = studioNode("sine-1", "sine-wave", { liveValue: 0.5 });
  const snap = evaluateDashboardSnapshot({
    nodes: [output, sine],
    edges: [
      {
        id: "e1",
        source: sine.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_OUT,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });
  assert.equal(snap.items.length, 0);
});

test("evaluateDashboardSnapshot collects gauge and flex placement", () => {
  const output = studioNode("out-1", "dashboard-output", {
    defaultConfig: {
      layout: {
        version: 1,
        mode: "flex",
        grid: { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 },
        flex: {
          direction: "row",
          wrap: true,
          gapPx: 8,
          paddingPx: 16,
          alignItems: "stretch",
          justifyContent: "start",
        },
      },
    },
  });
  const gauge = studioNode("gauge-1", "dashboard-gauge", {
    defaultConfig: {
      flex: { order: 2, grow: 1, shrink: 1, basis: "200px" },
      placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 3 },
    },
    liveValue: 42,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, gauge],
    edges: [
      {
        id: "e1",
        source: gauge.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.layout.mode, "flex");
  assert.equal(snap.items.length, 1);
  assert.equal(snap.items[0]?.kind === "widget" ? snap.items[0].widget.widgetKind : null, "gauge");
  assert.equal(
    snap.items[0]?.kind === "widget" ? snap.items[0].widget.flexPlacement.order : null,
    2,
  );
  assert.deepEqual(snap.layoutWarnings, []);
});

test("evaluateDashboardSnapshot nests widgets in dashboard-group", () => {
  const output = studioNode("out-1", "dashboard-output");
  const group = studioNode("grp-1", "dashboard-group", {
    label: "Controls",
    defaultConfig: {
      title: "Controls",
      groupLayout: { version: 1, columns: 4, gapPx: 4, paddingPx: 4, rowHeightPx: 40 },
      placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 3 },
    },
  });
  const button = studioNode("btn-1", "dashboard-button", {
    defaultConfig: {
      placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    },
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, group, button],
    edges: [
      {
        id: "e1",
        source: group.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
      {
        id: "e2",
        source: button.id,
        target: group.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.items.length, 1);
  assert.equal(snap.items[0]?.kind, "group");
  if (snap.items[0]?.kind === "group") {
    assert.equal(snap.items[0].group.label, "Controls");
    assert.equal(snap.items[0].group.children.length, 1);
    assert.equal(snap.items[0].group.children[0]?.widgetKind, "button");
  }
});

test("evaluateDashboardSnapshot uses wired theme from dashboard-theme", () => {
  const output = studioNode("out-1", "dashboard-output");
  const themeNode = studioNode("theme-1", "dashboard-theme", {
    defaultConfig: {
      theme: {
        version: 1,
        preset: "slate",
        canvasBackground: "#0f172a",
        panelBackground: "#1e293b",
        accentColor: "#38bdf8",
        textPrimary: "#f1f5f9",
        textSecondary: "#94a3b8",
      },
    },
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, themeNode],
    edges: [
      {
        id: "e1",
        source: themeNode.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_OUT,
        targetHandle: STUDIO_HANDLE_THEME,
      },
    ],
  });

  assert.equal(snap.theme.preset, "slate");
  assert.equal(snap.theme.accentColor, "#38bdf8");
});

test("evaluateDashboardSnapshot collects publishToDashboard flow nodes without widget wires", () => {
  const output = studioNode("out-1", "dashboard-output");
  const gauge = studioNode("gauge-flow-1", "radial-gauge", {
    defaultConfig: {
      publishToDashboard: true,
      placement: { column: 2, row: 1, columnSpan: 4, rowSpan: 3 },
    },
    liveValue: 72,
  });
  const led = studioNode("led-flow-1", "led-indicator", {
    defaultConfig: {
      publishToDashboard: true,
      placement: { column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
    },
    liveValue: true,
  });
  const ignored = studioNode("gauge-off", "radial-gauge", {
    defaultConfig: { publishToDashboard: false },
    liveValue: 10,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, gauge, led, ignored],
    edges: [],
  });

  assert.equal(snap.items.length, 2);
  const kinds = snap.items
    .filter((item) => item.kind === "widget")
    .map((item) => (item.kind === "widget" ? item.widget.widgetKind : null));
  assert.deepEqual(kinds.sort(), ["gauge", "led"]);
  const publishedGauge = snap.items.find(
    (item) => item.kind === "widget" && item.widget.sourceNodeId === "gauge-flow-1",
  );
  assert.equal(
    publishedGauge?.kind === "widget" ? publishedGauge.widget.liveValue : null,
    72,
  );
});

test("evaluateDashboardSnapshot merges wired dashboard widgets with published flow nodes", () => {
  const output = studioNode("out-1", "dashboard-output");
  const gauge = studioNode("gauge-1", "radial-gauge", {
    defaultConfig: {
      publishToDashboard: true,
      placement: { column: 5, row: 1, columnSpan: 4, rowSpan: 3 },
    },
    liveValue: 5,
  });
  const dashGauge = studioNode("dg-1", "dashboard-gauge", {
    defaultConfig: {
      placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 3 },
    },
    liveValue: 99,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, gauge, dashGauge],
    edges: [
      {
        id: "e1",
        source: dashGauge.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.items.length, 2);
  const catalogIds = snap.items
    .filter((item) => item.kind === "widget")
    .map((item) => (item.kind === "widget" ? item.widget.catalogNodeId : null))
    .sort();
  assert.deepEqual(catalogIds, ["dashboard-gauge", "radial-gauge"]);
});

test("evaluateDashboardSnapshot publishes bar-meter with bar widget kind", () => {
  const output = studioNode("out-1", "dashboard-output");
  const bar = studioNode("bar-1", "bar-meter", {
    defaultConfig: {
      publishToDashboard: true,
      orientation: "horizontal",
      placement: { column: 1, row: 2, columnSpan: 6, rowSpan: 1 },
    },
    liveValue: 33,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, bar],
    edges: [],
  });

  assert.equal(snap.items.length, 1);
  assert.equal(snap.items[0]?.kind === "widget" ? snap.items[0].widget.widgetKind : null, "bar");
  assert.equal(
    snap.items[0]?.kind === "widget" ? snap.items[0].widget.catalogNodeId : null,
    "bar-meter",
  );
});

test("evaluateDashboardSnapshot publishes sparkline with live history", () => {
  const output = studioNode("out-1", "dashboard-output");
  const spark = studioNode("sp-1", "sparkline", {
    defaultConfig: {
      publishToDashboard: true,
      placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 2 },
    },
    liveHistory: [1, 2, 3, 4],
  });

  const snap = evaluateDashboardSnapshot({ nodes: [output, spark], edges: [] });

  assert.equal(snap.items.length, 1);
  assert.equal(
    snap.items[0]?.kind === "widget" ? snap.items[0].widget.widgetKind : null,
    "sparkline",
  );
  assert.deepEqual(
    snap.items[0]?.kind === "widget" ? snap.items[0].widget.liveHistory : null,
    [1, 2, 3, 4],
  );
});

test("evaluateDashboardSnapshot nests published widgets inside dashboard-group", () => {
  const output = studioNode("out-1", "dashboard-output");
  const group = studioNode("grp-1", "dashboard-group", {
    label: "Trends",
    defaultConfig: {
      groupLayout: { version: 1, columns: 6, gapPx: 4, paddingPx: 4, rowHeightPx: 40 },
      placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 4 },
    },
  });
  const spark = studioNode("sp-1", "sparkline", {
    defaultConfig: {
      publishToDashboard: true,
      dashboardGroupId: "grp-1",
      placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 2 },
    },
    liveHistory: [0.1, 0.2],
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, group, spark],
    edges: [
      {
        id: "e1",
        source: group.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.items.length, 1);
  assert.equal(snap.items[0]?.kind, "group");
  if (snap.items[0]?.kind === "group") {
    assert.equal(snap.items[0].group.children.length, 1);
    assert.equal(snap.items[0].group.children[0]?.widgetKind, "sparkline");
  }
});

test("evaluateDashboardSnapshot collects dashboard-tab pages and ignores direct output widgets", () => {
  const output = studioNode("out-1", "dashboard-output");
  const tabOverview = studioNode("tab-1", "dashboard-tab", {
    label: "Overview",
    defaultConfig: { title: "Overview", order: 0 },
  });
  const tabTrends = studioNode("tab-2", "dashboard-tab", {
    label: "Trends",
    defaultConfig: { title: "Trends", order: 1 },
  });
  const button = studioNode("btn-1", "dashboard-button", {
    defaultConfig: {
      placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    },
  });
  const led = studioNode("led-1", "dashboard-led", {
    defaultConfig: {
      placement: { column: 3, row: 1, columnSpan: 2, rowSpan: 1 },
    },
  });
  const stray = studioNode("stray-1", "dashboard-text", {
    defaultConfig: {
      placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    },
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, tabOverview, tabTrends, button, led, stray],
    edges: [
      {
        id: "e-tabs-1",
        source: tabOverview.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_TAB,
        targetHandle: STUDIO_HANDLE_TABS,
      },
      {
        id: "e-tabs-2",
        source: tabTrends.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_TAB,
        targetHandle: STUDIO_HANDLE_TABS,
      },
      {
        id: "e-btn",
        source: button.id,
        target: tabOverview.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
      {
        id: "e-led",
        source: led.id,
        target: tabTrends.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
      {
        id: "e-stray",
        source: stray.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.items.length, 0);
  assert.equal(snap.tabs.length, 2);
  assert.equal(snap.tabs[0]?.label, "Overview");
  assert.equal(snap.tabs[0]?.items.length, 1);
  assert.equal(snap.tabs[1]?.label, "Trends");
  assert.ok(snap.layoutWarnings.some((w) => w.includes("ignored when Tabs")));
});

test("evaluateDashboardSnapshot collects dashboard-switch and dashboard-slider widgets", () => {
  const output = studioNode("out-1", "dashboard-output");
  const switchNode = studioNode("sw-1", "dashboard-switch", {
    defaultConfig: {
      label: "Enable",
      value: true,
      placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 1 },
    },
  });
  const sliderNode = studioNode("sl-1", "dashboard-slider", {
    defaultConfig: {
      label: "Level",
      value: 42,
      min: 0,
      max: 100,
      placement: { column: 4, row: 1, columnSpan: 6, rowSpan: 1 },
    },
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, switchNode, sliderNode],
    edges: [
      {
        id: "e-sw",
        source: switchNode.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
      {
        id: "e-sl",
        source: sliderNode.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.items.length, 2);
  const kinds = snap.items.map((item) =>
    item.kind === "widget" ? item.widget.widgetKind : null,
  );
  assert.deepEqual(kinds.sort(), ["slider", "switch"]);
  const sw = snap.items.find(
    (item) => item.kind === "widget" && item.widget.widgetKind === "switch",
  );
  if (sw?.kind === "widget") {
    assert.equal(sw.widget.liveValue, true);
  }
});

test("evaluateDashboardSnapshot publishes compare as status widget", () => {
  const output = studioNode("out-1", "dashboard-output");
  const compare = studioNode("cmp-1", "compare", {
    defaultConfig: {
      operation: ">",
      publishToDashboard: true,
      onLabel: "High",
      offLabel: "Low",
      placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 1 },
    },
    liveValue: true,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, compare],
    edges: [],
  });

  assert.equal(snap.items.length, 1);
  assert.equal(snap.items[0]?.kind, "widget");
  if (snap.items[0]?.kind === "widget") {
    assert.equal(snap.items[0].widget.widgetKind, "status");
    assert.equal(snap.items[0].widget.liveValue, true);
    assert.equal(snap.items[0].widget.style.onLabel, "High");
  }
});

test("evaluateDashboardSnapshot collects dashboard-status widget", () => {
  const output = studioNode("out-1", "dashboard-output");
  const status = studioNode("st-1", "dashboard-status", {
    label: "Alarm",
    defaultConfig: {
      label: "Alarm",
      onLabel: "OK",
      offLabel: "Trip",
      placement: { column: 2, row: 2, columnSpan: 4, rowSpan: 1 },
    },
    liveValue: false,
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, status],
    edges: [
      {
        id: "e1",
        source: status.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  assert.equal(snap.items.length, 1);
  if (snap.items[0]?.kind === "widget") {
    assert.equal(snap.items[0].widget.widgetKind, "status");
    assert.equal(snap.items[0].widget.label, "Alarm");
  }
});
