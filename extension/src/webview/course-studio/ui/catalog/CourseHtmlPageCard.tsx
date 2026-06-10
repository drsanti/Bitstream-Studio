import type { CourseEmbedCaptionPlacement } from "../../schemas/page.v1";
import {
  resolveHtmlPageSandboxAttr,
  wrapHtmlDocumentIfNeeded,
} from "../../schemas/htmlPageBlocks";
import {
  COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS,
  COURSE_EMBED_CARD_CAPTION_CLASS,
  COURSE_EMBED_CARD_CAPTION_OVERLAY_CLASS,
  COURSE_EMBED_CARD_IFRAME_LAYER_CLASS,
  courseEmbedCardClassName,
  courseEmbedCardMediaClassName,
  resolveEmbedCaptionDisplay,
  type CourseEmbedShellHeight,
} from "./course-embed-card-ui";
import { CourseSrcdocAutoHeightIframe } from "./CourseSrcdocAutoHeightIframe";
import { useEmbedReadContentMediaStyle } from "./useEmbedReadContentMediaStyle";

export function CourseHtmlPageCard({
  html,
  title,
  caption,
  captionPlacement,
  shellHeight = "fill",
  readContentHeightPx,
  sandboxSameOrigin,
  emptyMessage = "Add HTML in the HTML Editor pane.",
}: {
  html: string;
  title?: string;
  caption?: string;
  captionPlacement?: CourseEmbedCaptionPlacement;
  shellHeight?: CourseEmbedShellHeight;
  readContentHeightPx?: number;
  sandboxSameOrigin?: boolean;
  emptyMessage?: string;
}) {
  const wrappedHtml = wrapHtmlDocumentIfNeeded(html);
  const measureContent = shellHeight === "content" && readContentHeightPx == null;
  const { iframeRef, srcDoc, mediaStyle, shouldMeasure } = useEmbedReadContentMediaStyle({
    shellHeight,
    readContentHeightPx,
    html: wrappedHtml,
    measureContent,
  });
  const captionDisplay = resolveEmbedCaptionDisplay(caption, captionPlacement);
  const iframeTitle = title ?? captionDisplay?.text ?? caption ?? "HTML page";
  const hasContent = wrappedHtml.length > 0;
  const sandbox = resolveHtmlPageSandboxAttr({ sandboxSameOrigin });

  return (
    <figure className={courseEmbedCardClassName(shellHeight, "course-embed-card--html-page")}>
      {captionDisplay?.mode === "above" ? (
        <figcaption className={COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS}>{captionDisplay.text}</figcaption>
      ) : null}
      <div className={courseEmbedCardMediaClassName(shellHeight)} style={mediaStyle}>
        <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
          {hasContent ? (
            <CourseSrcdocAutoHeightIframe
              iframeRef={iframeRef}
              title={iframeTitle}
              sandbox={sandbox}
              srcDoc={srcDoc}
              scrolling={shouldMeasure ? "no" : undefined}
            />
          ) : (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
      {captionDisplay?.mode === "overlay" ? (
        <div className={COURSE_EMBED_CARD_CAPTION_OVERLAY_CLASS} role="note">
          {captionDisplay.text}
        </div>
      ) : null}
      {captionDisplay?.mode === "below" ? (
        <figcaption className={COURSE_EMBED_CARD_CAPTION_CLASS}>{captionDisplay.text}</figcaption>
      ) : null}
    </figure>
  );
}
