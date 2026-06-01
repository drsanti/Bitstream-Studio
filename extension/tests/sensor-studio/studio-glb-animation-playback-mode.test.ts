import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceGlbAnimationSequenceAfterMixerTick,
  filterGlbAnimationDrivesForPreview,
  pickInitialSequenceClipName,
  readStudioGlbAnimationPlaybackMode,
  resetGlbAnimationSequencePlaybackState,
  resolveStudioGlbAnimationClipOrder,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode";
import type { GlbAnimationClipPreviewDrive } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-animation-preview-mixer";

function drive(overrides: Partial<GlbAnimationClipPreviewDrive> = {}): GlbAnimationClipPreviewDrive {
  return {
    timeS: 0,
    speed: 1,
    loopMode: "once",
    weight: 1,
    trimStartS: 0,
    trimEndS: 2,
    fadeInS: 0,
    fadeOutS: 0,
    holdTime: true,
    ...overrides,
  };
}

test("readStudioGlbAnimationPlaybackMode defaults and coerces", () => {
  assert.equal(readStudioGlbAnimationPlaybackMode(undefined), "per-clip");
  assert.equal(readStudioGlbAnimationPlaybackMode({ animationPlaybackMode: "parallel-all" }), "parallel-all");
  assert.equal(readStudioGlbAnimationPlaybackMode({ animationPlaybackMode: "nope" }), "per-clip");
});

test("pickInitialSequenceClipName respects clip order", () => {
  const drives = { b: drive(), a: drive() };
  assert.equal(pickInitialSequenceClipName(["a", "b"], drives), "a");
  assert.equal(pickInitialSequenceClipName(["missing", "b"], drives), "b");
  assert.equal(pickInitialSequenceClipName(["missing"], drives), null);
});

test("filterGlbAnimationDrivesForPreview parallel-all lets mixer advance time", () => {
  const drives = { walk: drive(), run: drive() };
  const filtered = filterGlbAnimationDrivesForPreview({
    drives,
    playbackMode: "parallel-all",
    clipOrder: ["walk", "run"],
    sequenceState: { activeClipName: null },
  });
  assert.equal(filtered.walk?.holdTime, false);
  assert.equal(filtered.run?.holdTime, false);
});

test("filterGlbAnimationDrivesForPreview sequence exposes one clip with holdTime false", () => {
  const drives = {
    first: drive({ loopMode: undefined }),
    second: drive(),
  };
  const sequenceState = { activeClipName: null as string | null };
  const filtered = filterGlbAnimationDrivesForPreview({
    drives,
    playbackMode: "sequence",
    clipOrder: ["first", "second"],
    sequenceState,
  });
  assert.equal(Object.keys(filtered).length, 1);
  assert.equal(sequenceState.activeClipName, "first");
  assert.equal(filtered.first?.holdTime, false);
  assert.equal(filtered.first?.loopMode, "once");
});

test("advanceGlbAnimationSequenceAfterMixerTick moves to next once clip at trim end", () => {
  const drives = {
    intro: drive({ trimEndS: 1 }),
    outro: drive({ trimEndS: 1 }),
  };
  const clipActions = new Map<string, { time: number; getClip: () => { duration: number } }>([
    ["intro", { time: 1, getClip: () => ({ duration: 2 }) }],
    ["outro", { time: 0, getClip: () => ({ duration: 2 }) }],
  ]);
  const sequenceState = { activeClipName: "intro" as string | null };
  advanceGlbAnimationSequenceAfterMixerTick({
    clipActions: clipActions as never,
    drives,
    clipOrder: ["intro", "outro"],
    sequenceState,
  });
  assert.equal(sequenceState.activeClipName, "outro");
});

test("resetGlbAnimationSequencePlaybackState clears active clip", () => {
  const st = { activeClipName: "walk" as string | null };
  resetGlbAnimationSequencePlaybackState(st);
  assert.equal(st.activeClipName, null);
});

test("filterGlbAnimationDrivesForPreview sequence falls back to drive keys when clipOrder empty", () => {
  const drives = {
    alpha: drive(),
    beta: drive(),
  };
  const sequenceState = { activeClipName: null as string | null };
  const filtered = filterGlbAnimationDrivesForPreview({
    drives,
    playbackMode: "sequence",
    clipOrder: [],
    sequenceState,
  });
  assert.equal(Object.keys(filtered).length, 1);
  assert.equal(sequenceState.activeClipName, "alpha");
});

test("resolveStudioGlbAnimationClipOrder appends unknown clips", () => {
  assert.deepEqual(
    resolveStudioGlbAnimationClipOrder({ clipOrder: ["b"], clipNames: ["a", "b"] }),
    ["b", "a"],
  );
});
