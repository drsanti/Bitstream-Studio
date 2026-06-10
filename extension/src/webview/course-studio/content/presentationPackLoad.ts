import { parseDiagramV1, type DiagramV1 } from "../schemas/diagram.v1";
import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import { parseSceneV1, type SceneV1 } from "../schemas/scene.v1";
import type { PresentationPackV1 } from "../schemas/presentationPack.v1";
import { isPackVirtualSourcePath, pathBasename } from "./courseSourcePaths";

export { isPackVirtualSourcePath };

export const COURSE_CONTENT_ROOT_PREFIX = "src/webview/course-studio/content/";

export type PackPageAsset = {
  packPath: string;
  fileName: string;
  page: PageV1;
};

export type PackDiagramAsset = {
  packPath: string;
  fileName: string;
  diagram: DiagramV1;
};

export type PackMarkdownAsset = {
  packPath: string;
  fileName: string;
  src: string;
  text: string;
};

export type PackSceneAsset = {
  packPath: string;
  fileName: string;
  scene: SceneV1;
};

export type ParsedPresentationPackAssets = {
  pages: PackPageAsset[];
  diagrams: PackDiagramAsset[];
  scenes: PackSceneAsset[];
  markdown: PackMarkdownAsset[];
};

export function packVirtualSourcePath(packId: string, packPath: string): string {
  return `pack:${packId}/${packPath}`;
}

export function contentSourcePathForFileName(fileName: string): string {
  return `${COURSE_CONTENT_ROOT_PREFIX}${fileName}`;
}

export function parsePresentationPackAssets(pack: PresentationPackV1): ParsedPresentationPackAssets {
  const pages: PackPageAsset[] = [];
  const diagrams: PackDiagramAsset[] = [];
  const scenes: PackSceneAsset[] = [];
  const markdown: PackMarkdownAsset[] = [];

  for (const [packPath, body] of Object.entries(pack.files)) {
    if (packPath.startsWith("pages/") && packPath.endsWith(".page.v1.json")) {
      const page = parsePageV1(JSON.parse(body) as unknown);
      pages.push({
        packPath,
        fileName: pathBasename(packPath),
        page,
      });
      continue;
    }

    if (packPath.startsWith("diagrams/") && packPath.endsWith(".diagram.v1.json")) {
      const diagram = parseDiagramV1(JSON.parse(body) as unknown);
      diagrams.push({
        packPath,
        fileName: pathBasename(packPath),
        diagram,
      });
      continue;
    }

    if (packPath.startsWith("scenes/") && packPath.endsWith(".scene.v1.json")) {
      const scene = parseSceneV1(JSON.parse(body) as unknown);
      scenes.push({
        packPath,
        fileName: pathBasename(packPath),
        scene,
      });
      continue;
    }

    if (packPath.startsWith("markdown/") && packPath.endsWith(".md")) {
      const fileName = pathBasename(packPath);
      markdown.push({
        packPath,
        fileName,
        src: fileName,
        text: body,
      });
    }
  }

  return { pages, diagrams, scenes, markdown };
}

export type CoursePackOverlay = {
  packId: string;
  readOnly: boolean;
  pageIds: string[];
  pages: Record<string, { page: PageV1; sourcePath: string }>;
  diagrams: Record<string, { diagram: DiagramV1; sourcePath: string }>;
  scenes: Record<string, { scene: SceneV1; sourcePath: string }>;
  markdown: Record<string, { text: string; sourcePath: string }>;
};

let activePackOverlay: CoursePackOverlay | null = null;

export function getActiveCoursePackOverlay(): CoursePackOverlay | null {
  return activePackOverlay;
}

export function buildCoursePackOverlay(
  pack: PresentationPackV1,
  options: { readOnly?: boolean; sourcePathMode?: "virtual" | "content" } = {},
): CoursePackOverlay {
  const assets = parsePresentationPackAssets(pack);
  const readOnly = options.readOnly ?? true;
  const sourcePathMode = options.sourcePathMode ?? "virtual";

  const sourcePathFor = (packPath: string, fileName: string): string => {
    if (sourcePathMode === "content") {
      return contentSourcePathForFileName(fileName);
    }
    return packVirtualSourcePath(pack.id, packPath);
  };

  const pages: CoursePackOverlay["pages"] = {};
  const diagrams: CoursePackOverlay["diagrams"] = {};
  const scenes: CoursePackOverlay["scenes"] = {};
  const markdown: CoursePackOverlay["markdown"] = {};

  for (const entry of assets.pages) {
    pages[entry.page.id] = {
      page: entry.page,
      sourcePath: sourcePathFor(entry.packPath, entry.fileName),
    };
  }

  for (const entry of assets.diagrams) {
    diagrams[entry.diagram.id] = {
      diagram: entry.diagram,
      sourcePath: sourcePathFor(entry.packPath, entry.fileName),
    };
  }

  for (const entry of assets.scenes) {
    scenes[entry.scene.id] = {
      scene: entry.scene,
      sourcePath: sourcePathFor(entry.packPath, entry.fileName),
    };
  }

  for (const entry of assets.markdown) {
    markdown[entry.src] = {
      text: entry.text,
      sourcePath: sourcePathFor(entry.packPath, entry.fileName),
    };
  }

  return {
    packId: pack.id,
    readOnly,
    pageIds: assets.pages.map((entry) => entry.page.id),
    pages,
    diagrams,
    scenes,
    markdown,
  };
}

export function setActiveCoursePackOverlay(overlay: CoursePackOverlay | null): void {
  activePackOverlay = overlay;
}

export type ApplyPresentationPackRuntimeOptions = {
  readOnly?: boolean;
  sourcePathMode?: "virtual" | "content";
  /** When set, becomes the preferred page if present in the pack. */
  primaryPageId?: string;
};

export type ApplyPresentationPackRuntimeResult = {
  packId: string;
  pageIds: string[];
  primaryPageId: string | null;
  overlay: CoursePackOverlay;
};

export function applyPresentationPackRuntime(
  pack: PresentationPackV1,
  options: ApplyPresentationPackRuntimeOptions = {},
): ApplyPresentationPackRuntimeResult {
  const overlay = buildCoursePackOverlay(pack, {
    readOnly: options.readOnly,
    sourcePathMode: options.sourcePathMode,
  });
  setActiveCoursePackOverlay(overlay);

  const primaryPageId =
    options.primaryPageId != null && overlay.pages[options.primaryPageId] != null
      ? options.primaryPageId
      : overlay.pageIds[0] ?? null;

  return {
    packId: pack.id,
    pageIds: overlay.pageIds,
    primaryPageId,
    overlay,
  };
}

export type ImportPresentationPackToDiskOptions = {
  overwrite?: boolean;
};

export type ImportPresentationPackToDiskResult = {
  written: string[];
  skipped: string[];
  pageIds: string[];
};

export function mapPackAssetsToContentFiles(pack: PresentationPackV1): Map<string, string> {
  const mapped = new Map<string, string>();

  for (const [packPath, body] of Object.entries(pack.files)) {
    if (
      packPath.startsWith("pages/") ||
      packPath.startsWith("diagrams/") ||
      packPath.startsWith("scenes/") ||
      packPath.startsWith("markdown/")
    ) {
      mapped.set(pathBasename(packPath), body);
    }
  }

  return mapped;
}
