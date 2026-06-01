import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTwinTagCss3dHiresMode,
  resolveCss3dHiresScale,
  twinTagPresetSupportsScanlines,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-graphics.js";
import { resolveTwinTagStyle } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-tag-style.types.js";

test("resolveCss3dHiresScale maps modes to numbers", () => {
  assert.equal(resolveCss3dHiresScale("2"), 2);
  assert.equal(resolveCss3dHiresScale("2.5"), 2.5);
  assert.equal(resolveCss3dHiresScale(undefined), 2);
});

test("normalizeTwinTagCss3dHiresMode defaults to 2x", () => {
  assert.equal(normalizeTwinTagCss3dHiresMode("bogus"), "2");
});

test("twinTagPresetSupportsScanlines excludes minimal glass", () => {
  assert.equal(twinTagPresetSupportsScanlines("industrial-hud"), true);
  assert.equal(twinTagPresetSupportsScanlines("minimal-glass"), false);
});

test("resolveTwinTagStyle exposes graphics fields", () => {
  const style = resolveTwinTagStyle("Motor", { css3dHiresMode: "2.5", tagOpacity: 0.8 }, {});
  assert.equal(style.css3dHiresScale, 2.5);
  assert.equal(style.tagOpacity, 0.8);
});
