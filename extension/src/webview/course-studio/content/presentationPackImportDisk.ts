import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { PresentationPackV1 } from "../schemas/presentationPack.v1";
import {
  contentSourcePathForFileName,
  mapPackAssetsToContentFiles,
  parsePresentationPackAssets,
  type ImportPresentationPackToDiskOptions,
  type ImportPresentationPackToDiskResult,
} from "./presentationPackLoad";

function normalizePackFileBody(fileName: string, body: string): string {
  if (fileName.endsWith(".md") || fileName.endsWith(".json")) {
    return body.endsWith("\n") ? body : `${body}\n`;
  }
  return body;
}

export function importPresentationPackToContentDir(
  pack: PresentationPackV1,
  contentDir: string,
  options: ImportPresentationPackToDiskOptions = {},
): ImportPresentationPackToDiskResult {
  const overwrite = options.overwrite ?? false;
  const written: string[] = [];
  const skipped: string[] = [];
  const assets = parsePresentationPackAssets(pack);

  mkdirSync(contentDir, { recursive: true });

  for (const [fileName, body] of mapPackAssetsToContentFiles(pack)) {
    const destPath = join(contentDir, fileName);
    if (!overwrite && existsSync(destPath)) {
      skipped.push(contentSourcePathForFileName(fileName));
      continue;
    }

    writeFileSync(destPath, normalizePackFileBody(fileName, body), "utf8");
    written.push(contentSourcePathForFileName(fileName));
  }

  return {
    written,
    skipped,
    pageIds: assets.pages.map((entry) => entry.page.id),
  };
}
