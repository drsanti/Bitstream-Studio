import {
  BROWSER_USER_FREE_URL_RELATIVE_PREFIX,
  BROWSER_USER_MODELS_URL_RELATIVE_PREFIX,
} from "../../assetLayout";
import { joinAssetBase } from "../asset-source-strategy";

const ABSOLUTE_FETCH_URL_RE = /^(https?:|blob:|data:|vscode-webview)/i;

/**
 * Strip Vite / webview user-mirror prefixes so online base joins use a logical pack path
 * (`models/...`, `textures/cubemap/...`, `tesaiot/models/...`).
 */
export function stripPackRelativePath(relativePath: string): string {
  const p = relativePath.replace(/^\//, "").replace(/\\/g, "/");
  const strip = (prefix: string): string | null =>
    p.startsWith(prefix) ? p.slice(prefix.length) : null;
  return (
    strip("__ternion_user_free/") ??
    strip("__ternion_user_models/") ??
    strip("__ternion_user_tesaiot_textures/") ??
    strip("__extension_src_assets/") ??
    p
  );
}

/**
 * Online asset tree URL for a pack-relative path (`ONLINE_ASSETS_BASE_URI` + path).
 * Same layout as the free-pack mirror under globalStorage (`assets/models/...` on GitHub).
 */
export function resolveWebviewPackAssetOnlineUrl(relativePath: string): string | null {
  const rel = stripPackRelativePath(relativePath);
  if (rel.length === 0) {
    return null;
  }
  const online =
    typeof window !== "undefined"
      ? (window as Window & { ONLINE_ASSETS_BASE_URI?: string }).ONLINE_ASSETS_BASE_URI?.trim()
      : undefined;
  if (online == null || online.length === 0) {
    return null;
  }
  return joinAssetBase(online, rel);
}

/**
 * When the primary URL points at globalStorage / free mirror / dev user mirror,
 * return the equivalent URL on the online asset tree (if different).
 */
/** Infer pack-relative path from a resolved free / globalStorage / dev mirror URL. */
export function inferPackRelativePathFromAssetUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!ABSOLUTE_FETCH_URL_RE.test(trimmed)) {
    return stripPackRelativePath(trimmed);
  }

  const win = typeof window !== "undefined" ? window : undefined;
  const free = win?.FREE_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
  const userModels =
    (win as Window & { USER_MODELS_BASE_URI?: string }).USER_MODELS_BASE_URI?.trim().replace(
      /\/+$/,
      "",
    ) ?? "";

  if (free.length > 0 && trimmed.startsWith(`${free}/`)) {
    return stripPackRelativePath(trimmed.slice(free.length + 1));
  }
  if (userModels.length > 0 && trimmed.startsWith(`${userModels}/`)) {
    const rel = trimmed.slice(userModels.length + 1).replace(/^\//, "");
    return rel.length > 0 ? `models/${rel}` : null;
  }

  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\\/g, "/");
    const freeMarker = `/${BROWSER_USER_FREE_URL_RELATIVE_PREFIX.replace(/\/$/, "")}/`;
    const freeIdx = path.indexOf(freeMarker);
    if (freeIdx >= 0) {
      return stripPackRelativePath(path.slice(freeIdx + freeMarker.length));
    }
    const modelsMarker = `/${BROWSER_USER_MODELS_URL_RELATIVE_PREFIX.replace(/\/$/, "")}/`;
    const modelsIdx = path.indexOf(modelsMarker);
    if (modelsIdx >= 0) {
      const rel = path.slice(modelsIdx + modelsMarker.length).replace(/^\//, "");
      return rel.length > 0 ? `models/${rel}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveOnlineFallbackForGlobalDirectoryUrl(primaryUrl: string): string | null {
  const trimmed = primaryUrl.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!ABSOLUTE_FETCH_URL_RE.test(trimmed)) {
    const fromRel = resolveWebviewPackAssetOnlineUrl(trimmed);
    return fromRel != null && fromRel !== trimmed ? fromRel : null;
  }

  const win = typeof window !== "undefined" ? window : undefined;
  const free = win?.FREE_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
  const online = win?.ONLINE_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
  const userModels =
    (win as Window & { USER_MODELS_BASE_URI?: string }).USER_MODELS_BASE_URI?.trim().replace(
      /\/+$/,
      "",
    ) ?? "";

  if (online.length === 0) {
    return null;
  }

  if (free.length > 0 && (trimmed === free || trimmed.startsWith(`${free}/`))) {
    const rel = trimmed === free ? "" : trimmed.slice(free.length + 1);
    const next = rel.length > 0 ? joinAssetBase(online, rel) : online;
    return next !== trimmed ? next : null;
  }

  if (userModels.length > 0 && trimmed.startsWith(`${userModels}/`)) {
    const rel = trimmed.slice(userModels.length + 1);
    const next = joinAssetBase(online, `models/${rel.replace(/^\//, "")}`);
    return next !== trimmed ? next : null;
  }

  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\\/g, "/");
    const freeMarker = `/${BROWSER_USER_FREE_URL_RELATIVE_PREFIX.replace(/\/$/, "")}/`;
    const freeIdx = path.indexOf(freeMarker);
    if (freeIdx >= 0) {
      const rel = path.slice(freeIdx + freeMarker.length);
      const next = joinAssetBase(online, rel);
      return next !== trimmed ? next : null;
    }
    const modelsMarker = `/${BROWSER_USER_MODELS_URL_RELATIVE_PREFIX.replace(/\/$/, "")}/`;
    const modelsIdx = path.indexOf(modelsMarker);
    if (modelsIdx >= 0) {
      const rel = path.slice(modelsIdx + modelsMarker.length);
      const next = joinAssetBase(online, `models/${rel.replace(/^\//, "")}`);
      return next !== trimmed ? next : null;
    }
  } catch {
    return null;
  }

  return null;
}

