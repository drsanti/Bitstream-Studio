import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

import type { CourseContentIndex } from "../validate/courseContentValidate";
import { discoverCourseContent } from "../validate/courseContentValidate";
import {
  collectPageDiagramIds,
  collectPageMarkdownSrcs,
  collectPageSceneDocumentIds,
} from "../validate/pageGridValidate";
import type { PresentationPackV1 } from "../schemas/presentationPack.v1";

export type PresentationPackBuildResult = {
  pack: PresentationPackV1;
  pageIds: string[];
  missingRefs: string[];
};

function packPathForPage(pageFileName: string): string {
  return `pages/${pageFileName}`;
}

function packPathForDiagram(diagramFileName: string): string {
  return `diagrams/${diagramFileName}`;
}

function packPathForMarkdown(markdownFileName: string): string {
  return `markdown/${markdownFileName}`;
}

function packPathForScene(sceneFileName: string): string {
  return `scenes/${sceneFileName}`;
}

function fileNameFromPath(filePath: string): string {
  return basename(filePath);
}

export function buildPresentationPackFromPageIds(
  contentDir: string,
  pageIds: string[],
  meta: { id: string; title: string; description?: string; createdAt?: string },
  index: CourseContentIndex = discoverCourseContent(contentDir),
): PresentationPackBuildResult {
  const files: Record<string, string> = {};
  const missingRefs: string[] = [];
  const includedPages: string[] = [];

  for (const pageId of pageIds) {
    const pageEntry = index.pages.get(pageId);
    if (pageEntry == null) {
      missingRefs.push(`page:${pageId}`);
      continue;
    }

    includedPages.push(pageId);
    const pageFileName = fileNameFromPath(pageEntry.file);
    files[packPathForPage(pageFileName)] = readFileSync(pageEntry.file, "utf8");

    for (const diagramId of collectPageDiagramIds(pageEntry.page)) {
      const diagramEntry = index.diagrams.get(diagramId);
      if (diagramEntry == null) {
        missingRefs.push(`diagram:${diagramId}`);
        continue;
      }
      const diagramFileName = fileNameFromPath(diagramEntry.file);
      const path = packPathForDiagram(diagramFileName);
      if (files[path] == null) {
        files[path] = readFileSync(diagramEntry.file, "utf8");
      }
    }

    for (const documentId of collectPageSceneDocumentIds(pageEntry.page)) {
      const sceneEntry = index.scenes.get(documentId);
      if (sceneEntry == null) {
        missingRefs.push(`scene:${documentId}`);
        continue;
      }
      const sceneFileName = fileNameFromPath(sceneEntry.file);
      const path = packPathForScene(sceneFileName);
      if (files[path] == null) {
        files[path] = readFileSync(sceneEntry.file, "utf8");
      }
    }

    for (const src of collectPageMarkdownSrcs(pageEntry.page)) {
      if (!index.markdownFiles.has(src)) {
        missingRefs.push(`markdown:${src}`);
        continue;
      }
      const path = packPathForMarkdown(src);
      if (files[path] == null) {
        files[path] = readFileSync(join(contentDir, src), "utf8");
      }
    }
  }

  const pack: PresentationPackV1 = {
    version: 1,
    id: meta.id,
    title: meta.title,
    description: meta.description,
    createdAt: meta.createdAt ?? new Date().toISOString(),
    files,
  };

  return { pack, pageIds: includedPages, missingRefs };
}

export type PresentationPackImportResult = {
  written: string[];
  skipped: string[];
};

export function mapPackFilesToContentDir(pack: PresentationPackV1): Map<string, string> {
  const mapped = new Map<string, string>();

  for (const [packPath, body] of Object.entries(pack.files)) {
    if (packPath.startsWith("pages/")) {
      mapped.set(basename(packPath), body);
    } else if (packPath.startsWith("diagrams/")) {
      mapped.set(basename(packPath), body);
    } else if (packPath.startsWith("markdown/")) {
      mapped.set(basename(packPath), body);
    } else if (packPath.startsWith("scenes/")) {
      mapped.set(basename(packPath), body);
    }
  }

  return mapped;
}
