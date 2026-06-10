import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { presentationBmi270FromSample } from "../../presentation/display/selectors";
import type { DiagramLiveSnapshot } from "../runtime/diagram/diagramBindingCatalog";
import {
  evaluateDiagramProps,
  findResolvedNode,
  type ResolvedNodeProps,
} from "../runtime/diagram/evaluateDiagramProps";
import type { DiagramV1 } from "../schemas/diagram.v1";
import type { CourseContentIndex, CourseValidateIssue } from "./courseContentValidate";

type GoldenSnapshotInput = {
  ax?: number;
  accValid?: boolean;
  hasSample?: boolean;
  connected?: boolean;
};

type GoldenNodeExpect = Partial<
  Pick<ResolvedNodeProps, "x" | "y" | "cx" | "cy" | "content" | "flowActive" | "highlighted">
>;

type DiagramGoldenCase = {
  id: string;
  snapshot: GoldenSnapshotInput;
  linkHealthy?: boolean;
  nodes: Record<string, GoldenNodeExpect>;
};

type DiagramGoldenFixture = {
  diagramId: string;
  cases: DiagramGoldenCase[];
};

function buildSnapshot(input: GoldenSnapshotInput): DiagramLiveSnapshot {
  const base = presentationBmi270FromSample(null);
  return {
    bmi270: {
      ...base,
      ax: input.ax ?? base.ax,
      accValid: input.accValid ?? base.accValid,
      hasSample: input.hasSample ?? base.hasSample,
    },
    connected: input.connected ?? true,
  };
}

function assertNodeExpect(
  resolved: ReturnType<typeof evaluateDiagramProps>,
  nodeId: string,
  expect: GoldenNodeExpect,
): string | null {
  const node = findResolvedNode(resolved, nodeId);
  if (node == null) {
    return `node "${nodeId}" missing from resolved props`;
  }

  for (const [key, value] of Object.entries(expect) as Array<
    [keyof GoldenNodeExpect, GoldenNodeExpect[keyof GoldenNodeExpect]]
  >) {
    const actual = node[key];
    if (typeof value === "number" && typeof actual === "number") {
      if (Math.abs(actual - value) > 1e-6) {
        return `node "${nodeId}".${key}: expected ${value}, got ${actual}`;
      }
      continue;
    }
    if (actual !== value) {
      return `node "${nodeId}".${key}: expected ${String(value)}, got ${String(actual)}`;
    }
  }

  return null;
}

function loadGoldenFixtures(fixturesDir: string): DiagramGoldenFixture[] {
  let names: string[] = [];
  try {
    names = readdirSync(fixturesDir).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }

  return names.map((name) => {
    const raw = JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
    const fixture = raw as DiagramGoldenFixture;
    if (typeof fixture.diagramId !== "string" || !Array.isArray(fixture.cases)) {
      throw new Error(`Invalid golden fixture: ${name}`);
    }
    return fixture;
  });
}

export function validateDiagramGoldenFrames(
  index: CourseContentIndex,
  fixturesDir: string,
): CourseValidateIssue[] {
  const issues: CourseValidateIssue[] = [];
  const fixtures = loadGoldenFixtures(fixturesDir);

  if (fixtures.length === 0) {
    issues.push({
      severity: "warn",
      code: "golden-fixtures-missing",
      message: `No golden fixtures found in ${fixturesDir}.`,
      file: fixturesDir,
    });
    return issues;
  }

  for (const fixture of fixtures) {
    const entry = index.diagrams.get(fixture.diagramId);
    if (entry == null) {
      issues.push({
        severity: "error",
        code: "golden-diagram-missing",
        message: `Golden fixture references diagram "${fixture.diagramId}" which is not in content.`,
        file: fixture.diagramId,
      });
      continue;
    }

    for (const testCase of fixture.cases) {
      const snapshot = buildSnapshot(testCase.snapshot);
      const resolved = evaluateDiagramProps(entry.diagram, snapshot, {
        linkHealthy: testCase.linkHealthy ?? true,
      });

      for (const [nodeId, expect] of Object.entries(testCase.nodes)) {
        const mismatch = assertNodeExpect(resolved, nodeId, expect);
        if (mismatch != null) {
          issues.push({
            severity: "error",
            code: "golden-frame-mismatch",
            message: `${fixture.diagramId}/${testCase.id}: ${mismatch}`,
            file: entry.file,
          });
        }
      }
    }
  }

  return issues;
}

/** @internal test helper */
export function evaluateDiagramGoldenCase(
  diagram: DiagramV1,
  testCase: DiagramGoldenCase,
): CourseValidateIssue[] {
  const snapshot = buildSnapshot(testCase.snapshot);
  const resolved = evaluateDiagramProps(diagram, snapshot, {
    linkHealthy: testCase.linkHealthy ?? true,
  });
  const issues: CourseValidateIssue[] = [];

  for (const [nodeId, expect] of Object.entries(testCase.nodes)) {
    const mismatch = assertNodeExpect(resolved, nodeId, expect);
    if (mismatch != null) {
      issues.push({
        severity: "error",
        code: "golden-frame-mismatch",
        message: `${testCase.id}: ${mismatch}`,
        file: diagram.id,
      });
    }
  }

  return issues;
}