export type GlobalDirectoryFallbackCandidateOptions = {
  /** Logical pack path (`models/...`, `textures/...`). */
  packRelativePath?: string;
  /** Optional explicit online URL (manifest `onlineFallbackUrl` override). */
  explicitOnlineUrl?: string;
};

/** Build fallback options from a resolved fetch URL (and optional catalog / manifest hints). */
export function buildGlobalDirectoryFallbackOptions(
  primaryUrl: string,
  hints: Omit<GlobalDirectoryFallbackCandidateOptions, "packRelativePath"> & {
    packRelativePath?: string;
  } = {},
): GlobalDirectoryFallbackCandidateOptions {
  const packRelativePath =
    hints.packRelativePath?.trim() ||
    inferPackRelativePathFromAssetUrl(primaryUrl) ||
    undefined;
  return {
    packRelativePath,
    explicitOnlineUrl: hints.explicitOnlineUrl,
  };
}

/** Unique candidate URLs to try after the primary global-directory URL fails preflight. */
export function collectGlobalDirectoryOnlineFallbackUrls(
  primaryUrl: string,
  options: GlobalDirectoryFallbackCandidateOptions = {},
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (url: string | null | undefined): void => {
    const t = url?.trim() ?? "";
    if (t.length === 0 || seen.has(t) || t === primaryUrl.trim()) {
      return;
    }
    seen.add(t);
    out.push(t);
  };

  push(options.explicitOnlineUrl);
  if (options.packRelativePath != null && options.packRelativePath.trim().length > 0) {
    push(resolveWebviewPackAssetOnlineUrl(options.packRelativePath.trim()));
  }
  push(resolveOnlineFallbackForGlobalDirectoryUrl(primaryUrl));

  return out;
}

/** First online mirror candidate for a single asset URL (cubemap face, texture, GLB, etc.). */
export function resolveGlobalDirectoryFetchFallbackUrl(
  primaryUrl: string,
  packRelativePath?: string,
): string | null {
  const candidates = collectGlobalDirectoryOnlineFallbackUrls(
    primaryUrl,
    buildGlobalDirectoryFallbackOptions(primaryUrl, { packRelativePath }),
  );
  return candidates[0] ?? null;
}
