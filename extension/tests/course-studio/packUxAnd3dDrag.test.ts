import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { buildPresentationPackFromContentDir } from "../../src/webview/course-studio/content/buildPresentationPackFromContentDir";
import {
  createDefaultDiagram3dModelNode,
  patchDiagram3dNode,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dNodeMutations";
import { roundDiagram3dPosition } from "../../src/webview/course-studio/runtime/diagram/diagram3dPositionSnap";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";

const contentDir = join(process.cwd(), "src/webview/course-studio/content");

test("buildPresentationPackFromContentDir includes pilot page assets", () => {
  const pack = buildPresentationPackFromContentDir(contentDir);
  assert.equal(pack.version, 1);
  assert.ok(pack.files["pages/pilot-bmi-accel-theory.page.v1.json"] != null);
  assert.ok(pack.files["diagrams/pilot-bmi-accel-mems.diagram.v1.json"] != null);
  assert.ok(pack.files["markdown/pilot-bmi-accel-theory.theory.md"] != null);
});

test("roundDiagram3dPosition rounds to three decimals", () => {
  assert.deepEqual(roundDiagram3dPosition([1.23456, 0, -2.98765]), [1.235, 0, -2.988]);
});

test("patchDiagram3dNode stores static position from drag commit values", () => {
  const node = createDefaultDiagram3dModelNode("pcb");
  let diagram = parseDiagramV1({
    version: 1,
    id: "drag-test",
    viewBox: [0, 0, 400, 300],
    layers: [
      {
        kind: "2d",
        nodes: [{ id: "frame", type: "rect", x: 0, y: 0, width: 400, height: 300 }],
      },
      { kind: "3d", nodes: [node] },
    ],
  });

  diagram = patchDiagram3dNode(diagram, "pcb", {
    positionX: 1.2,
    positionY: 0.5,
    positionZ: -0.8,
  });

  const layer = diagram.layers?.find((entry) => entry.kind === "3d");
  const model = layer?.nodes.find((entry) => entry.id === "pcb");
  assert.equal(model?.type, "model");
  if (model?.type === "model") {
    assert.equal(model.position?.x, 1.2);
    assert.equal(model.position?.y, 0.5);
    assert.equal(model.position?.z, -0.8);
  }
});
