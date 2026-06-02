import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyFreePackRelativePath,
  packRelativeFromSyncProgressPath,
  summarizePathsByFreePackCategory,
} from "../../src/webview/startup-checklist/freePackAssetCategories.js";

test("classifyFreePackRelativePath groups cubemap textures", () => {
  assert.equal(
    classifyFreePackRelativePath("textures/cubemap/Yokohama/posx.jpg"),
    "cubemaps",
  );
  assert.equal(classifyFreePackRelativePath("models/tesa-drone/tesa-drone.glb"), "models");
});

test("packRelativeFromSyncProgressPath strips assets/ prefix", () => {
  assert.equal(
    packRelativeFromSyncProgressPath("assets/textures/cubemap/snow/posx.jpg"),
    "textures/cubemap/snow/posx.jpg",
  );
});

test("summarizePathsByFreePackCategory aggregates without exposing paths", () => {
  const summary = summarizePathsByFreePackCategory([
    "textures/cubemap/a/posx.jpg",
    "textures/cubemap/a/negx.jpg",
    "models/foo/foo.glb",
  ]);
  assert.equal(summary.length, 2);
  const cubemaps = summary.find((s) => s.meta.id === "cubemaps");
  assert.equal(cubemaps?.count, 2);
});
