import type { PageBlockV1 } from "./page.v1";
import {
  markdownShellHeightForRead,
  resolveMarkdownReadHeight,
  type MarkdownReadHeightMode,
} from "./markdownReadHeight";

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

export type CourseEmbedShellHeight = "fill" | "content";

export function resolveEmbedReadHeight(block: {
  readHeight?: MarkdownReadHeightMode;
}): MarkdownReadHeightMode {
  return resolveMarkdownReadHeight(block);
}

export function embedShellHeightForRead(block: {
  readHeight?: MarkdownReadHeightMode;
}): CourseEmbedShellHeight {
  return markdownShellHeightForRead(resolveEmbedReadHeight(block));
}

export function embedUsesReadContentHeight(block: PageBlockV1): boolean {
  if (block.kind !== "iframe" && block.kind !== "youtube") {
    return false;
  }
  return embedShellHeightForRead(block) === "content";
}

export function iframeUsesReadContentHeight(block: PageBlockV1): boolean {
  return block.kind === "iframe" && embedShellHeightForRead(block) === "content";
}

export const IFRAME_READ_HEIGHT_MIN_PX = 192;
export const IFRAME_READ_HEIGHT_MAX_PX = 4000;
export const IFRAME_READ_HEIGHT_DEFAULT_FIXED_PX = 480;

export type IframeReadHeightUiMode = "auto" | "fixed" | "grid";

export function resolveIframeReadHeightUiMode(block: {
  readHeight?: MarkdownReadHeightMode;
  readHeightPx?: number;
}): IframeReadHeightUiMode {
  if (block.readHeight === "grid") {
    return "grid";
  }
  if (block.readHeightPx != null) {
    return "fixed";
  }
  return "auto";
}

/** Read-mode fixed height in px. Auto mode fetches/measures embed document height. */
export function iframeReadContentHeightPx(
  block: Extract<PageBlockV1, { kind: "iframe" }>,
): number | undefined {
  return block.readHeightPx ?? undefined;
}

export function formatGridSpanLabel(columnSpan: number, rowSpan: number): string {
  return `${columnSpan} × ${rowSpan}`;
}

/** Normalize user-entered iframe src for display and navigation. */
export function normalizeIframeEmbedSrc(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return "";
  }
  try {
    return new URL(trimmed).href;
  } catch {
    return trimmed;
  }
}

const IFRAME_EMBED_BLOCKED_HOST_SUFFIXES = [
  "google.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
] as const;

/** Hosts that commonly refuse framing — show a friendly fallback instead of a blank iframe. */
export function iframeEmbedBlockedMessage(src: string): string | null {
  const normalized = normalizeIframeEmbedSrc(src);
  if (normalized.length === 0) {
    return null;
  }
  try {
    const host = new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
    const blocked = IFRAME_EMBED_BLOCKED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
    if (!blocked) {
      return null;
    }
    return `${host} blocks embedding in iframes (X-Frame-Options). Use a frame-friendly URL or open the page in a new tab.`;
  } catch {
    return null;
  }
}
