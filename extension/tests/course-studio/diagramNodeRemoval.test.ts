import assert from "node:assert/strict";
import test from "node:test";

import { isDiagramFrameNode } from "../../src/webview/course-studio/maintainer/diagramNodeRemoval";
import type { DiagramNodeV1 } from "../../src/webview/course-studio/schemas/diagram.v1";

test("isDiagramFrameNode matches rect id frame only", () => {
  const frame: DiagramNodeV1 = {
    id: "frame",
    type: "rect",
    x: 0,
    y: 0,
    width: 100,
    height: 80,
  };
  const other: DiagramNodeV1 = {
    id: "proof-mass",
    type: "rect",
    x: 0,
    y: 0,
    width: 20,
    height: 20,
  };

  assert.equal(isDiagramFrameNode(frame), true);
  assert.equal(isDiagramFrameNode(other), false);
});
