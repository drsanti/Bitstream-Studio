import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRemoteHtml } from "../../content/useRemoteHtml";
import {
  iframeEmbedBlockedMessage,
  IFRAME_READ_HEIGHT_MAX_PX,
  IFRAME_READ_HEIGHT_MIN_PX,
  normalizeIframeEmbedSrc,
} from "../../schemas/embedBlocks";
import { resolveHtmlPageSandboxAttr, wrapHtmlDocumentIfNeeded } from "../../schemas/htmlPageBlocks";
import type { CourseEmbedCaptionPlacement } from "../../schemas/page.v1";
import {
  COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS,
  COURSE_EMBED_CARD_CAPTION_CLASS,
  COURSE_EMBED_CARD_CAPTION_OVERLAY_CLASS,
  COURSE_EMBED_CARD_IFRAME_CLASS,
  COURSE_EMBED_CARD_IFRAME_LAYER_CLASS,
  courseEmbedCardClassName,
  courseEmbedCardMediaClassName,
  resolveEmbedCaptionDisplay,
  type CourseEmbedShellHeight,
} from "./course-embed-card-ui";
import {
  CourseSrcdocAutoHeightIframe,
  measureLiveIframeDocumentHeight,
} from "./CourseSrcdocAutoHeightIframe";
import { useEmbedReadContentMediaStyle } from "./useEmbedReadContentMediaStyle";

function clampEmbedReadHeight(height: number): number {
  return Math.min(
    IFRAME_READ_HEIGHT_MAX_PX,
    Math.max(IFRAME_READ_HEIGHT_MIN_PX, Math.round(height)),
  );
}

function IframeFetchedSrcdocEmbed({
  html,
  title,
  shellHeight,
  readContentHeightPx,
  measureContent,
}: {
  html: string;
  title: string;
  shellHeight: CourseEmbedShellHeight;
  readContentHeightPx?: number;
  measureContent: boolean;
}) {
  const wrapped = wrapHtmlDocumentIfNeeded(html);
  const { iframeRef, srcDoc, mediaStyle, shouldMeasure } = useEmbedReadContentMediaStyle({
    shellHeight,
    readContentHeightPx,
    html: wrapped,
    measureContent,
  });

  return (
    <div className={courseEmbedCardMediaClassName(shellHeight)} style={mediaStyle}>
      <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
        <CourseSrcdocAutoHeightIframe
          iframeRef={iframeRef}
          title={title}
          sandbox={resolveHtmlPageSandboxAttr()}
          srcDoc={srcDoc}
          scrolling={shouldMeasure ? "no" : undefined}
        />
      </div>
    </div>
  );
}

export function CourseIframeCard({
  src,
  title,
  caption,
  captionPlacement,
  shellHeight = "fill",
  readContentHeightPx,
}: {
  src: string;
  title?: string;
  caption?: string;
  captionPlacement?: CourseEmbedCaptionPlacement;
  shellHeight?: CourseEmbedShellHeight;
  readContentHeightPx?: number;
}) {
  const liveIframeRef = useRef<HTMLIFrameElement>(null);
  const [liveMeasuredHeight, setLiveMeasuredHeight] = useState<number | null>(null);

  const normalizedSrc = normalizeIframeEmbedSrc(src);
  const blockedMessage = iframeEmbedBlockedMessage(normalizedSrc);
  const hasSrc = normalizedSrc.length > 0;
  const captionDisplay = resolveEmbedCaptionDisplay(caption, captionPlacement);
  const iframeTitle = title ?? captionDisplay?.text ?? caption ?? "Embedded content";
  const measureContent = shellHeight === "content" && readContentHeightPx == null;
  const remote = useRemoteHtml(measureContent && hasSrc && blockedMessage == null ? normalizedSrc : undefined);

  const onLiveIframeLoad = useCallback(() => {
    if (!measureContent || liveIframeRef.current == null) {
      return;
    }
    const measured = measureLiveIframeDocumentHeight(liveIframeRef.current);
    if (measured != null) {
      setLiveMeasuredHeight(clampEmbedReadHeight(measured));
    }
  }, [measureContent]);

  const useFetchedSrcdoc =
    measureContent &&
    blockedMessage == null &&
    remote.html != null &&
    !remote.loading &&
    remote.error == null;

  const effectiveReadHeightPx = readContentHeightPx ?? liveMeasuredHeight ?? undefined;

  const liveMediaStyle: CSSProperties | undefined =
    shellHeight === "content" && !useFetchedSrcdoc && effectiveReadHeightPx != null
      ? ({ "--course-embed-read-height": `${effectiveReadHeightPx}px` } as CSSProperties)
      : shellHeight === "fill" && readContentHeightPx != null
        ? ({ "--course-embed-read-height": `${readContentHeightPx}px` } as CSSProperties)
        : undefined;

  let media: ReactNode;
  if (!hasSrc) {
    media = (
      <div className={courseEmbedCardMediaClassName(shellHeight)}>
        <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
          <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
            Set an embed URL in the inspector.
          </div>
        </div>
      </div>
    );
  } else if (blockedMessage != null) {
    media = (
      <div className={courseEmbedCardMediaClassName(shellHeight)}>
        <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-[var(--text-muted)]">
            <p>{blockedMessage}</p>
            <a
              href={normalizedSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400/90 underline-offset-2 hover:text-sky-300 hover:underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    );
  } else if (measureContent && remote.loading) {
    media = (
      <div className={courseEmbedCardMediaClassName(shellHeight)}>
        <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
          <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
            Loading embed…
          </div>
        </div>
      </div>
    );
  } else if (useFetchedSrcdoc) {
    media = (
      <IframeFetchedSrcdocEmbed
        html={remote.html ?? ""}
        title={iframeTitle}
        shellHeight={shellHeight}
        readContentHeightPx={readContentHeightPx}
        measureContent={measureContent}
      />
    );
  } else {
    media = (
      <div className={courseEmbedCardMediaClassName(shellHeight)} style={liveMediaStyle}>
        <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
          <iframe
            ref={liveIframeRef}
            className={COURSE_EMBED_CARD_IFRAME_CLASS}
            src={normalizedSrc}
            title={iframeTitle}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            scrolling={measureContent && liveMeasuredHeight == null ? "auto" : undefined}
            onLoad={onLiveIframeLoad}
          />
        </div>
      </div>
    );
  }

  return (
    <figure className={courseEmbedCardClassName(shellHeight, "course-embed-card--iframe")}>
      {captionDisplay?.mode === "above" ? (
        <figcaption className={COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS}>{captionDisplay.text}</figcaption>
      ) : null}
      {media}
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
