/**
 * Avoid feeding `useGLTF` an HTML error page (e.g. Vite SPA `index.html` when a GLB path is missing).
 * Cheap checks: HEAD when possible, then a tiny ranged GET to sniff GLB magic or glTF JSON start.
 */

import {
  collectGlobalDirectoryOnlineFallbackUrls,
  type GlobalDirectoryFallbackCandidateOptions,
} from "../../asset-resolution/global-directory-online-fallback";
import {
  MIN_VALID_GLB_BYTES,
  missingLocalMirrorPreflightMessage,
  parseHttpContentLength,
} from "./glb-local-mirror-integrity.js";

const GLB_MAGIC_LITTLE_ENDIAN = 0x46546c67;

export type PreflightModelPreviewResult =
  | { ok: true }
  | { ok: false; message: string };

function shouldSkipPreflight(url: string): boolean {
  const u = url.trim();
  return (
    u.startsWith("blob:") ||
    u.startsWith("data:") ||
    u.startsWith("vscode-webview-resource:") ||
    u.startsWith("vscode-webview:") ||
    u.includes(".vscode-resource.vscode-cdn.net")
  );
}

function isGlbBinaryMagic(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) {
    return false;
  }
  return new DataView(buf).getUint32(0, true) === GLB_MAGIC_LITTLE_ENDIAN;
}

async function sniffPreviewPayload(
  url: string,
  signal: AbortSignal,
): Promise<PreflightModelPreviewResult> {
  const res = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
    headers: { Range: "bytes=0-63" },
  });

  if (signal.aborted) {
    return { ok: false, message: "Cancelled." };
  }

  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (ct.includes("text/html")) {
    return {
      ok: false,
      message:
        "Server returned HTML (missing GLB — often Vite SPA fallback when the file is not under src/assets, or a wrong URL).",
    };
  }

  if (!res.ok && res.status !== 206) {
    return {
      ok: false,
      message: `HTTP ${res.status} — could not read preview (file missing or blocked).`,
    };
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0) {
    return { ok: false, message: missingLocalMirrorPreflightMessage(0) };
  }

  const declaredLen = parseHttpContentLength(res);
  if (
    declaredLen != null &&
    declaredLen < MIN_VALID_GLB_BYTES &&
    (url.toLowerCase().endsWith(".glb") || ct.includes("model/gltf-binary"))
  ) {
    return { ok: false, message: missingLocalMirrorPreflightMessage(declaredLen) };
  }

  const urlLower = url.toLowerCase();
  if (urlLower.endsWith(".glb") || ct.includes("model/gltf-binary")) {
    if (isGlbBinaryMagic(buf)) {
      if (declaredLen != null && declaredLen < MIN_VALID_GLB_BYTES) {
        return { ok: false, message: missingLocalMirrorPreflightMessage(declaredLen) };
      }
      return { ok: true };
    }
    return {
      ok: false,
      message: missingLocalMirrorPreflightMessage(buf.byteLength),
    };
  }

  if (urlLower.endsWith(".gltf") || ct.includes("model/gltf+json")) {
    const slice = buf.slice(0, Math.min(buf.byteLength, 256));
    const text = new TextDecoder().decode(slice).trimStart();
    if (text.startsWith("{")) {
      return { ok: true };
    }
    return {
      ok: false,
      message: "Response does not look like glTF JSON.",
    };
  }

  if (isGlbBinaryMagic(buf)) {
    return { ok: true };
  }
  const headText = new TextDecoder().decode(buf.slice(0, Math.min(64, buf.byteLength))).trimStart();
  if (headText.startsWith("{")) {
    return { ok: true };
  }

  return {
    ok: false,
    message:
      "Could not confirm GLB or glTF JSON from the first bytes (wrong URL or non-model content).",
  };
}

/**
 * Returns whether `url` is safe to pass to `useGLTF(url)` without loading an HTML document as JSON.
 */
export type PreflightModelPreviewWithFallbackResult =
  | { ok: true; url: string }
  | { ok: false; message: string; url: string };

/**
 * Preflight `primaryUrl`, then try online mirrors when the file is missing from globalStorage /
 * free pack (same relative path on `ONLINE_ASSETS_BASE_URI`).
 */
export async function preflightModelPreviewUrlWithGlobalDirectoryFallback(
  primaryUrl: string,
  options: GlobalDirectoryFallbackCandidateOptions,
  signal: AbortSignal,
): Promise<PreflightModelPreviewWithFallbackResult> {
  const trimmed = primaryUrl.trim();
  const pf = await preflightModelPreviewUrl(trimmed, signal);
  if (pf.ok) {
    return { ok: true, url: trimmed };
  }

  for (const fallbackUrl of collectGlobalDirectoryOnlineFallbackUrls(trimmed, options)) {
    const pfFallback = await preflightModelPreviewUrl(fallbackUrl, signal);
    if (signal.aborted) {
      return { ok: false, message: "Cancelled.", url: trimmed };
    }
    if (pfFallback.ok) {
      return { ok: true, url: fallbackUrl };
    }
  }

  return { ok: false, message: pf.message, url: trimmed };
}

export async function preflightModelPreviewUrl(
  url: string,
  signal: AbortSignal,
): Promise<PreflightModelPreviewResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, message: "Empty preview URL." };
  }
  if (shouldSkipPreflight(trimmed)) {
    return { ok: true };
  }

  try {
    const headRes = await fetch(trimmed, {
      method: "HEAD",
      signal,
      cache: "no-store",
    });
    if (signal.aborted) {
      return { ok: false, message: "Cancelled." };
    }
    const headCt = (headRes.headers.get("content-type") ?? "").toLowerCase();
    const headLen = parseHttpContentLength(headRes);
    if (headRes.ok && headCt.includes("text/html")) {
      return {
        ok: false,
        message:
          "Server returned HTML for this URL (missing model file — check src/assets paths or download roots).",
      };
    }
    if (
      headRes.ok &&
      (trimmed.toLowerCase().endsWith(".glb") || headCt.includes("model/gltf-binary")) &&
      headLen != null &&
      headLen < MIN_VALID_GLB_BYTES
    ) {
      return { ok: false, message: missingLocalMirrorPreflightMessage(headLen) };
    }
    if (
      !headRes.ok &&
      headRes.status !== 405 &&
      headRes.status !== 501
    ) {
      return {
        ok: false,
        message: `HTTP ${headRes.status} — preview URL unreachable or file missing.`,
      };
    }
  } catch {
    /* HEAD unsupported or blocked — fall through to ranged GET */
  }

  try {
    return await sniffPreviewPayload(trimmed, signal);
  } catch (e) {
    if (signal.aborted) {
      return { ok: false, message: "Cancelled." };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
