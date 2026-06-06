import { ternionFreeAssetPackCopy } from "../../asset-bootstrap/ternionFreeAssetPackCopy.js";

/** GLBs smaller than this are almost certainly truncated, empty, or not a real model file. */
export const MIN_VALID_GLB_BYTES = 1024;

const CORRUPT_PARSE_HINTS = [
  "too small",
  "truncated",
  "invalid typed array length",
  "unexpected binary header",
  "not a valid glb",
  "empty response",
  "html instead of a glb",
  "json instead of a glb",
  "download incomplete",
] as const;

export function parseHttpContentLength(res: Response): number | null {
  const raw = res.headers.get("content-length");
  if (raw == null || raw.trim().length === 0) {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function assertGlbByteLength(
  byteLength: number,
  contentLength: number | null,
  url: string,
): void {
  if (byteLength < MIN_VALID_GLB_BYTES) {
    throw new Error(
      `Model file is too small (${byteLength} bytes) — it may have been deleted or only partially downloaded.\n${url}`,
    );
  }
  if (
    contentLength != null &&
    contentLength >= MIN_VALID_GLB_BYTES &&
    byteLength < contentLength
  ) {
    throw new Error(
      `Model download incomplete (${byteLength} of ${contentLength} bytes).\n${url}`,
    );
  }
}

export function isLikelyCorruptOrMissingGlbError(message: string): boolean {
  const lower = message.toLowerCase();
  return CORRUPT_PARSE_HINTS.some((hint) => lower.includes(hint));
}

/** Plain-language message for operators when local mirror / parse fails. */
export function friendlyGlbLoadErrorMessage(raw: string): string {
  if (!isLikelyCorruptOrMissingGlbError(raw)) {
    return raw;
  }
  return ternionFreeAssetPackCopy.glbLocalMirrorCorruptBody;
}

export const missingLocalMirrorDialogBullets: readonly string[] = [
  "Open Asset Manager → Setup or Free Loader",
  "Re-download or sync the TERNION pack",
  "Reload this panel after sync completes",
] as const;

export function missingLocalMirrorPreflightMessage(bytesHint?: number): string {
  if (bytesHint != null && bytesHint >= 0 && bytesHint < MIN_VALID_GLB_BYTES) {
    return `Local model file is missing or incomplete (${bytesHint} bytes on disk). Re-sync the TERNION pack in Asset Manager.`;
  }
  return ternionFreeAssetPackCopy.glbLocalMirrorMissingPreflight;
}
