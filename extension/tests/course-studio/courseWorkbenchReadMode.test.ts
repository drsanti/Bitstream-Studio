import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isViewOnlyCourseWorkbenchLayout,
  loadAuthorWorkbenchLayoutBackup,
  saveAuthorWorkbenchLayoutBackup,
} from "../../src/webview/course-studio/workbench/course-workbench-read-mode";
import { workbenchLayoutFingerprint } from "../../src/webview/course-studio/workbench/course-workbench-layout-migration";
import {
  COURSE_VIEW_WORKBENCH_LAYOUT,
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
} from "../../src/webview/course-studio/workbench/default-course-workbench-layout";

function mockLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("course-workbench-read-mode", () => {
  it("detects view-only layout (content pane only)", () => {
    assert.equal(isViewOnlyCourseWorkbenchLayout(COURSE_VIEW_WORKBENCH_LAYOUT), true);
    assert.equal(
      isViewOnlyCourseWorkbenchLayout(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT),
      false,
    );
  });

  it("round-trips author layout backup via localStorage", () => {
    const storage = mockLocalStorage();
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
    });
    try {
      storage.clear();
      assert.equal(loadAuthorWorkbenchLayoutBackup(), null);
      saveAuthorWorkbenchLayoutBackup({
        layout: DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
        dockMemory: { "course-root": 0.72 },
      });
      const loaded = loadAuthorWorkbenchLayoutBackup();
      assert.equal(
        workbenchLayoutFingerprint(loaded?.layout ?? null),
        workbenchLayoutFingerprint(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT),
      );
      assert.deepEqual(loaded?.dockMemory, { "course-root": 0.72 });
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: prev,
        configurable: true,
      });
    }
  });

  it("loads legacy layout-only backup payloads", () => {
    const storage = mockLocalStorage();
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
    });
    try {
      storage.setItem(
        "course-studio:author-workbench-layout-backup.v1",
        JSON.stringify(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT),
      );
      const loaded = loadAuthorWorkbenchLayoutBackup();
      assert.equal(
        workbenchLayoutFingerprint(loaded?.layout ?? null),
        workbenchLayoutFingerprint(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT),
      );
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: prev,
        configurable: true,
      });
    }
  });
});
