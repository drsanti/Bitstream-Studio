import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  applyUserPreviewTransportToClipActions,
  flowOwnsGlbPreviewAnimation,
} from "../../src/webview/sensor-studio/features/editor/gltf/glb-preview-user-transport";

test("flowOwnsGlbPreviewAnimation is false without drives", () => {
  assert.equal(
    flowOwnsGlbPreviewAnimation({ structuredDrives: {}, legacyTimesByClip: {} }),
    false,
  );
});

test("flowOwnsGlbPreviewAnimation is true with structured drives", () => {
  assert.equal(
    flowOwnsGlbPreviewAnimation({
      structuredDrives: {
        Walk: {
          timeS: 0,
          speed: 1,
          loopMode: "loop",
          weight: 1,
          trimStartS: 0,
          trimEndS: -1,
          fadeInS: 0,
          fadeOutS: 0,
        },
      },
      legacyTimesByClip: {},
    }),
    true,
  );
});

test("applyUserPreviewTransportToClipActions play unpauses clips", () => {
  const clip = new THREE.AnimationClip("Walk", 1, []);
  const root = new THREE.Object3D();
  const mixer = new THREE.AnimationMixer(root);
  const ac = mixer.clipAction(clip);
  ac.play();
  ac.paused = true;
  const map = new Map<string, THREE.AnimationAction>([["Walk", ac]]);
  applyUserPreviewTransportToClipActions({ clipActions: map, transport: "playing" });
  assert.equal(ac.paused, false);
  applyUserPreviewTransportToClipActions({ clipActions: map, transport: "stopped" });
  assert.equal(ac.paused, true);
  assert.equal(ac.time, 0);
});
