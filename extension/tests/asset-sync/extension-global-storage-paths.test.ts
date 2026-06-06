import assert from "node:assert/strict";
import * as path from "node:path";
import test from "node:test";
import {
  EXTENSION_GLOBAL_STORAGE_FOLDER,
  listEditorGlobalStorageDirsForHome,
  resolveFreePackMirrorRootFromAssetsRoot,
} from "../../src/extensionGlobalStoragePaths";

test("Windows globalStorage candidates use AppData\\Roaming", () => {
  const dirs = listEditorGlobalStorageDirsForHome("C:\\Users\\alice", "win32");
  assert.equal(dirs.length, 3);
  assert.equal(
    dirs[0],
    path.join(
      "C:\\Users\\alice",
      "AppData",
      "Roaming",
      "Cursor",
      "User",
      "globalStorage",
    ),
  );
  assert.ok(dirs[1]?.includes("Code"));
  assert.ok(dirs[2]?.includes("VSCodium"));
});

test("macOS globalStorage candidates use Library/Application Support", () => {
  const dirs = listEditorGlobalStorageDirsForHome("/Users/alice", "darwin");
  assert.equal(dirs.length, 3);
  assert.equal(
    dirs[0],
    path.join(
      "/Users/alice",
      "Library",
      "Application Support",
      "Cursor",
      "User",
      "globalStorage",
    ),
  );
  assert.ok(dirs[1]?.includes("Code"));
});

test("Linux globalStorage candidates use XDG config home", () => {
  const dirs = listEditorGlobalStorageDirsForHome("/home/alice", "linux");
  assert.equal(dirs.length, 3);
  assert.equal(
    dirs[0],
    path.join("/home/alice", ".config", "Cursor", "User", "globalStorage"),
  );
});

test("resolveFreePackMirrorRootFromAssetsRoot accepts assets or free root", () => {
  const assets = path.join("tmp", "gs", EXTENSION_GLOBAL_STORAGE_FOLDER, "assets");
  const free = path.join(assets, "free");
  assert.equal(resolveFreePackMirrorRootFromAssetsRoot(assets), path.resolve(free));
  assert.equal(resolveFreePackMirrorRootFromAssetsRoot(free), path.resolve(free));
});
