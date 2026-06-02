import {
  BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS,
} from "../../asset-bootstrap/bootstrapRequiredAssets.js";
import { buildGlobalDirectoryFallbackOptions } from "../asset-resolution/global-directory-online-fallback.js";
import { getAssetSourceStrategy } from "../asset-source-strategy.js";
import { resolveWebviewModelAssetUrl } from "../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.js";
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from "../model-loader/ui/preflightModelPreviewUrl.js";

export type AssetBootstrapHostCheck = {
  freeRootFs: string;
  allPresentOnDisk: boolean;
  internetReachable: boolean;
  internetProbeUrl: string;
  rows: Array<{
    packRelative: string;
    existsInFree: boolean;
    existsInLocal: boolean;
  }>;
  freePackRemoteFileCount?: number;
  freePackLocalFileCount?: number;
  freePackMissingSample?: string[];
  freePackIndexUnavailable?: boolean;
};

export type AssetBootstrapReadiness =
  | { status: "ready"; reason: "on-disk" | "online-only" }
  | {
      status: "blocked";
      reason: "offline" | "missing-disk" | "unreachable";
      missingPaths: string[];
      internetReachable: boolean;
      freeRootFs: string;
    };

async function preflightAllRequired(
  signal: AbortSignal,
): Promise<{ ok: boolean; missingPaths: string[] }> {
  const missing: string[] = [];
  for (const packRelative of BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS) {
    const primaryUrl = resolveWebviewModelAssetUrl(packRelative);
    const pf = await preflightModelPreviewUrlWithGlobalDirectoryFallback(
      primaryUrl,
      buildGlobalDirectoryFallbackOptions(primaryUrl, {
        packRelativePath: packRelative,
      }),
      signal,
    );
    if (signal.aborted) {
      return { ok: false, missingPaths: missing };
    }
    if (!pf.ok) {
      missing.push(packRelative);
    }
  }
  return { ok: missing.length === 0, missingPaths: missing };
}

/**
 * After host disk check, decide whether the shell may load default 3D assets.
 *
 * `local-first` / `local-only` need files under globalStorage or packaged `out/webview/assets`
 * because resolvers prefer `FREE_ASSETS_BASE_URI` even when GitHub is reachable.
 */
export async function runAssetBootstrapReadiness(
  host: AssetBootstrapHostCheck,
  signal: AbortSignal,
): Promise<AssetBootstrapReadiness> {
  if (host.allPresentOnDisk) {
    return { status: "ready", reason: "on-disk" };
  }

  const strategy = getAssetSourceStrategy();
  const missingOnDisk =
    host.freePackMissingSample != null && host.freePackMissingSample.length > 0
      ? host.freePackMissingSample
      : host.rows
          .filter((r) => !r.existsInFree && !r.existsInLocal)
          .map((r) => r.packRelative);

  if (strategy === "online-only") {
    const pf = await preflightAllRequired(signal);
    if (signal.aborted) {
      return {
        status: "blocked",
        reason: "offline",
        missingPaths: missingOnDisk,
        internetReachable: host.internetReachable,
        freeRootFs: host.freeRootFs,
      };
    }
    if (pf.ok) {
      return { status: "ready", reason: "online-only" };
    }
    return {
      status: "blocked",
      reason: host.internetReachable ? "unreachable" : "offline",
      missingPaths: pf.missingPaths,
      internetReachable: host.internetReachable,
      freeRootFs: host.freeRootFs,
    };
  }

  if (strategy === "local-only") {
    return {
      status: "blocked",
      reason: host.internetReachable ? "missing-disk" : "offline",
      missingPaths: missingOnDisk,
      internetReachable: host.internetReachable,
      freeRootFs: host.freeRootFs,
    };
  }

  // local-first: disk mirror required for stable vscode-userdata URLs
  return {
    status: "blocked",
    reason: host.internetReachable ? "missing-disk" : "offline",
    missingPaths: missingOnDisk,
    internetReachable: host.internetReachable,
    freeRootFs: host.freeRootFs,
  };
}
