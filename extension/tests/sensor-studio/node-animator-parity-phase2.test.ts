import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupEntriesByDisplayGroup,
  resolvePaletteDisplayGroup,
} from "../../src/webview/sensor-studio/features/editor/components/node-palette/palette-display-meta";
import {
  pushRecentCatalogNodeId,
  readRecentCatalogNodeIds,
  resolveRecentCatalogEntries,
} from "../../src/webview/sensor-studio/features/editor/keyboard/recent-catalog-nodes";
import type { NodeCatalogEntry } from "../../src/webview/sensor-studio/core/config/config-types";

const mockEntry = (id: string, category: NodeCatalogEntry["category"]): NodeCatalogEntry =>
  ({
    id,
    title: id,
    category,
    defaultVisible: true,
  }) as NodeCatalogEntry;

describe("palette-display-meta", () => {
  it("maps schema categories to display groups", () => {
    assert.equal(resolvePaletteDisplayGroup(mockEntry("bmi270", "sensor")), "data");
    assert.equal(resolvePaletteDisplayGroup(mockEntry("number-constant", "input")), "input");
    assert.equal(resolvePaletteDisplayGroup(mockEntry("event-toggle-glb-part", "utility")), "events");
    assert.equal(resolvePaletteDisplayGroup(mockEntry("model-select", "utility")), "scene");
    assert.equal(resolvePaletteDisplayGroup(mockEntry("glb-animation-bundle", "generator")), "animation");
  });

  it("groups entries by display taxonomy", () => {
    const entries = [
      mockEntry("bmi270", "sensor"),
      mockEntry("event-toggle-glb-part", "utility"),
      mockEntry("model-select", "utility"),
    ];
    const grouped = groupEntriesByDisplayGroup(entries);
    assert.equal(grouped.get("data")?.length, 1);
    assert.equal(grouped.get("events")?.length, 1);
    assert.equal(grouped.get("scene")?.length, 1);
  });
});

describe("recent-catalog-nodes", () => {
  const storage = new Map<string, string>();

  it("tracks recent node ids in order with dedupe", () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });

    try {
      storage.clear();
      pushRecentCatalogNodeId("model-select");
      pushRecentCatalogNodeId("bmi270");
      pushRecentCatalogNodeId("model-select");
      assert.deepEqual(readRecentCatalogNodeIds(), ["model-select", "bmi270"]);

      const resolved = resolveRecentCatalogEntries(readRecentCatalogNodeIds(), [
        mockEntry("model-select", "utility"),
        mockEntry("bmi270", "sensor"),
      ]);
      assert.equal(resolved.length, 2);
      assert.equal(resolved[0]?.id, "model-select");
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });
});
