import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPreferPositiveW,
  fusionQuatNorm,
  resolveFusionQuatComponents,
} from "../../src/webview/bitstream-app/telemetry/fusionQuaternionDisplay";

test("resolveFusionQuatComponents prefers wire tap", () => {
  const q = resolveFusionQuatComponents({
    sampleQxX10000: 4400,
    wireTapQx: 0.12,
    wireTapQy: 0.34,
    wireTapQz: 0.56,
    wireTapQw: 0.78,
    wireTapLastAtMs: 1000,
  });
  assert.equal(q?.qx, 0.12);
});

test("applyPreferPositiveW flips when qw negative", () => {
  const q = applyPreferPositiveW({ qx: 0.1, qy: 0.2, qz: 0.3, qw: -0.9 });
  assert.ok(q.qw >= 0);
  assert.ok(Math.abs(q.qx + 0.1) < 1e-9);
});

test("fusionQuatNorm is unit length for normalized quat", () => {
  const n = fusionQuatNorm({ qx: 0, qy: 0, qz: 0, qw: 1 });
  assert.ok(Math.abs(n - 1) < 1e-9);
});
