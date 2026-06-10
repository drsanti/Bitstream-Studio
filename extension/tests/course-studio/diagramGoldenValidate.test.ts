import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  discoverCourseContent,
  validateCourseContent,
} from "../../src/webview/course-studio/validate/courseContentValidate";
import { evaluateDiagramGoldenCase } from "../../src/webview/course-studio/validate/diagramGoldenValidate";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

const contentDir = join(process.cwd(), "src/webview/course-studio/content");
const fixturesDir = join(process.cwd(), "tests/fixtures/course-studio-golden");

test("evaluateDiagramGoldenCase passes pilot MEMS proof-mass frames", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const fixture = JSON.parse(
    readFileSync(join(fixturesDir, "pilot-bmi-accel-mems.json"), "utf8"),
  ) as { cases: Array<{ id: string; snapshot: object; linkHealthy?: boolean; nodes: object }> };

  for (const testCase of fixture.cases) {
    const issues = evaluateDiagramGoldenCase(diagram, testCase);
    assert.deepEqual(issues, [], testCase.id);
  }
});

test("validateCourseContent --golden passes for bundled content", () => {
  const result = validateCourseContent(contentDir, {
    golden: true,
    goldenFixturesDir: fixturesDir,
  });
  const goldenIssues = result.issues.filter((issue) => issue.code.startsWith("golden-"));
  assert.deepEqual(goldenIssues, []);
  assert.equal(result.ok, true);
});

test("discoverCourseContent indexes pilot diagrams", () => {
  const index = discoverCourseContent(contentDir);
  assert.ok(index.diagrams.has("pilot-bmi-accel-mems"));
});
