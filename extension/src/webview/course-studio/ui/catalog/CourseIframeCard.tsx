import {
  COURSE_EMBED_CARD_CAPTION_CLASS,
  COURSE_EMBED_CARD_CLASS,
  COURSE_EMBED_CARD_IFRAME_CLASS,
  COURSE_EMBED_CARD_MEDIA_CLASS,
} from "./course-embed-card-ui";

export function CourseIframeCard({
  src,
  title,
  caption,
}: {
  src: string;
  title?: string;
  caption?: string;
}) {
  const hasSrc = src.trim().length > 0;

  return (
    <figure className={COURSE_EMBED_CARD_CLASS}>
      <div className={COURSE_EMBED_CARD_MEDIA_CLASS}>
        {hasSrc ? (
          <iframe
            className={COURSE_EMBED_CARD_IFRAME_CLASS}
            src={src}
            title={title ?? caption ?? "Embedded content"}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
            Set an embed URL in the inspector.
          </div>
        )}
      </div>
      {caption != null && caption.length > 0 ? (
        <figcaption className={COURSE_EMBED_CARD_CAPTION_CLASS}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}
