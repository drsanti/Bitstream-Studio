import { resolveCourseStudioMediaUri } from "./courseStudioMediaUriStore";

const DEV_CONTENT_MEDIA_PREFIX = "/src/webview/course-studio/content/";

/** Resolve markdown image paths for Course Studio preview (dev + VSIX session media). */
export function resolveCourseMarkdownImageSrc(src: string | undefined): string | undefined {
  if (src == null || src.length === 0) {
    return src;
  }
  if (/^(https?:|data:|blob:|vscode-webview:|vscode-resource:)/i.test(src)) {
    return src;
  }

  const sessionUri = resolveCourseStudioMediaUri(src);
  if (sessionUri != null) {
    return sessionUri;
  }

  if (import.meta.env.DEV && src.startsWith("media/")) {
    return `${DEV_CONTENT_MEDIA_PREFIX}${src}`;
  }

  return src;
}
