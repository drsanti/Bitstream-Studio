/** Browser-safe last path segment (forward or backslash). */
export function pathBasename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

export function isPackVirtualSourcePath(sourcePath: string): boolean {
  return sourcePath.startsWith("pack:");
}

export function isCourseContentReadOnlySourcePath(sourcePath: string): boolean {
  return isPackVirtualSourcePath(sourcePath);
}
