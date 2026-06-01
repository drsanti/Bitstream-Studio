import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTwinTagHexColor,
  resolveTwinTagCardAppearance,
  resolveTwinTagGlobalStyle,
  resolveTwinTagStyle,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-tag-style.types.js";

test("normalizeTwinTagHexColor accepts hex and rgba", () => {
  assert.equal(normalizeTwinTagHexColor("#AbC", "#000000"), "#aabbcc");
  assert.equal(
    normalizeTwinTagHexColor("rgba(9, 9, 11, 0.82)", "#000000"),
    "rgba(9, 9, 11, 0.82)",
  );
  assert.equal(normalizeTwinTagHexColor("bad", "#112233"), "#112233");
});

test("resolveTwinTagGlobalStyle applies to all tags", () => {
  const shared = resolveTwinTagGlobalStyle({ widthPx: 200, worldScale: 0.005 });
  const a = resolveTwinTagStyle("A", { widthPx: 200, worldScale: 0.005 }, {});
  const b = resolveTwinTagStyle("B", { widthPx: 200, worldScale: 0.005 }, {});
  assert.equal(a.widthPx, 200);
  assert.equal(b.worldScale, 0.005);
  assert.equal(shared.widthPx, 200);
});

test("resolveTwinTagCardAppearance uses custom colors when enabled", () => {
  const style = resolveTwinTagStyle("Motor", {}, {
    useCustomColors: true,
    borderColor: "#ff0000",
    backgroundColor: "#111111",
    textColor: "#ffffff",
  });
  const { className, style: css } = resolveTwinTagCardAppearance("error", style, false);
  assert.equal(className.includes("border-rose"), false);
  assert.equal(css.borderColor, "#ff0000");
  assert.equal(css.backgroundColor, "#111111");
  assert.equal(css.color, "#ffffff");
});
