import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { parseCourseV1 } from "../schemas/course.v1";
import { collectCoursePageIds } from "../runtime/course/courseOutlineTree";
import { parseDiagramV1 } from "../schemas/diagram.v1";
import { parsePageV1 } from "../schemas/page.v1";
import { parseSceneV1, type SceneV1 } from "../schemas/scene.v1";
import { findUnknownDiagramBindingPaths } from "./diagramBindingValidate";
import { validateDiagramGoldenFrames } from "./diagramGoldenValidate";
import {
  findOrphanSceneDocuments,
  validateSceneDocumentContent,
} from "./sceneContentValidate";
import {
  collectPageDiagramIds,
  collectPageMarkdownSrcs,
  collectPageMarkdownUrls,
  collectPageSceneDocumentIds,
  findDuplicateBlockIds,
  findPageGridOverlaps,
} from "./pageGridValidate";

export type CourseValidateSeverity = "error" | "warn";

export type CourseValidateIssue = {
  severity: CourseValidateSeverity;
  code: string;
  message: string;
  file: string;
};

export type CourseContentIndex = {
  contentDir: string;
  pages: Map<string, { file: string; page: ReturnType<typeof parsePageV1> }>;
  courses: Map<string, { file: string; course: ReturnType<typeof parseCourseV1> }>;
  diagrams: Map<string, { file: string; diagram: ReturnType<typeof parseDiagramV1> }>;
  scenes: Map<string, { file: string; scene: ReturnType<typeof parseSceneV1> }>;
  markdownFiles: Set<string>;
};

export type CourseValidateResult = {
  ok: boolean;
  issues: CourseValidateIssue[];
  index: CourseContentIndex;
};

function listFiles(contentDir: string, suffix: string): string[] {
  return readdirSync(contentDir)
    .filter((name) => name.endsWith(suffix))
    .map((name) => join(contentDir, name));
}

export function discoverCourseContent(contentDir: string): CourseContentIndex {
  const pages = new Map<string, { file: string; page: ReturnType<typeof parsePageV1> }>();
  const courses = new Map<string, { file: string; course: ReturnType<typeof parseCourseV1> }>();
  const diagrams = new Map<string, { file: string; diagram: ReturnType<typeof parseDiagramV1> }>();
  const scenes = new Map<string, { file: string; scene: ReturnType<typeof parseSceneV1> }>();
  const markdownFiles = new Set<string>();

  for (const file of listFiles(contentDir, ".course.v1.json")) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const course = parseCourseV1(raw);
    courses.set(course.id, { file, course });
  }

  for (const file of listFiles(contentDir, ".page.v1.json")) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const page = parsePageV1(raw);
    pages.set(page.id, { file, page });
  }

  for (const file of listFiles(contentDir, ".diagram.v1.json")) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const diagram = parseDiagramV1(raw);
    diagrams.set(diagram.id, { file, diagram });
  }

  for (const file of listFiles(contentDir, ".scene.v1.json")) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const scene = parseSceneV1(raw);
    scenes.set(scene.id, { file, scene });
  }

  for (const name of readdirSync(contentDir)) {
    if (name.endsWith(".md")) {
      markdownFiles.add(name);
    }
  }

  return { contentDir, pages, courses, diagrams, scenes, markdownFiles };
}

function issue(
  severity: CourseValidateSeverity,
  code: string,
  message: string,
  file: string,
): CourseValidateIssue {
  return { severity, code, message, file };
}

export type CourseValidateOptions = {
  golden?: boolean;
  goldenFixturesDir?: string;
};

function findUnknownSceneBindingPaths(scene: SceneV1): string[] {
  const { sceneV1ToDiagramV1 } =
    require("../runtime/scene/sceneDiagramBridge") as typeof import("../runtime/scene/sceneDiagramBridge");
  return findUnknownDiagramBindingPaths(sceneV1ToDiagramV1(scene));
}

