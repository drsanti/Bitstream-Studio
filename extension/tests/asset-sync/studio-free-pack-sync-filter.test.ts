import assert from "node:assert/strict";
import test from "node:test";
import {
  filterRepoPathsToStudioFreePackCatalog,
  isStudioAlignedFreePackRepoPath,
  parseFreePackModelFolderFromRepoPath,
  STUDIO_FREE_PACK_MODEL_FOLDER_IDS,
} from "../../src/asset-sync/studioFreePackCatalog";

test("studio catalog has nine models and excludes robot-4th-project", () => {
  assert.equal(STUDIO_FREE_PACK_MODEL_FOLDER_IDS.length, 9);
  assert.ok(!STUDIO_FREE_PACK_MODEL_FOLDER_IDS.includes("robot-4th-project"));
});

test("parseFreePackModelFolderFromRepoPath", () => {
  assert.equal(
    parseFreePackModelFolderFromRepoPath(
      "assets/models/psoc-e84-ai/psoc-e84-ai.glb",
    ),
    "psoc-e84-ai",
  );
  assert.equal(parseFreePackModelFolderFromRepoPath("assets/models/manifest.json"), null);
  assert.equal(
    parseFreePackModelFolderFromRepoPath("assets/textures/cubemap/Yokohama/posx.jpg"),
    null,
  );
});

test("isStudioAlignedFreePackRepoPath skips retired upstream models", () => {
  assert.equal(
    isStudioAlignedFreePackRepoPath("assets/models/psoc-e84-ai/psoc-e84-ai.glb"),
    true,
  );
  assert.equal(
    isStudioAlignedFreePackRepoPath(
      "assets/models/robot-4th-project/robot-4th-project.glb",
    ),
    false,
  );
  assert.equal(isStudioAlignedFreePackRepoPath("assets/models/manifest.json"), true);
  assert.equal(
    isStudioAlignedFreePackRepoPath("assets/textures/cubemap/Yokohama/posx.jpg"),
    true,
  );
});

test("filterRepoPathsToStudioFreePackCatalog", () => {
  const input = [
    "assets/models/psoc-e84-ai/psoc-e84-ai.glb",
    "assets/models/robot-4th-project/robot-4th-project.glb",
    "assets/models/robot-4th-project/extra.json",
    "assets/models/manifest.json",
    "assets/feed.json",
  ];
  const { kept, skipped } = filterRepoPathsToStudioFreePackCatalog(input);
  assert.deepEqual(kept, [
    "assets/models/psoc-e84-ai/psoc-e84-ai.glb",
    "assets/models/manifest.json",
    "assets/feed.json",
  ]);
  assert.equal(skipped.length, 2);
  assert.ok(skipped.every((p) => p.includes("robot-4th-project")));
});
