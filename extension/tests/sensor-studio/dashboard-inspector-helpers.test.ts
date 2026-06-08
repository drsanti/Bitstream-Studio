import assert from "node:assert/strict";
import { test } from "node:test";
import {
  flattenDashboardInspectorWidgets,
  resolveDashboardLayoutWarningsForPage,
  summarizeDashboardInspectorInventory,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-inspector-helpers";
import { EMPTY_DASHBOARD_SNAPSHOT } from "../../src/webview/sensor-studio/core/dashboard/dashboard-snapshot";
import type { DashboardSnapshotItemV1 } from "../../src/webview/sensor-studio/core/dashboard/dashboard-snapshot";

const sampleItems: DashboardSnapshotItemV1[] = [
  {
    kind: "group",
    group: {
      sourceNodeId: "group-1",
      catalogNodeId: "dashboard-group",
      label: "Panel",
      placement: { column: 2, row: 1, columnSpan: 4, rowSpan: 3 },
      flexPlacement: { order: 0, grow: 0, shrink: 1, basis: "auto", alignSelf: "stretch" },
      groupLayout: { columns: 2, gapPx: 8, paddingPx: 8 },
      showTitle: true,
      showBorder: true,
      children: [
        {
          widgetKind: "switch",
          sourceNodeId: "sw-1",
          catalogNodeId: "dashboard-switch",
          label: "Enable",
          placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
          flexPlacement: { order: 0, grow: 0, shrink: 1, basis: "auto", alignSelf: "stretch" },
          style: {},
          liveValue: true,
          enabled: true,
        },
        {
          widgetKind: "text",
          sourceNodeId: "txt-1",
          catalogNodeId: "dashboard-text",
          label: "Value",
          placement: { column: 1, row: 2, columnSpan: 2, rowSpan: 1 },
          flexPlacement: { order: 0, grow: 0, shrink: 1, basis: "auto", alignSelf: "stretch" },
          style: {},
          liveValue: 0.5,
          enabled: true,
        },
      ],
      style: {},
      enabled: true,
    },
  },
  {
    kind: "widget",
    widget: {
      widgetKind: "button",
      sourceNodeId: "btn-1",
      catalogNodeId: "dashboard-button",
      label: "Pulse",
      placement: { column: 1, row: 4, columnSpan: 2, rowSpan: 1 },
      flexPlacement: { order: 0, grow: 0, shrink: 1, basis: "auto", alignSelf: "stretch" },
      style: {},
      liveValue: null,
      enabled: true,
    },
  },
];

test("flattenDashboardInspectorWidgets expands group children", () => {
  const rows = flattenDashboardInspectorWidgets(sampleItems);
  assert.equal(rows.length, 3);
  assert.equal(rows[0]?.group?.sourceNodeId, "group-1");
  assert.equal(rows[2]?.group, null);
});

test("summarizeDashboardInspectorInventory counts controls and displays", () => {
  const inventory = summarizeDashboardInspectorInventory(sampleItems);
  assert.equal(inventory.groupCount, 1);
  assert.equal(inventory.controlCount, 2);
  assert.equal(inventory.displayCount, 1);
  assert.equal(inventory.topLevelWidgetCount, 1);
});

test("resolveDashboardLayoutWarningsForPage scopes tab warnings to active page", () => {
  const snapshot = {
    ...EMPTY_DASHBOARD_SNAPSHOT,
    tabs: [
      {
        sourceNodeId: "tab-a",
        catalogNodeId: "dashboard-tab",
        label: "Main",
        order: 0,
        items: [],
        enabled: true,
      },
      {
        sourceNodeId: "tab-b",
        catalogNodeId: "dashboard-tab",
        label: "Diag",
        order: 1,
        items: [],
        enabled: true,
      },
    ],
    layoutWarnings: [
      "Widgets wired directly to Dashboard Output are ignored when Tabs are connected.",
      'Tab "Main": Grid cell 1:1 is shared by widgets "A" and "B".',
      'Tab "Diag": Grid cell 2:2 is shared by widgets "C" and "D".',
    ],
  };

  const mainWarnings = resolveDashboardLayoutWarningsForPage({
    snapshot,
    activeTabSourceNodeId: "tab-a",
  });
  assert.equal(mainWarnings.length, 2);
  assert.ok(mainWarnings[0]?.includes("Tabs are connected"));
  assert.ok(mainWarnings[1]?.includes("1:1"));

  const diagWarnings = resolveDashboardLayoutWarningsForPage({
    snapshot,
    activeTabSourceNodeId: "tab-b",
  });
  assert.equal(diagWarnings.length, 2);
  assert.ok(diagWarnings[1]?.includes("2:2"));
});
