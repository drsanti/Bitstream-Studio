import assert from "node:assert/strict";
import test from "node:test";

import {
  interpolateSweepHz,
  resolveOscillatorSweepHz,
  resolveSweepPhase,
} from "../../src/webview/sensor-studio/core/audio/oscillator-sweep";

test("interpolateSweepHz log curve is monotonic between bounds", () => {
  const mid = interpolateSweepHz(0.5, 100, 4000, "log");
  assert.ok(mid > 100 && mid < 4000);
  assert.equal(interpolateSweepHz(0, 100, 4000, "log"), 100);
  assert.equal(interpolateSweepHz(1, 100, 4000, "log"), 4000);
});

test("resolveSweepPhase once up completes at 1", () => {
  assert.equal(
    resolveSweepPhase({
      elapsedS: 2,
      periodS: 2,
      direction: "up",
      mode: "once",
    }),
    1,
  );
});

test("resolveOscillatorSweepHz once mode requires gate and anchors on first frame", () => {
  const off = resolveOscillatorSweepHz({
    nowMs: 1000,
    baseFreqHz: 440,
    gate: false,
    sweepOnceAnchorMs: null,
    params: {
      sweepEnabled: true,
      sweepStartHz: 100,
      sweepEndHz: 800,
      sweepPeriodS: 2,
      sweepMode: "once",
      sweepDirection: "up",
      sweepCurve: "linear",
    },
  });
  assert.equal(off.freqHz, 440);
  assert.equal(off.nextSweepOnceAnchorMs, null);

  const on = resolveOscillatorSweepHz({
    nowMs: 1000,
    baseFreqHz: 440,
    gate: true,
    sweepOnceAnchorMs: null,
    params: {
      sweepEnabled: true,
      sweepStartHz: 100,
      sweepEndHz: 800,
      sweepPeriodS: 2,
      sweepMode: "once",
      sweepDirection: "up",
      sweepCurve: "linear",
    },
  });
  assert.equal(on.nextSweepOnceAnchorMs, 1000);
  assert.equal(on.freqHz, 100);
});
