import { basename, join } from "node:path";
import { readFileSync } from "node:fs";

import type { PresentationPackV1 } from "../schemas/presentationPack.v1";
import { parsePresentationPackV1 } from "../schemas/presentationPack.v1";
import { discoverCourseContent } from "../validate/courseContentValidate";

export function buildPresentationPackFromContentDir(
  contentDir: string,
  meta?: { id?: string; title?: string },
): PresentationPackV1 {
  const index = discoverCourseContent(contentDir);
  const files: Record<string, string> = {};

  for (const [, entry] of index.pages) {
    files[`pages/${basename(entry.file)}`] = readFileSync(entry.file, "utf8");
  }

  for (const [, entry] of index.diagrams) {
    files[`diagrams/${basename(entry.file)}`] = readFileSync(entry.file, "utf8");
  }

  for (const [, entry] of index.scenes) {
    files[`scenes/${basename(entry.file)}`] = readFileSync(entry.file, "utf8");
  }

  for (const markdownName of index.markdownFiles) {
    files[`markdown/${markdownName}`] = readFileSync(join(contentDir, markdownName), "utf8");
  }

  return parsePresentationPackV1({
    version: 1,
    id: meta?.id ?? "content-dir",
    title: meta?.title ?? "Course Studio content",
    createdAt: new Date().toISOString(),
    files,
  });
}
