import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOTSTRAP_PSOC_GLB_RELATIVE_PATH,
  BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS,
  bootstrapPackRelativeToRepoPath,
  bootstrapRequiredRepoPaths,
} from "../../src/asset-bootstrap/bootstrapRequiredAssets.js";

test("bootstrap required paths include PSOC GLB and bridge cubemap faces", () => {
  assert.ok(
    BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS.includes(BOOTSTRAP_PSOC_GLB_RELATIVE_PATH),
  );
  assert.equal(BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS.length, 7);
  for (const face of ["posx", "negx", "posy", "negy", "posz", "negz"]) {
    assert.ok(
      BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS.includes(
        `textures/cubemap/bridge/${face}.jpg`,
      ),
    );
  }
});

test("bootstrap pack paths map to GitHub assets/ repo paths", () => {
  assert.equal(
    bootstrapPackRelativeToRepoPath(BOOTSTRAP_PSOC_GLB_RELATIVE_PATH),
    "assets/models/psoc-e84-ai/psoc-e84-ai.glb",
  );
  assert.equal(bootstrapRequiredRepoPaths().length, 7);
  assert.ok(bootstrapRequiredRepoPaths().every((p) => p.startsWith("assets/")));
});
