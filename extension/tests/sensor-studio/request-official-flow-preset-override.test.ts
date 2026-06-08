import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOfficialOverrideMismatchMessage,
  officialFlowPresetOverrideHint,
  shouldConfirmOfficialOverrideMismatch,
} from "../../src/webview/sensor-studio/features/editor/flow-library/request-official-flow-preset-override";

test("shouldConfirmOfficialOverrideMismatch when last loaded differs", () => {
  assert.equal(
    shouldConfirmOfficialOverrideMismatch({
      lastLoadedOfficialPresetId: "official-audio-oscillator-tone",
      targetPresetId: "official-stage-scene-output",
    }),
    true,
  );
  assert.equal(
    shouldConfirmOfficialOverrideMismatch({
      lastLoadedOfficialPresetId: "official-audio-oscillator-tone",
      targetPresetId: "official-audio-oscillator-tone",
    }),
    false,
  );
  assert.equal(
    shouldConfirmOfficialOverrideMismatch({
      lastLoadedOfficialPresetId: null,
      targetPresetId: "official-stage-scene-output",
    }),
    false,
  );
});

test("buildOfficialOverrideMismatchMessage names both presets", () => {
  const message = buildOfficialOverrideMismatchMessage({
    targetPresetName: "Stage scene output",
    lastLoadedOfficialPresetName: "Audio oscillator tone",
  });
  assert.match(message, /Audio oscillator tone/);
  assert.match(message, /Stage scene output/);
});

test("officialFlowPresetOverrideHint warns on canvas mismatch", () => {
  const hint = officialFlowPresetOverrideHint({
    presetName: "Stage scene output",
    canvasMatchesLoaded: false,
    lastLoadedOfficialPresetName: "Audio oscillator tone",
  });
  assert.match(hint, /current canvas/);
  assert.match(hint, /Audio oscillator tone/);
  assert.match(hint, /regenerates bundled presets/);
});
