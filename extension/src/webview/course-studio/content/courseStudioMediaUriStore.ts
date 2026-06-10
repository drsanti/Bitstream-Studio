const mediaUriByMarkdownPath = new Map<string, string>();

export function registerCourseStudioMediaUri(markdownPath: string, webviewSrc: string): void {
  mediaUriByMarkdownPath.set(markdownPath, webviewSrc);
}

export function resolveCourseStudioMediaUri(markdownPath: string): string | null {
  return mediaUriByMarkdownPath.get(markdownPath) ?? null;
}

export function clearCourseStudioMediaUriStore(): void {
  mediaUriByMarkdownPath.clear();
}
