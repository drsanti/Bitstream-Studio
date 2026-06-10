import assert from "node:assert/strict";
import test from "node:test";

import { buildCourseSceneFromTemplate } from "../../src/webview/course-studio/content/sceneTemplates";
import { parseSceneV1 } from "../../src/webview/course-studio/schemas/scene.v1";
import { sceneV1ToDiagramV1, removeScene3dNode } from "../../src/webview/course-studio/runtime/scene/sceneDiagramBridge";
import { sceneUsesLiveBinding } from "../../src/webview/course-studio/runtime/scene/sceneLiveBinding";
import pilotSceneJson from "../../src/webview/course-studio/content/pilot-bmi-pcb-orientation.scene.v1.json";

test("parseSceneV1 accepts pilot PCB orientation scene", () => {
  const scene = parseSceneV1(pilotSceneJson);
  assert.equal(scene.id, "pilot-bmi-pcb-orientation");
  assert.ok(scene.nodes.length >= 1);
});

test("sceneV1ToDiagramV1 exposes 3D layer nodes for renderer", () => {
  const scene = parseSceneV1(pilotSceneJson);
  const diagram = sceneV1ToDiagramV1(scene);
  assert.equal(diagram.layers?.length, 1);
  assert.equal(diagram.layers?.[0]?.kind, "3d");
  assert.ok((diagram.layers?.[0]?.nodes.length ?? 0) >= 1);
});

test("buildCourseSceneFromTemplate ships gyro gimbal and axis triad presets", () => {
  const gimbal = buildCourseSceneFromTemplate("gyro-gimbal").scene;
  assert.equal(gimbal.nodes[0]?.type, "model");
  assert.equal(
    gimbal.nodes[0]?.type === "model" ? gimbal.nodes[0].modelId : null,
    "procedural-gyro-gimbal",
  );

  const triad = buildCourseSceneFromTemplate("axis-triad").scene;
  assert.equal(
    triad.nodes[0]?.type === "model" ? triad.nodes[0].modelId : null,
    "procedural-axis-triad",
  );
});

test("removeScene3dNode clears the last object from the scene document", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "single-object",
    title: "Single",
    nodes: [
      {
        id: "only-model",
        type: "model",
        modelId: "procedural-box",
      },
    ],
  });

  const next = removeScene3dNode(scene, "only-model");
  assert.deepEqual(next.nodes, []);
});

test("sceneV1ToDiagramV1 accepts empty scene without Zod diagram parse", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "blank-scene",
    title: "Blank",
    nodes: [],
  });
  const diagram = sceneV1ToDiagramV1(scene);
  assert.equal(diagram.id, "blank-scene");
  assert.equal(diagram.layers[0]?.kind, "3d");
  assert.deepEqual(diagram.layers[0]?.nodes, []);
  assert.equal(sceneUsesLiveBinding(scene), false);
});

test("parseSceneV1 round-trips scene with material target and position binding", () => {
  const raw = {
    version: 1,
    id: "scene-round-trip",
    title: "Round trip",
    nodes: [
      {
        id: "pcb",
        type: "model",
        modelId: "catalog:demo",
        material: {
          presetId: "pcb-green",
          materialName: "Body",
          mapUrl: "https://example.com/albedo.png",
        },
        position: {
          x: {
            base: 0,
            mode: "add",
            binding: { path: "bmi270.ax", fallback: 0 },
          },
        },
      },
    ],
  };
  const parsed = parseSceneV1(raw);
  const reparsed = parseSceneV1(JSON.parse(JSON.stringify(parsed)));
  assert.equal(reparsed.nodes[0]?.id, "pcb");
  assert.equal(
    reparsed.nodes[0]?.type === "model" ? reparsed.nodes[0].material?.materialName : null,
    "Body",
  );
  assert.equal(sceneUsesLiveBinding(reparsed), true);
  const diagram = sceneV1ToDiagramV1(reparsed);
  assert.equal(diagram.layers[0]?.nodes[0]?.id, "pcb");
});
