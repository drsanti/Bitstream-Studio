import assert from "node:assert/strict";
import test from "node:test";

import {
  computeAnimationMixInputHandles,
  readMixWeights,
} from "../../src/webview/sensor-studio/features/editor/nodes/animation/animation-mix-inputs";
import { mixFlowWireAnimationsV1 } from "../../src/webview/sensor-studio/features/editor/nodes/animation/animation-wire-merge";
import type { FlowWireAnimationV1 } from "../../src/webview/sensor-studio/features/editor/nodes/animation/flow-wire-animation";

function clipWire(name: string, weight = 1): FlowWireAnimationV1 {
  return {
    version: 1,
    clips: {
      [name]: { timeS: 0, weight, enabled: true },
    },
  };
}

test("computeAnimationMixInputHandles pairs animation and weight sockets", () => {
  const handles = computeAnimationMixInputHandles({ animationInputCount: 2 });
  assert.deepEqual(
    handles.map((h) => h.id),
    ["a", "wa", "b", "wb"],
  );
});

test("mixFlowWireAnimationsV1 normalizes weights and scales clip weights", () => {
  const out = mixFlowWireAnimationsV1({
    wires: [clipWire("Walk", 1), clipWire("Run", 1)],
    weights: [1, 1],
    normalize: true,
  });
  assert.equal(out.clips.Walk?.weight, 0.5);
  assert.equal(out.clips.Run?.weight, 0.5);
});

test("mixFlowWireAnimationsV1 honors dominant weight", () => {
  const out = mixFlowWireAnimationsV1({
    wires: [clipWire("Walk", 1), clipWire("Run", 1)],
    weights: [1, 0],
    normalize: true,
  });
  assert.equal(out.clips.Walk?.weight, 1);
  assert.equal(out.clips.Run?.weight, 0);
});

test("readMixWeights pads to input count", () => {
  const weights = readMixWeights({ mixWeights: [0.8] }, 3);
  assert.equal(weights.length, 3);
  assert.equal(weights[0], 0.8);
});
