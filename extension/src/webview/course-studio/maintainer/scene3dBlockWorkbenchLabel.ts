import type { PageBlockV1 } from "../schemas/page.v1";
import { loadCourseScene } from "../content/sceneRegistry";

export type Scene3dPageBlock = Extract<PageBlockV1, { kind: "scene-3d" }>;

export function listScene3dPageBlocks(blocks: readonly PageBlockV1[]): Scene3dPageBlock[] {
  return blocks.filter((block): block is Scene3dPageBlock => block.kind === "scene-3d");
}

export function scene3dBlockWorkbenchLabel(block: Scene3dPageBlock): string {
  const caption = block.caption?.trim();
  if (caption != null && caption.length > 0) {
    return caption;
  }
  const scene = loadCourseScene(block.documentId);
  if (scene?.title != null && scene.title.trim().length > 0) {
    return scene.title.trim();
  }
  return block.documentId;
}
