import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";

import { buildPresentationPackFromPageIds } from "../../src/webview/course-studio/content/presentationPackBuild";
import {
  applyPresentationPackRuntime,
  setActiveCoursePackOverlay,
} from "../../src/webview/course-studio/content/presentationPackLoad";
import { initCourseDiagramRegistryFromPack, loadCourseDiagram } from "../../src/webview/course-studio/content/diagramRegistry";

const contentDir = join(process.cwd(), "src/webview/course-studio/content");

/** Same pack + registry steps as `bootstrapPresentationCourseDiagramBridge`. */
function bootstrapPresentationDiagramBridgeForTest(): void {
  setActiveCoursePackOverlay(null);
  const { pack } = buildPresentationPackFromPageIds(contentDir, ["bmi-accel-theory"], {
    id: "presentation-bridge-test-pack",
    title: "Presentation bridge test",
  });
  applyPresentationPackRuntime(pack, {
    readOnly: true,
    sourcePathMode: "virtual",
    primaryPageId: "bmi-accel-theory",
  });
  initCourseDiagramRegistryFromPack();
}

test("presentation diagram bridge registers pilot MEMS diagram", () => {
  bootstrapPresentationDiagramBridgeForTest();

  const diagram = loadCourseDiagram("pilot-bmi-accel-mems");
  assert.ok(diagram);
  assert.equal(diagram!.id, "pilot-bmi-accel-mems");
  assert.ok(diagram!.nodes.length > 0);
});

test("presentation diagram bridge is safe to call twice", () => {
  bootstrapPresentationDiagramBridgeForTest();
  bootstrapPresentationDiagramBridgeForTest();

  const diagram = loadCourseDiagram("pilot-bmi-accel-mems");
  assert.equal(diagram?.title, "MEMS accelerometer cross-section");
});
