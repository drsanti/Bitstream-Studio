import assert from "node:assert/strict";
import test from "node:test";
import {
  assertGlbByteLength,
  friendlyGlbLoadErrorMessage,
  isLikelyCorruptOrMissingGlbError,
  MIN_VALID_GLB_BYTES,
} from "../../src/webview/model-loader/ui/glb-local-mirror-integrity.js";

test("assertGlbByteLength rejects tiny files", () => {
  assert.throws(
    () => assertGlbByteLength(2, null, "http://localhost/x.glb"),
    /too small/i,
  );
});

test("assertGlbByteLength rejects incomplete download", () => {
  assert.throws(
    () => assertGlbByteLength(2048, 7896744, "http://localhost/x.glb"),
    /incomplete/i,
  );
});

test("assertGlbByteLength accepts healthy size", () => {
  assert.doesNotThrow(() =>
    assertGlbByteLength(MIN_VALID_GLB_BYTES + 100, MIN_VALID_GLB_BYTES + 100, "x"),
  );
});

test("friendlyGlbLoadErrorMessage maps parse corruption", () => {
  assert.equal(
    isLikelyCorruptOrMissingGlbError("Invalid typed array length: 2"),
    true,
  );
  const friendly = friendlyGlbLoadErrorMessage("Invalid typed array length: 2");
  assert.match(friendly, /TERNION pack/i);
  assert.notEqual(friendly, "Invalid typed array length: 2");
});

test("friendlyGlbLoadErrorMessage passes through unrelated errors", () => {
  const msg = "WebGL context lost";
  assert.equal(friendlyGlbLoadErrorMessage(msg), msg);
});
