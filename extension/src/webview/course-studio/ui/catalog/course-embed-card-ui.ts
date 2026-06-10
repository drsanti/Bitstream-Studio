import type { CourseEmbedCaptionPlacement } from "../../schemas/page.v1";

/** Shared layout classes for YouTube / iFrame grid embed cards. */
export const COURSE_EMBED_CARD_CLASS =
  "course-embed-card relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)]";

export const COURSE_EMBED_CARD_MEDIA_CLASS =
  "course-embed-card__media relative isolate min-h-[12rem] w-full flex-1 basis-0 overflow-hidden bg-zinc-950/60";

export const COURSE_EMBED_CARD_IFRAME_LAYER_CLASS = "course-embed-card__iframe-layer";

export const COURSE_EMBED_CARD_MEDIA_CROPPED_CLASS = "course-embed-card__media--cropped";

export const COURSE_EMBED_CARD_IFRAME_CLASS =
  "absolute inset-0 z-0 h-full w-full border-0";

export const COURSE_EMBED_CARD_IFRAME_CROPPED_CLASS = "course-embed-card__iframe--cropped";

/** @deprecated Use COURSE_EMBED_CARD_MEDIA_CROPPED_CLASS */
export const COURSE_EMBED_CARD_MEDIA_MINIMAL_CHROME_CLASS =
  COURSE_EMBED_CARD_MEDIA_CROPPED_CLASS;

/** @deprecated Use COURSE_EMBED_CARD_IFRAME_CROPPED_CLASS */
export const COURSE_EMBED_CARD_IFRAME_MINIMAL_CHROME_CLASS =
  COURSE_EMBED_CARD_IFRAME_CROPPED_CLASS;

export const COURSE_EMBED_CARD_CAPTION_CLASS =
  "shrink-0 border-t border-[var(--surface-border)] px-3 py-2 text-2xs text-[var(--text-secondary)]";

export const COURSE_EMBED_CARD_CAPTION_ABOVE_CLASS =
  "shrink-0 border-b border-[var(--surface-border)] px-3 py-2 text-2xs text-[var(--text-secondary)]";

export const COURSE_EMBED_CARD_CAPTION_OVERLAY_CLASS = "course-embed-card__caption-overlay";

export function resolveEmbedCaptionDisplay(
  caption: string | undefined,
  placement: CourseEmbedCaptionPlacement | undefined,
): { text: string; mode: "above" | "below" | "overlay" } | null {
  const text = caption?.trim();
  if (text == null || text.length === 0) {
    return null;
  }
  const mode = placement ?? "below";
  if (mode === "hidden") {
    return null;
  }
  return { text, mode };
}
