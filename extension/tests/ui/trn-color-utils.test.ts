import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hexToHsla, hslToHex, normalizeTrnColorHex } from "../../src/webview/ui/TRN/trn-color-utils";

describe("trn-color-utils", () => {
  it("round-trips opaque hex through HSL", () => {
    const hsla = hexToHsla("#112233", { h: 0, s: 0, l: 50, a: 100 });
    const hex = hslToHex(hsla.h, hsla.s, hsla.l, hsla.a);
    assert.match(hex, /^#[0-9a-f]{6}$/);
  });

  it("preserves alpha in 8-digit hex", () => {
    assert.equal(hslToHex(120, 80, 40, 100).length, 7);
    assert.equal(hslToHex(120, 80, 40, 50).length, 9);
    const parsed = hexToHsla("#11223380", { h: 0, s: 0, l: 0, a: 100 });
    assert.equal(Math.round(parsed.a), 50);
  });

  it("normalizes hex with optional alpha", () => {
    assert.equal(normalizeTrnColorHex("#AABBCC", "#000000", false), "#aabbcc");
    assert.equal(normalizeTrnColorHex("#aabbccdd", "#000000", true), "#aabbccdd");
    assert.equal(normalizeTrnColorHex("#aabbccdd", "#000000", false), "#aabbcc");
  });
});
