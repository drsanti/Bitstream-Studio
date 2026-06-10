import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildPresentationPackFromPageIds } from "../../src/webview/course-studio/content/presentationPackBuild";
import { importPresentationPackToContentDir } from "../../src/webview/course-studio/content/presentationPackImportDisk";
import {
  applyPresentationPackRuntime,
  contentSourcePathForFileName,
  isPackVirtualSourcePath,
  parsePresentationPackAssets,
  setActiveCoursePackOverlay,
} from "../../src/webview/course-studio/content/presentationPackLoad";
import {
  getCoursePageSourcePath,
  loadCoursePage,
  mergeContentFolderPages,
} from "../../src/webview/course-studio/content/pageRegistry";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

const contentDir = join(process.cwd(), "src/webview/course-studio/content");

function pilotPack() {
  const { pack } = buildPresentationPackFromPageIds(contentDir, ["bmi-accel-theory"], {
    id: "test-pack",
    title: "Test pack",
  });
  return pack;
}
test("parsePresentationPackAssets extracts page, diagram, scene, and markdown entries", () => {
  const pack = pilotPack();
  const assets = parsePresentationPackAssets(pack);

  assert.equal(assets.pages.length, 1);
  assert.equal(assets.pages[0]?.page.id, "bmi-accel-theory");
  assert.equal(assets.diagrams.length, 2);
  assert.equal(assets.scenes.length, 1);
  assert.equal(assets.scenes[0]?.scene.id, "pilot-bmi-pcb-orientation");
  assert.equal(assets.markdown.length, 1);
  assert.equal(assets.courses.length, 0);
});

test("applyPresentationPackRuntime registers virtual paths in VSIX mode", () => {
  setActiveCoursePackOverlay(null);
  const pack = pilotPack();
  const result = applyPresentationPackRuntime(pack, {
    readOnly: true,
    sourcePathMode: "virtual",
    primaryPageId: "bmi-accel-theory",
  });

  assert.equal(result.primaryPageId, "bmi-accel-theory");
  const page = loadCoursePage("bmi-accel-theory");
  assert.ok(page != null);
  assert.ok(isPackVirtualSourcePath(result.overlay.pages["bmi-accel-theory"]!.sourcePath));
});

test("applyPresentationPackRuntime uses content paths in dev mode", () => {
  setActiveCoursePackOverlay(null);
  const pack = pilotPack();
  const result = applyPresentationPackRuntime(pack, {
    readOnly: false,
    sourcePathMode: "content",
    primaryPageId: "bmi-accel-theory",
  });

  const sourcePath = result.overlay.pages["bmi-accel-theory"]!.sourcePath;
  assert.equal(
    sourcePath,
    contentSourcePathForFileName("pilot-bmi-accel-theory.page.v1.json"),
  );
});

test("mergeContentFolderPages registers on-disk pages referenced by course outline", () => {
  const newTopicJson = readFileSync(join(contentDir, "new-topic.page.v1.json"), "utf8");
  const page = parsePageV1(JSON.parse(newTopicJson));
  mergeContentFolderPages({
    [page.id]: {
      page,
      sourcePath: contentSourcePathForFileName("new-topic.page.v1.json"),
    },
  });

  assert.equal(loadCoursePage("new-topic")?.id, "new-topic");
  assert.equal(
    getCoursePageSourcePath("new-topic"),
    contentSourcePathForFileName("new-topic.page.v1.json"),
  );
});

test("importPresentationPackToContentDir writes pack files to a temp directory", () => {
  const pack = pilotPack();
  const tempDir = mkdtempSync(join(tmpdir(), "course-pack-import-"));

  try {
    const result = importPresentationPackToContentDir(pack, tempDir, { overwrite: true });
    assert.equal(result.pageIds.length, 1);
    assert.ok(result.written.length >= 4);

    const pageJson = readFileSync(
      join(tempDir, "pilot-bmi-accel-theory.page.v1.json"),
      "utf8",
    );
    assert.ok(pageJson.includes('"id": "bmi-accel-theory"'));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
