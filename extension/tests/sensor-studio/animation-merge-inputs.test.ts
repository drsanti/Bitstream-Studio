import assert from "node:assert/strict";
import test from "node:test";

import {
  ANIMATION_MERGE_INPUT_COUNT_KEY,
  computeAnimationMergeInputHandles,
  listAnimationMergeInputHandleIds,
  pruneAnimationMergeEdges,
  readAnimationMergeInputCount,
} from "../../src/webview/sensor-studio/features/editor/nodes/animation/animation-merge-inputs";

test("readAnimationMergeInputCount clamps to 2–8", () => {
  assert.equal(readAnimationMergeInputCount({}), 3);
  assert.equal(readAnimationMergeInputCount({ [ANIMATION_MERGE_INPUT_COUNT_KEY]: 1 }), 2);
  assert.equal(readAnimationMergeInputCount({ [ANIMATION_MERGE_INPUT_COUNT_KEY]: 7 }), 7);
  assert.equal(readAnimationMergeInputCount({ [ANIMATION_MERGE_INPUT_COUNT_KEY]: 99 }), 8);
});

test("computeAnimationMergeInputHandles labels inputs 1..N", () => {
  const handles = computeAnimationMergeInputHandles({ [ANIMATION_MERGE_INPUT_COUNT_KEY]: 4 });
  assert.equal(handles.length, 4);
  assert.deepEqual(
    handles.map((h) => h.id),
    ["a", "b", "c", "d"],
  );
  assert.deepEqual(
    handles.map((h) => h.label),
    ["1", "2", "3", "4"],
  );
});

test("pruneAnimationMergeEdges removes wires on dropped inputs", () => {
  const nodes = [
    {
      id: "m1",
      type: "studio" as const,
      position: { x: 0, y: 0 },
      data: {
        nodeId: "animation-merge",
        defaultConfig: { [ANIMATION_MERGE_INPUT_COUNT_KEY]: 2 },
      },
    },
  ];
  const edges = [
    { id: "e1", source: "a1", target: "m1", targetHandle: "a" },
    { id: "e2", source: "b1", target: "m1", targetHandle: "b" },
    { id: "e3", source: "c1", target: "m1", targetHandle: "c" },
  ];
  const pruned = pruneAnimationMergeEdges(nodes, edges);
  assert.deepEqual(
    pruned.map((e) => e.id),
    ["e1", "e2"],
  );
});

test("listAnimationMergeInputHandleIds matches count", () => {
  assert.deepEqual(
    listAnimationMergeInputHandleIds({ [ANIMATION_MERGE_INPUT_COUNT_KEY]: 5 }),
    ["a", "b", "c", "d", "e"],
  );
});
