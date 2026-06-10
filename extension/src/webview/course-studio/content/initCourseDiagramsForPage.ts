import type { PageV1 } from "../schemas/page.v1";
import { parseDiagramV1 } from "../schemas/diagram.v1";
import { useCourseDiagramEditorStore } from "../maintainer/useCourseDiagramEditorStore";
import { courseDiagramSourcePathForId } from "./diagramTemplates";
import { registerCourseDiagram } from "./diagramRegistry";

const DIAGRAM_JSON_BY_ID = import.meta.glob<{ default: unknown }>(
  "./*.diagram.v1.json",
  { eager: true },
);

function collectDiagramIdsFromPage(page: PageV1): string[] {
  const ids = new Set<string>();
  for (const block of page.blocks) {
    if (block.kind === "diagram-2d") {
      ids.add(block.diagramId);
    }
  }
  return [...ids];
}

function loadBundledDiagramJson(diagramId: string) {
  const moduleKey = `./${diagramId}.diagram.v1.json`;
  const mod = DIAGRAM_JSON_BY_ID[moduleKey];
  if (mod == null) {
    return null;
  }
  return parseDiagramV1(mod.default);
}

/** Register diagram JSON files referenced by page blocks (saved under content/). */
export function initCourseDiagramsForPage(page: PageV1): void {
  const { drafts } = useCourseDiagramEditorStore.getState();

  for (const diagramId of collectDiagramIdsFromPage(page)) {
    if (drafts[diagramId] != null) {
      continue;
    }
    const diagram = loadBundledDiagramJson(diagramId);
    if (diagram == null) {
      continue;
    }
    registerCourseDiagram(diagram, courseDiagramSourcePathForId(diagramId));
  }
}
