import assert from "node:assert/strict";
import test from "node:test";

import {
  blendFlowWireAnimationsV1,
  mergeFlowWireAnimationsV1,
} from "../../src/webview/sensor-studio/features/editor/nodes/animation/animation-wire-merge";
import { mergeFlowWireAnimationIntoClipDrives } from "../../src/webview/sensor-studio/features/editor/nodes/animation/flow-wire-animation";

test("mergeFlowWireAnimationsV1 combines distinct clip names", () => {
  const merged = mergeFlowWireAnimationsV1([
    { version: 1, clips: { Walk: { timeS: 0, speed: 1, weight: 1, enabled: true } } },
    { version: 1, clips: { Run: { timeS: 1, speed: 2, weight: 0.5, enabled: true } } },
  ]);
  assert.equal(merged.clips.Walk?.timeS, 0);
  assert.equal(merged.clips.Run?.timeS, 1);
  assert.equal(merged.clips.Run?.speed, 2);
});

test("mergeFlowWireAnimationsV1 later input wins on same clip name", () => {
  const merged = mergeFlowWireAnimationsV1([
    { version: 1, clips: { Idle: { timeS: 0, speed: 1, weight: 1, enabled: true } } },
    { version: 1, clips: { Idle: { timeS: 2.5, speed: 1, weight: 1, enabled: true } } },
  ]);
  assert.equal(merged.clips.Idle?.timeS, 2.5);
});

test("blendFlowWireAnimationsV1 scales weights by factor", () => {
  const blended = blendFlowWireAnimationsV1({
    wireA: { version: 1, clips: { Walk: { timeS: 0, weight: 1, enabled: true } } },
    wireB: { version: 1, clips: { Run: { timeS: 0, weight: 1, enabled: true } } },
    factor: 0.5,
  });
  assert.equal(blended.clips.Walk?.weight, 0.5);
  assert.equal(blended.clips.Run?.weight, 0.5);
  assert.equal(blended.playbackMode, "parallel-all");
});

test("blendFlowWireAnimationsV1 factor 1 keeps B only", () => {
  const blended = blendFlowWireAnimationsV1({
    wireA: { version: 1, clips: { Walk: { timeS: 0, weight: 1, enabled: true } } },
    wireB: { version: 1, clips: { Run: { timeS: 0, weight: 1, enabled: true } } },
    factor: 1,
  });
  assert.equal(blended.clips.Walk?.weight, 0);
  assert.equal(blended.clips.Run?.weight, 1);
});

test("blendFlowWireAnimationsV1 applies crossfade ms to A/B clips", () => {
  const blended = blendFlowWireAnimationsV1({
    wireA: { version: 1, clips: { Walk: { timeS: 0, weight: 1, enabled: true } } },
    wireB: { version: 1, clips: { Run: { timeS: 0, weight: 1, enabled: true } } },
    factor: 0.5,
    crossfadeS: 0.25,
  });
  assert.equal(blended.clips.Walk?.fadeOutMs, 250);
  assert.equal(blended.clips.Run?.fadeInMs, 250);
});

test("merged blend wires feed preview mixer drives", () => {
  const merged = mergeFlowWireAnimationsV1([
    { version: 1, clips: { A: { timeS: 1, weight: 1, enabled: true } } },
    { version: 1, clips: { B: { timeS: 2, weight: 1, enabled: true } } },
  ]);
  const { drives, weights } = mergeFlowWireAnimationIntoClipDrives({
    scalarTimesByClipName: {},
    wire: merged,
  });
  assert.equal(drives.A?.timeS, 1);
  assert.equal(drives.B?.timeS, 2);
  assert.equal(weights.A, 1);
  assert.equal(weights.B, 1);
});
