import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isStageProceduralSpawnKind,
  meshCatalogIdForSpawnKind,
  spawnKindTitle,
  STAGE_PROCEDURAL_SPAWN_KINDS,
} from "../../src/webview/sensor-studio/core/stage/stage-procedural-spawn-kind.ts";

describe("stage-procedural-spawn-kind", () => {
  it("maps spawn kinds to mesh catalog ids", () => {
    assert.equal(meshCatalogIdForSpawnKind("box"), "mesh-box");
    assert.equal(meshCatalogIdForSpawnKind("sphere"), "mesh-sphere");
    assert.equal(meshCatalogIdForSpawnKind("plane"), "mesh-plane");
  });

  it("provides display titles", () => {
    assert.equal(spawnKindTitle("box"), "Box");
    assert.equal(spawnKindTitle("sphere"), "Sphere");
    assert.equal(spawnKindTitle("plane"), "Plane");
  });

  it("validates known kinds", () => {
    for (const kind of STAGE_PROCEDURAL_SPAWN_KINDS) {
      assert.equal(isStageProceduralSpawnKind(kind), true);
    }
    assert.equal(isStageProceduralSpawnKind("cone"), false);
  });
});
