/** Pack-relative path for a scene.v1 document on disk. */
export function courseScene3dContentJsonPath(documentId: string): string {
  return `content/${documentId}.scene.v1.json`;
}
