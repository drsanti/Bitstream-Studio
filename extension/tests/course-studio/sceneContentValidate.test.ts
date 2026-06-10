import { strict as assert } from "node:assert";
import test from "node:test";

import { parseSceneV1 } from "../../src/webview/course-studio/schemas/scene.v1";
import { validateSceneDocumentContent } from "../../src/webview/course-studio/validate/sceneContentValidate";

test("validateSceneDocumentContent flags byName material without name", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      {
        id: "pcb",
        type: "model",
        modelId: "procedural-box",
        material: { materialTarget: "byName" },
      },
    ],
  });

  const issues = validateSceneDocumentContent(scene, "content/scene-test.scene.v1.json");
  assert.ok(issues.some((issue) => issue.code === "material-target-name-missing"));
});

test("validateSceneDocumentContent warns on invalid texture URL", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      {
        id: "pcb",
        type: "model",
        modelId: "procedural-box",
        material: { mapUrl: "not-a-url" },
      },
    ],
  });

  const issues = validateSceneDocumentContent(scene, "content/scene-test.scene.v1.json");
  assert.ok(issues.some((issue) => issue.code === "invalid-texture-url"));
});
