import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { savePersistedLayout, clearPersistedLayout } from "../../src/webview/ui/workbench/layoutPersistence";
import {
  defaultCourseAuthorWorkbenchLayoutFingerprint,
  isLegacyCourseAuthorWorkbenchLayout,
  isV2CourseAuthorWorkbenchLayout,
  isV3CourseAuthorWorkbenchLayout,
  readCourseWorkbenchLayoutRevision,
  workbenchLayoutFingerprint,
  writeCourseWorkbenchLayoutRevision,
} from "../../src/webview/course-studio/workbench/course-workbench-layout-migration";
import {
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  V2_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  V3_COURSE_AUTHOR_WORKBENCH_LAYOUT,
} from "../../src/webview/course-studio/workbench/default-course-workbench-layout";
import { validateCourseWorkbenchLayout } from "../../src/webview/course-studio/workbench/validate-course-workbench-layout";

const REVISION_KEY = "course-studio:workbench-layout-revision.v1";

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

describe("course workbench layout default + migration", () => {
  it("uses course outline + editor grid with Widget Editor + inspector", () => {
    const fingerprint = defaultCourseAuthorWorkbenchLayoutFingerprint();
    assert.match(fingerprint, /e:outline/);
    assert.match(fingerprint, /editors-quadrant/);
    assert.match(fingerprint, /editors-top-row/);
    assert.match(fingerprint, /editors-bottom-row/);
    assert.match(fingerprint, /e:html-page/);
    assert.match(fingerprint, /e:widget-board/);
    assert.match(fingerprint, /e:inspector/);
    assert.doesNotMatch(fingerprint, /e:block-inspector/);
    assert.doesNotMatch(fingerprint, /inspector-column/);
    assert.doesNotMatch(fingerprint, /right-column/);
  });

  it("detects the legacy v1 author layout", () => {
    assert.equal(isLegacyCourseAuthorWorkbenchLayout(LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT), true);
    assert.equal(
      isLegacyCourseAuthorWorkbenchLayout(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT),
      false,
    );
  });

  it("detects the v2 author layout", () => {
    assert.equal(isV2CourseAuthorWorkbenchLayout(V2_COURSE_AUTHOR_WORKBENCH_LAYOUT), true);
    assert.equal(isV2CourseAuthorWorkbenchLayout(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT), false);
    assert.equal(isV2CourseAuthorWorkbenchLayout(V3_COURSE_AUTHOR_WORKBENCH_LAYOUT), false);
  });

  it("detects the v3 dual-inspector layout", () => {
    assert.equal(isV3CourseAuthorWorkbenchLayout(V3_COURSE_AUTHOR_WORKBENCH_LAYOUT), true);
    assert.equal(isV3CourseAuthorWorkbenchLayout(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT), false);
  });

  it("migrates a persisted legacy layout to the v7 default on validate", () => {
    const storage = mockLocalStorage();
    (globalThis as { localStorage?: Storage }).localStorage = storage;

    clearPersistedLayout("course-studio");
    storage.removeItem(REVISION_KEY);
    savePersistedLayout("course-studio", LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT);

    const migrated = validateCourseWorkbenchLayout(LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT);
    assert.equal(isLegacyCourseAuthorWorkbenchLayout(migrated), false);
    assert.equal(
      workbenchLayoutFingerprint(migrated),
      defaultCourseAuthorWorkbenchLayoutFingerprint(),
    );
    assert.equal(readCourseWorkbenchLayoutRevision(), 7);
  });

  it("migrates a persisted v3 dual-inspector layout to the v7 default on validate", () => {
    const storage = mockLocalStorage();
    (globalThis as { localStorage?: Storage }).localStorage = storage;

    clearPersistedLayout("course-studio");
    storage.removeItem(REVISION_KEY);
    writeCourseWorkbenchLayoutRevision(3);
    savePersistedLayout("course-studio", V3_COURSE_AUTHOR_WORKBENCH_LAYOUT);

    const migrated = validateCourseWorkbenchLayout(V3_COURSE_AUTHOR_WORKBENCH_LAYOUT);
    assert.equal(isV3CourseAuthorWorkbenchLayout(migrated), false);
    assert.equal(
      workbenchLayoutFingerprint(migrated),
      defaultCourseAuthorWorkbenchLayoutFingerprint(),
    );
    assert.equal(readCourseWorkbenchLayoutRevision(), 7);
  });

  it("keeps a customized persisted layout during migration", () => {
    const storage = mockLocalStorage();
    (globalThis as { localStorage?: Storage }).localStorage = storage;

    clearPersistedLayout("course-studio");
    storage.removeItem(REVISION_KEY);
    writeCourseWorkbenchLayoutRevision(7);

    const custom = structuredClone(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT);
    if (custom.type === "split") {
      custom.ratio = 0.62;
    }
    savePersistedLayout("course-studio", custom);

    const validated = validateCourseWorkbenchLayout(custom);
    assert.equal(validated.type, "split");
    if (validated.type === "split") {
      assert.equal(validated.ratio, 0.62);
    }
    assert.equal(readCourseWorkbenchLayoutRevision(), 7);
  });

  it("remaps legacy block-inspector panes to inspector", () => {
    const storage = mockLocalStorage();
    (globalThis as { localStorage?: Storage }).localStorage = storage;

    clearPersistedLayout("course-studio");
    storage.removeItem(REVISION_KEY);
    writeCourseWorkbenchLayoutRevision(3);

    const migrated = validateCourseWorkbenchLayout(V3_COURSE_AUTHOR_WORKBENCH_LAYOUT);
    assert.doesNotMatch(workbenchLayoutFingerprint(migrated), /e:block-inspector/);
    assert.match(workbenchLayoutFingerprint(migrated), /e:inspector/);
    assert.match(workbenchLayoutFingerprint(migrated), /e:outline/);
  });
});
