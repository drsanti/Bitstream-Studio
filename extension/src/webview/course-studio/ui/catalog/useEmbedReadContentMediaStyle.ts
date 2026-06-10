import { useRef, type CSSProperties, type RefObject } from "react";
import { injectHtmlPageAutoHeightScript } from "../../schemas/htmlPageAutoHeight";
import { useCourseHtmlPageIframeHeight } from "./useCourseHtmlPageIframeHeight";
import type { CourseEmbedShellHeight } from "./course-embed-card-ui";

export function useEmbedReadContentMediaStyle({
  shellHeight,
  readContentHeightPx,
  html,
  measureContent,
}: {
  shellHeight: CourseEmbedShellHeight;
  readContentHeightPx?: number;
  html: string;
  measureContent: boolean;
}): {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  srcDoc: string;
  mediaStyle: CSSProperties | undefined;
  shouldMeasure: boolean;
} {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shouldMeasure = measureContent && readContentHeightPx == null;
  const srcDoc =
    html.length > 0 && shouldMeasure ? injectHtmlPageAutoHeightScript(html) : html;
  const measuredHeight = useCourseHtmlPageIframeHeight(iframeRef, shouldMeasure, srcDoc);
  const effectiveReadHeightPx = readContentHeightPx ?? measuredHeight ?? undefined;

  const mediaStyle: CSSProperties | undefined =
    shellHeight === "content" && effectiveReadHeightPx != null
      ? ({ "--course-embed-read-height": `${effectiveReadHeightPx}px` } as CSSProperties)
      : shellHeight === "fill" && readContentHeightPx != null
        ? ({ "--course-embed-read-height": `${readContentHeightPx}px` } as CSSProperties)
        : undefined;

  return { iframeRef, srcDoc, mediaStyle, shouldMeasure };
}
