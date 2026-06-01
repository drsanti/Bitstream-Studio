import assert from "node:assert/strict";
import test from "node:test";
import {
  readLocalizedString,
  resolveTwinComponentDisplayLabel,
  resolveTwinSignalDisplayLabel,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-localize.js";
import {
  twinHealthLabelLocalized,
  twinI18n,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-i18n.js";

test("twinHealthLabelLocalized returns Thai for th locale", () => {
  assert.equal(twinHealthLabelLocalized("ok", "th"), "ปกติ");
  assert.equal(twinHealthLabelLocalized("error", "en"), "Fault");
});

test("readLocalizedString falls back to primary when translation missing", () => {
  assert.equal(readLocalizedString("th", "Gimbal 1", { th: "กิมบอล 1" }), "กิมบอล 1");
  assert.equal(readLocalizedString("th", "Gimbal 1", undefined), "Gimbal 1");
  assert.equal(readLocalizedString("en", "Gimbal 1", { th: "กิมบอล 1" }), "Gimbal 1");
});

test("resolveTwinComponentDisplayLabel uses labelLocales", () => {
  const label = resolveTwinComponentDisplayLabel(
    {
      id: "gimbal-1",
      label: "Gimbal 1",
      labelLocales: { th: "กิมบอล 1" },
      signals: [],
    },
    "th",
  );
  assert.equal(label, "กิมบอล 1");
});

test("resolveTwinSignalDisplayLabel uses labelLocales", () => {
  const label = resolveTwinSignalDisplayLabel(
    {
      key: "load",
      label: "Drive load",
      labelLocales: { th: "โหลดขับ" },
      unit: "%",
    },
    "th",
  );
  assert.equal(label, "โหลดขับ");
});

test("twinI18n preset keys exist for all locales", () => {
  assert.ok(twinI18n("en", "preset.industrial-hud").length > 0);
  assert.ok(twinI18n("th", "mapping.columnSensor").length > 0);
});