export function validateCourseContent(
  contentDir: string,
  options?: CourseValidateOptions,
): CourseValidateResult {
  const issues: CourseValidateIssue[] = [];
  let index: CourseContentIndex;

  try {
    if (!statSync(contentDir).isDirectory()) {
      return {
        ok: false,
        issues: [issue("error", "content-dir-missing", `Not a directory: ${contentDir}`, contentDir)],
        index: {
          contentDir,
          pages: new Map(),
          diagrams: new Map(),
          scenes: new Map(),
          markdownFiles: new Set(),
        },
      };
    }
    index = discoverCourseContent(contentDir);
  } catch (error) {
    return {
      ok: false,
      issues: [
        issue(
          "error",
          "content-dir-read-failed",
          error instanceof Error ? error.message : String(error),
          contentDir,
        ),
      ],
      index: {
        contentDir,
        pages: new Map(),
        diagrams: new Map(),
        scenes: new Map(),
        markdownFiles: new Set(),
      },
    };
  }

  if (index.pages.size === 0) {
    issues.push(
      issue("warn", "no-pages", "No *.page.v1.json files found in content directory.", contentDir),
    );
  }

  for (const [pageId, entry] of index.pages) {
    const rel = relative(contentDir, entry.file) || entry.file;
    const duplicates = findDuplicateBlockIds(entry.page);
    for (const blockId of duplicates) {
      issues.push(
        issue("error", "duplicate-block-id", `Page "${pageId}" has duplicate block id "${blockId}".`, rel),
      );
    }

    for (const overlap of findPageGridOverlaps(entry.page)) {
      issues.push(
        issue(
          "error",
          "grid-overlap",
          `Page "${pageId}" blocks "${overlap.blockA}" and "${overlap.blockB}" overlap at cell ${overlap.cell}.`,
          rel,
        ),
      );
    }

    for (const diagramId of collectPageDiagramIds(entry.page)) {
      if (!index.diagrams.has(diagramId)) {
        issues.push(
          issue(
            "error",
            "missing-diagram",
            `Page "${pageId}" references diagram "${diagramId}" which was not found in content.`,
            rel,
          ),
        );
      }
    }

    for (const documentId of collectPageSceneDocumentIds(entry.page)) {
      if (!index.scenes.has(documentId)) {
        issues.push(
          issue(
            "error",
            "missing-scene",
            `Page "${pageId}" references scene "${documentId}" which was not found in content.`,
            rel,
          ),
        );
      }
    }

    for (const src of collectPageMarkdownSrcs(entry.page)) {
      if (!index.markdownFiles.has(src)) {
        issues.push(
          issue(
            "error",
            "missing-markdown",
            `Page "${pageId}" references markdown src "${src}" which was not found in content.`,
            rel,
          ),
        );
      }
    }

    for (const url of collectPageMarkdownUrls(entry.page)) {
      issues.push(
        issue(
          "warn",
          "remote-markdown-url",
          `Page "${pageId}" uses remote markdown URL "${url}" — not bundled in offline packs.`,
          rel,
        ),
      );
    }
  }

  for (const [diagramId, entry] of index.diagrams) {
    const rel = relative(contentDir, entry.file) || entry.file;
    for (const path of findUnknownDiagramBindingPaths(entry.diagram)) {
      issues.push(
        issue(
          "error",
          "unknown-binding",
          `Diagram "${diagramId}" uses unknown binding path "${path}".`,
          rel,
        ),
      );
    }
  }

  for (const [sceneId, entry] of index.scenes) {
    const rel = relative(contentDir, entry.file) || entry.file;
    for (const path of findUnknownSceneBindingPaths(entry.scene)) {
      issues.push(
        issue(
          "error",
          "unknown-binding",
          `Scene "${sceneId}" uses unknown binding path "${path}".`,
          rel,
        ),
      );
    }
    issues.push(...validateSceneDocumentContent(entry.scene, rel));
  }

  const referencedSceneIds = new Set<string>();
  for (const entry of index.pages.values()) {
    for (const documentId of collectPageSceneDocumentIds(entry.page)) {
      referencedSceneIds.add(documentId);
    }
  }
  issues.push(
    ...findOrphanSceneDocuments(index.scenes.keys(), referencedSceneIds, contentDir),
  );

  for (const [courseId, entry] of index.courses) {
    const rel = relative(contentDir, entry.file) || entry.file;
    for (const pageId of collectCoursePageIds(entry.course.root)) {
      if (!index.pages.has(pageId)) {
        issues.push(
          issue(
            "error",
            "missing-page",
            `Course "${courseId}" references page "${pageId}" which was not found in content.`,
            rel,
          ),
        );
      }
    }
  }

  if (options?.golden === true) {
    const fixturesDir =
      options.goldenFixturesDir ??
      join(process.cwd(), "tests/fixtures/course-studio-golden");
    issues.push(...validateDiagramGoldenFrames(index, fixturesDir));
  }

  const ok = issues.every((item) => item.severity !== "error");
  return { ok, issues, index };
}

export function formatCourseValidateReport(result: CourseValidateResult): string {
  if (result.ok && result.issues.length === 0) {
    return [
      "Course Studio content validation passed.",
      `  pages: ${result.index.pages.size}`,
      `  diagrams: ${result.index.diagrams.size}`,
      `  scenes: ${result.index.scenes.size}`,
      `  markdown: ${result.index.markdownFiles.size}`,
    ].join("\n");
  }

  const lines = [
    result.ok
      ? "Course Studio content validation passed with warnings."
      : "Course Studio content validation failed.",
    "",
  ];

  for (const item of result.issues) {
    lines.push(`[${item.severity.toUpperCase()}] ${item.code} — ${item.file}`);
    lines.push(`  ${item.message}`);
  }

  lines.push("");
  lines.push(
    `Summary: ${result.index.pages.size} page(s), ${result.index.diagrams.size} diagram(s), ${result.index.scenes.size} scene(s), ${result.index.markdownFiles.size} markdown file(s).`,
  );

  return lines.join("\n");
}
