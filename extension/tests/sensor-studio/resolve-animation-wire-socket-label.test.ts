import assert from "node:assert/strict";
import test from "node:test";

import type { FlowWireAnimationV1 } from "../../src/webview/sensor-studio/features/editor/nodes/animation/flow-wire-animation";
import {
  resolveAnimationWireSocketBadgeText,
  resolveAnimationWireSocketLabel,
  resolveAnimationWireSocketTooltip,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/resolve-animation-wire-socket-label";

const SINGLE_CLIP: FlowWireAnimationV1 = {
  version: 1,
  clips: {
    arm_pick: { timeS: 0, speed: 1, enabled: true, loopMode: "loop" },
  },
};

test("resolveAnimationWireSocketLabel shows clip name when one enabled clip", () => {
  assert.equal(resolveAnimationWireSocketLabel({ wire: SINGLE_CLIP }), "arm_pick");
});

test("resolveAnimationWireSocketLabel shows name +N for multiple clips", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    clips: {
      arm_pick: { timeS: 0, enabled: true },
      idle_rotor: { timeS: 0, enabled: true },
      door_open: { timeS: 0, enabled: true },
    },
  };
  assert.equal(resolveAnimationWireSocketLabel({ wire }), "arm_pick +2");
});

test("resolveAnimationWireSocketLabel uses clip count when the first name is long", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    clips: {
      very_long_clip_name_a: { timeS: 0, enabled: true },
      very_long_clip_name_b: { timeS: 0, enabled: true },
    },
  };
  assert.equal(resolveAnimationWireSocketLabel({ wire }), "2 clips");
});

test("resolveAnimationWireSocketLabel ignores disabled clips in the count", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    clips: {
      arm_pick: { timeS: 0, enabled: true },
      hidden: { timeS: 0, enabled: false },
    },
  };
  assert.equal(resolveAnimationWireSocketLabel({ wire }), "arm_pick");
});

test("resolveAnimationWireSocketBadgeText adds playback mode suffix on bundle nodes", () => {
  const wire: FlowWireAnimationV1 = {
    version: 1,
    playbackMode: "parallel-all",
    clips: {
      a: { timeS: 0, enabled: true },
      b: { timeS: 0, enabled: true },
    },
  };
  const badge = resolveAnimationWireSocketBadgeText({
    wire,
    catalogNodeId: "glb-animation-bundle",
  });
  assert.equal(badge.label, "a +1 · parallel");
  assert.match(badge.title, /2 clips/);
  assert.match(badge.title, /a, b/);
});

test("resolveAnimationWireSocketTooltip lists enabled clip names", () => {
  const tooltip = resolveAnimationWireSocketTooltip(SINGLE_CLIP);
  assert.match(tooltip, /1 clip/);
  assert.match(tooltip, /arm_pick/);
});
