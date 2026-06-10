import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import type { CourseEmbedCaptionPlacement } from "../../schemas/page.v1";
import {
  buildYoutubeEmbedUrl,
  parseYoutubeVideoId,
  resolveYoutubeCropInsets,
  type YoutubeEmbedOptions,
} from "../../schemas/embedBlocks";
import {
  COURSE_EMBED_CARD_CAPTION_CLASS,
  COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS,
  COURSE_EMBED_CARD_CAPTION_OVERLAY_CLASS,
  COURSE_EMBED_CARD_IFRAME_CLASS,
  COURSE_EMBED_CARD_IFRAME_CROPPED_CLASS,
  COURSE_EMBED_CARD_IFRAME_LAYER_CLASS,
  COURSE_EMBED_CARD_MEDIA_CROPPED_CLASS,
  courseEmbedCardClassName,
  courseEmbedCardMediaClassName,
  resolveEmbedCaptionDisplay,
  type CourseEmbedShellHeight,
} from "./course-embed-card-ui";

export function CourseYoutubeCard({
  url,
  caption,
  captionPlacement,
  embed,
  shellHeight = "fill",
}: {
  url: string;
  caption?: string;
  captionPlacement?: CourseEmbedCaptionPlacement;
  embed?: YoutubeEmbedOptions;
  shellHeight?: CourseEmbedShellHeight;
}) {
  const crop = resolveYoutubeCropInsets(embed);
  const captionDisplay = resolveEmbedCaptionDisplay(caption, captionPlacement);
  const videoId = parseYoutubeVideoId(url);
  const embedSrc = videoId != null ? buildYoutubeEmbedUrl(videoId, embed) : null;
  const allowFullscreen = embed?.allowFullscreen !== false;

  const cropStyle = crop.active
    ? ({
        "--course-youtube-crop-top": `${crop.topPx}px`,
        "--course-youtube-crop-bottom": `${crop.bottomPx}px`,
      } as CSSProperties)
    : undefined;

  return (
    <figure className={courseEmbedCardClassName(shellHeight)}>
      {captionDisplay?.mode === "above" ? (
        <figcaption className={COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS}>{captionDisplay.text}</figcaption>
      ) : null}
      <div
        className={twMerge(
          courseEmbedCardMediaClassName(shellHeight),
          crop.active && COURSE_EMBED_CARD_MEDIA_CROPPED_CLASS,
        )}
        style={cropStyle}
      >
        <div className={COURSE_EMBED_CARD_IFRAME_LAYER_CLASS}>
          {embedSrc != null ? (
            <iframe
              className={twMerge(
                COURSE_EMBED_CARD_IFRAME_CLASS,
                crop.active && COURSE_EMBED_CARD_IFRAME_CROPPED_CLASS,
              )}
              src={embedSrc}
              title={captionDisplay?.text ?? caption ?? "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen={allowFullscreen}
            />
          ) : (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
              Set a valid YouTube URL in the inspector.
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
