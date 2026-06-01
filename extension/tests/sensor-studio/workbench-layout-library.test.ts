import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "../../src/webview/sensor-studio/features/editor/workbench/default-studio-workbench-layout";
import {
  deleteNamedWorkbenchLayout,
  duplicateNamedWorkbenchLayout,
  findNamedWorkbenchLayoutByName,
  importWorkbenchLayoutToLibrary,
  listNamedWorkbenchLayouts,
  MAX_NAMED_WORKBENCH_LAYOUTS,
  parseWorkbenchLayoutImport,
  readWorkbenchLayoutLibrary,
  readWorkbenchStartupPreference,
  renameNamedWorkbenchLayout,
  reorderNamedWorkbenchLayout,
  saveNamedWorkbenchLayout,
  serializeWorkbenchLayoutExport,
  summarizeWorkbenchLayoutPanes,
  writeWorkbenchStartupPreference,
  workbenchLayoutLibraryStorageKey,
} from "../../src/webview/ui/workbench/workbench-layout-library";
import { collapseEditorPane, findEditorPaneId } from "../../src/webview/ui/workbench/utils";

const APP_ID = "test-workbench-layout-lib";

type StorageLike = {
  store: Map<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function installMockLocalStorage(): StorageLike {
  const mock: StorageLike = {
    store: new Map(),
    getItem(key) {
      return mock.store.get(key) ?? null;
    },
    setItem(key, value) {
      mock.store.set(key, value);
    },
    removeItem(key) {
      mock.store.delete(key);
    },
  };
  (globalThis as { localStorage?: StorageLike; window?: { localStorage?: StorageLike } }).localStorage =
    mock;
  (globalThis as { window?: { localStorage?: StorageLike } }).window = { localStorage: mock };
  return mock;
}

describe("workbench layout library", () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = installMockLocalStorage();
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: StorageLike }).localStorage;
  });

  it("saves and lists a named layout with dock memory", () => {
    const dockMemory = { "flow|inspector|left": 0.62 };
    const saved = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Authoring",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      dockMemory,
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    assert.equal(saved.overwritten, false);

    const rows = listNamedWorkbenchLayouts(APP_ID);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.name, "Authoring");
    assert.deepEqual(rows[0]?.dockMemory, dockMemory);
  });

  it("requires overwrite confirmation for duplicate names", () => {
    saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Authoring",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    const conflict = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "authoring",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      allowOverwrite: false,
    });
    assert.equal(conflict.ok, false);
    if (conflict.ok) {
      return;
    }
    assert.equal(conflict.reason, "name_conflict");

    const overwritten = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Authoring",
      layout: collapseEditorPane(
        DEFAULT_STUDIO_WORKBENCH_LAYOUT,
        findEditorPaneId(DEFAULT_STUDIO_WORKBENCH_LAYOUT, "library")!,
      ),
      allowOverwrite: true,
    });
    assert.equal(overwritten.ok, true);
    if (!overwritten.ok) {
      return;
    }
    assert.equal(overwritten.overwritten, true);
    assert.equal(listNamedWorkbenchLayouts(APP_ID).length, 1);
  });

  it("enforces max named layout count", () => {
    for (let index = 0; index < MAX_NAMED_WORKBENCH_LAYOUTS; index += 1) {
      const result = saveNamedWorkbenchLayout({
        appId: APP_ID,
        name: `Layout ${index}`,
        layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      });
      assert.equal(result.ok, true);
    }
    const full = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "One too many",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    assert.equal(full.ok, false);
    if (full.ok) {
      return;
    }
    assert.equal(full.reason, "library_full");
  });

  it("deletes a named layout from storage", () => {
    const saved = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Temp",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    assert.ok(deleteNamedWorkbenchLayout(APP_ID, saved.snapshot.id));
    assert.equal(listNamedWorkbenchLayouts(APP_ID).length, 0);
    assert.equal(storage.store.get(workbenchLayoutLibraryStorageKey(APP_ID)) != null, true);
    assert.equal(readWorkbenchLayoutLibrary(APP_ID).layouts.length, 0);
  });

  it("summarizes pane types for palette hints", () => {
    const summary = summarizeWorkbenchLayoutPanes(DEFAULT_STUDIO_WORKBENCH_LAYOUT);
    assert.match(summary, /library/);
    assert.match(summary, /flow/);
    assert.match(summary, /inspector/);
  });

  it("finds layouts by normalized name", () => {
    saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "  Graph Focus  ",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    const hit = findNamedWorkbenchLayoutByName(readWorkbenchLayoutLibrary(APP_ID), "graph focus");
    assert.ok(hit);
    assert.equal(hit?.name, "Graph Focus");
  });

  it("renames, duplicates, and reorders named layouts", () => {
    const first = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Alpha",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    const second = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Beta",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) {
      return;
    }

    const renamed = renameNamedWorkbenchLayout({
      appId: APP_ID,
      layoutId: first.snapshot.id,
      name: "Alpha edited",
    });
    assert.equal(renamed.ok, true);

    const duplicated = duplicateNamedWorkbenchLayout(APP_ID, second.snapshot.id);
    assert.equal(duplicated.ok, true);
    if (!duplicated.ok) {
      return;
    }
    assert.match(duplicated.snapshot.name, /Beta copy/);

    assert.equal(listNamedWorkbenchLayouts(APP_ID).length, 3);
    assert.ok(reorderNamedWorkbenchLayout(APP_ID, duplicated.snapshot.id, -1));
    const ordered = listNamedWorkbenchLayouts(APP_ID);
    assert.equal(ordered[1]?.id, duplicated.snapshot.id);
  });

  it("stores startup preference per app", () => {
    writeWorkbenchStartupPreference(APP_ID, { kind: "preset", presetId: "graph-focus" });
    assert.deepEqual(readWorkbenchStartupPreference(APP_ID), {
      kind: "preset",
      presetId: "graph-focus",
    });
    writeWorkbenchStartupPreference(APP_ID, { kind: "session" });
    assert.deepEqual(readWorkbenchStartupPreference(APP_ID), { kind: "session" });
  });

  it("exports and imports layout json for the same app", () => {
    const saved = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Portable",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      dockMemory: { "flow|inspector|left": 0.4 },
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    const json = serializeWorkbenchLayoutExport(saved.snapshot);
    const parsed = parseWorkbenchLayoutImport(json, APP_ID);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    const imported = importWorkbenchLayoutToLibrary({
      appId: APP_ID,
      snapshot: parsed.snapshot,
      nameOverride: "Portable import",
    });
    assert.equal(imported.ok, true);
    assert.equal(listNamedWorkbenchLayouts(APP_ID).length, 2);
  });

  it("rejects imports for a different workspace app id", () => {
    const saved = saveNamedWorkbenchLayout({
      appId: APP_ID,
      name: "Portable",
      layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    const json = serializeWorkbenchLayoutExport(saved.snapshot);
    const parsed = parseWorkbenchLayoutImport(json, "other-app");
    assert.equal(parsed.ok, false);
    if (parsed.ok) {
      return;
    }
    assert.equal(parsed.reason, "wrong_app");
  });
});
