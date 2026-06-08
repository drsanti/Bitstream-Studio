import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getFlowPresetPublishStatus,
  resolveFreeAssetsRepo,
} from "../../scripts/flow-preset-publish-io.mjs";

const extensionRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("getFlowPresetPublishStatus reports bundled pack", () => {
  const status = getFlowPresetPublishStatus(extensionRoot);
  assert.ok(status.bundledJsonCount >= 1);
  assert.match(status.bundledPackPath, /flow-preset/);
});

test("resolveFreeAssetsRepo defaults beside monorepo", () => {
  const repo = resolveFreeAssetsRepo(extensionRoot);
  assert.match(repo, /ternion-3d-assets-free$/);
});
