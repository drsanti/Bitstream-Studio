import type { PageBlockV1 } from "./page.v1";

/** Parse a YouTube video id from a share URL or bare 11-character id. */
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id != null && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery != null && /^[\w-]{11}$/.test(fromQuery)) {
        return fromQuery;
      }
      const shortsMatch = url.pathname.match(/^\/shorts\/([\w-]{11})/);
      if (shortsMatch?.[1] != null) {
        return shortsMatch[1];
      }
      const embedMatch = url.pathname.match(/^\/embed\/([\w-]{11})/);
      if (embedMatch?.[1] != null) {
        return embedMatch[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export type YoutubeEmbedOptions = {
  startSeconds?: number;
  /** Default on when omitted. */
  autoplay?: boolean;
  /** Default on when autoplay is on; required for browser autoplay. */
  muted?: boolean;
  loop?: boolean;
  /** Default on when omitted. */
  showControls?: boolean;
  allowFullscreen?: boolean;
  modestBranding?: boolean;
  limitRelatedVideos?: boolean;
  /** CSS crop of title / suggestion bands (optional polish). */
  cropChrome?: boolean;
  cropTopPx?: number;
  cropBottomPx?: number;
};

export const COURSE_YOUTUBE_DEFAULT_CROP_TOP_PX = 64;
export const COURSE_YOUTUBE_DEFAULT_CROP_BOTTOM_PX = 64;
export const COURSE_YOUTUBE_MAX_CROP_PX = 160;

export function resolveYoutubeCropInsets(embed?: YoutubeEmbedOptions): {
  active: boolean;
  topPx: number;
  bottomPx: number;
} {
  const legacyChrome = embed?.cropChrome === true;
  const topPx = embed?.cropTopPx ?? (legacyChrome ? COURSE_YOUTUBE_DEFAULT_CROP_TOP_PX : 0);
  const bottomPx =
    embed?.cropBottomPx ?? (legacyChrome ? COURSE_YOUTUBE_DEFAULT_CROP_BOTTOM_PX : 0);
  const active = legacyChrome || topPx > 0 || bottomPx > 0;
  return {
    active,
    topPx: active ? topPx : 0,
    bottomPx: active ? bottomPx : 0,
  };
}

export function youtubeEmbedOptionsFromBlock(
  block: Extract<PageBlockV1, { kind: "youtube" }>,
): YoutubeEmbedOptions {
  return {
    startSeconds: block.startSeconds,
    autoplay: block.autoplay,
    muted: block.muted,
    loop: block.loop,
    showControls: block.showControls,
    allowFullscreen: block.allowFullscreen,
    modestBranding: block.modestBranding,
    limitRelatedVideos: block.limitRelatedVideos,
    cropChrome: block.cropChrome ?? block.minimalChrome,
    cropTopPx: block.cropTopPx,
    cropBottomPx: block.cropBottomPx,
  };
}

export function buildYoutubeEmbedUrl(videoId: string, options?: YoutubeEmbedOptions): string {
  const params = new URLSearchParams();
  const autoplay = options?.autoplay !== false;

  if (autoplay) {
    params.set("autoplay", "1");
  }

  const startMuted =
    options?.muted === true || (options?.muted !== false && autoplay);
  if (startMuted) {
    params.set("mute", "1");
  }

  if (options?.showControls === false) {
    params.set("controls", "0");
  }

  if (options?.modestBranding === true) {
    params.set("modestbranding", "1");
  }

  if (options?.limitRelatedVideos === true) {
    params.set("rel", "0");
  }

  if (options?.loop === true) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }

  if (options?.allowFullscreen === false) {
    params.set("fs", "0");
  }

  if (options?.startSeconds != null && options.startSeconds > 0) {
    params.set("start", String(options.startSeconds));
  }

  params.set("playsinline", "1");
  const query = params.toString();
  return `https://www.youtube.com/embed/${videoId}${query.length > 0 ? `?${query}` : ""}`;
}

export function formatGridSpanLabel(columnSpan: number, rowSpan: number): string {
  return `${columnSpan} × ${rowSpan}`;
}
