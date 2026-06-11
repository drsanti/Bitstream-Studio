import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveDashboardDisplayItems } from "../../src/webview/sensor-studio/core/dashboard/dashboard-display-items";
import { EMPTY_DASHBOARD_SNAPSHOT } from "../../src/webview/sensor-studio/core/dashboard/dashboard-snapshot";
import {
  readDashboardDisplayTarget,
  writeDashboardDisplayTarget,
} from "../../src/webview/sensor-studio/features/dashboard/dashboard-viewport-ui-persistence";

test("resolveDashboardDisplayItems returns tab items when tabs are active", () => {
  const snapshot = {
    ...EMPTY_DASHBOARD_SNAPSHOT,
    items: [],
    tabs: [
      {
        sourceNodeId: "tab-a",
        label: "A",
        enabled: true,
        items: [
          {
            kind: "widget" as const,
            widget: {
              sourceNodeId: "w-a",
              catalogId: "dashboard-text",
              label: "A",
              enabled: true,
              placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
              flexPlacement: { order: 0, grow: 0, shrink: 1, basis: "auto" },
              showBorder: false,
              liveValue: "hi",
            },
          },
        ],
      },
    ],
  };
  const items = resolveDashboardDisplayItems({
    snapshot,
    activeTabSourceNodeId: "tab-a",
  });
  assert.equal(items.length, 1);
  assert.equal(items[0]?.kind, "widget");
});

test("dashboard display target persistence round-trips stage-hud", () => {
  const storage = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
    configurable: true,
  });
  try {
    assert.equal(readDashboardDisplayTarget(), "pane");
    writeDashboardDisplayTarget("stage-hud");
    assert.equal(readDashboardDisplayTarget(), "stage-hud");
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      value: previous,
      configurable: true,
    });
  }
});
