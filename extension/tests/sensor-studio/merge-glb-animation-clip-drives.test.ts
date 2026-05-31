import assert from "node:assert/strict";
import test from "node:test";

import { mergeGlbAnimationClipDrivesForPreview } from "../../src/webview/sensor-studio/features/editor/gltf/merge-glb-animation-clip-drives";
import type { FlowWireAnimationV1 } from "../../src/webview/sensor-studio/features/editor/nodes/animation/flow-wire-animation";
import type { GlbAnimationClipPreviewDrive } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-animation-preview-mixer";

function eventDrive(restartNonce: number): GlbAnimationClipPreviewDrive {
  return {
    timeS: 0,
    speed: 2,
    loopMode: "once",
    weight: 0.75,
    trimStartS: 0,
    trimEndS: -1,
    fadeInS: 0,
    fadeOutS: 0,
    restartNonce,
    holdTime: false,
  };
}

test("mergeGlbAnimationClipDrivesForPreview keeps scalar-only clips", () => {
  const merged = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: { walk: 1.25 },
    wire: null,
    eventDrivesByClipName: {},
  });
  assert.equal(merged.times.walk, 1.25);
  assert.equal(merged.drives.walk?.speed, 1);
  assert.equal(merged.drives.walk?.holdTime, true);
});

test("mergeGlbAnimationClipDrivesForPreview wire overrides scalar for same clip", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    clips: {
      walk: { timeS: 0.5, speed: 3, enabled: true, loopMode: "pingpong", weight: 0.4 },
    },
  };
  const merged = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: { walk: 9 },
    wire,
    eventDrivesByClipName: {},
  });
  assert.equal(merged.times.walk, 0.5);
  assert.equal(merged.scales.walk, 3);
  assert.equal(merged.loops.walk, "pingpong");
  assert.equal(merged.weights.walk, 0.4);
});

test("mergeGlbAnimationClipDrivesForPreview event drive overrides wire for same clip", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    clips: {
      door: { timeS: 0.5, speed: 1, enabled: true, loopMode: "loop" },
    },
  };
  const merged = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: {},
    wire,
    eventDrivesByClipName: { door: eventDrive(3) },
  });
  assert.equal(merged.drives.door?.restartNonce, 3);
  assert.equal(merged.scales.door, 2);
  assert.equal(merged.loops.door, "once");
  assert.equal(merged.weights.door, 0.75);
  assert.equal(merged.drives.door?.holdTime, false);
});

test("mergeGlbAnimationClipDrivesForPreview merges distinct clips from each layer", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    clips: {
      bundleClip: { timeS: 2, speed: 1, enabled: true },
    },
  };
  const merged = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: { scalarClip: 4 },
    wire,
    eventDrivesByClipName: { eventClip: eventDrive(1) },
  });
  assert.equal(merged.times.scalarClip, 4);
  assert.equal(merged.times.bundleClip, 2);
  assert.equal(merged.drives.eventClip?.restartNonce, 1);
});

test("mergeGlbAnimationClipDrivesForPreview parallel-all ignores solo clip filter", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    playbackMode: "parallel-all",
    soloClipName: "walk",
    clips: {
      walk: { timeS: 1, speed: 1, enabled: true },
      run: { timeS: 2, speed: 1, enabled: true },
    },
  };
  const merged = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: {},
    wire,
    eventDrivesByClipName: {},
  });
  assert.equal(merged.times.walk, 1);
  assert.equal(merged.times.run, 2);
});

test("mergeGlbAnimationClipDrivesForPreview per-clip solo still filters other clips", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    playbackMode: "per-clip",
    soloClipName: "walk",
    clips: {
      walk: { timeS: 1, speed: 1, enabled: true },
      run: { timeS: 2, speed: 1, enabled: true },
    },
  };
  const merged = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: {},
    wire,
    eventDrivesByClipName: {},
  });
  assert.equal(merged.times.walk, 1);
  assert.equal(merged.times.run, undefined);
});
