import assert from "node:assert/strict";
import test from "node:test";
import {
  findWorstEnabledSensorAge,
  formatSensorDecodeChipLabel,
  resolveStickyWorstSensorDisplay,
} from "../../src/webview/bitstream-shell/ui/BitstreamTelemetryRxBadges";

const NOW = 1_000_000;
const bySourceId = {} as Record<number, { enabled?: boolean; samplingIntervalMs?: number }>;

test("findWorstEnabledSensorAge picks the oldest enabled decode", () => {
  const lastAtByHint = {
    sht40: NOW - 961,
    dps368: NOW - 120,
    bmm350: NOW - 400,
    bmi270: NOW - 20,
  };
  const worst = findWorstEnabledSensorAge(lastAtByHint, NOW, bySourceId);
  assert.equal(worst?.hint, "sht40");
  assert.equal(worst?.ageMs, 961);
});

test("formatSensorDecodeChipLabel names the pinned sensor", () => {
  assert.equal(formatSensorDecodeChipLabel("sht40", 961), "SHT · 961ms ago");
});

test("resolveStickyWorstSensorDisplay keeps climbing one sensor until it updates", () => {
  const lastAtByHint = {
    sht40: NOW - 800,
    dps368: NOW - 790,
    bmm350: NOW - 400,
    bmi270: NOW - 20,
  };
  const first = resolveStickyWorstSensorDisplay({
    pin: null,
    lastAtByHint,
    nowMs: NOW,
    bySourceId,
  });
  assert.equal(first?.display.hint, "sht40");
  assert.equal(first?.display.ageMs, 800);

  const tick = resolveStickyWorstSensorDisplay({
    pin: first!.pin,
    lastAtByHint,
    nowMs: NOW + 161,
    bySourceId,
  });
  assert.equal(tick?.display.hint, "sht40");
  assert.equal(tick?.display.ageMs, 961);

  const afterShtUpdate = resolveStickyWorstSensorDisplay({
    pin: tick!.pin,
    lastAtByHint: {
      ...lastAtByHint,
      sht40: NOW + 161,
    },
    nowMs: NOW + 161,
    bySourceId,
  });
  assert.equal(afterShtUpdate?.display.hint, "dps368");
  assert.equal(afterShtUpdate?.display.ageMs, 951);
});
