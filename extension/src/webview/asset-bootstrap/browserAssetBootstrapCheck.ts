import { BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS } from "../../asset-bootstrap/bootstrapRequiredAssets.js";
import { ASSET_SOURCE_FREE, buildAssetConnectionTestUrl } from "../assets-manager/store/asset-presets.js";
import type { AssetBootstrapHostCheck } from "./runAssetBootstrapReadiness.js";

function normalizeRel(p: string): string {
  return p.replace(/^\//, "").replace(/\\/g, "/");
}

async function probeBrowserAssetConnectivity(signal: AbortSignal): Promise<{
  reachable: boolean;
  probeUrl: string;
}> {
  const probeUrl = buildAssetConnectionTestUrl(ASSET_SOURCE_FREE);
  try {
    const res = await fetch(probeUrl, { method: "HEAD", signal });
    return { reachable: res.ok, probeUrl };
  } catch {
    return { reachable: false, probeUrl };
  }
}

export type BrowserAssetBootstrapWsApi = {
  connect: () => Promise<void>;
  listFreeAssets: () => Promise<{ entries: Array<{ relativePath: string }> }>;
  listLocalFreeAssets: () => Promise<{
    entries: Array<{ relativePath: string }>;
    rootFs?: string;
  }>;
  fetchDefaultBridgeOutputDir: () => Promise<string>;
};

/**
 * Builds the same shape as host `asset-bootstrap-check` using bridge WebSocket APIs
 * (browser dev and extension "Open in browser" local webapp).
 */
export async function fetchBrowserAssetBootstrapHostCheck(
  api: BrowserAssetBootstrapWsApi,
  signal: AbortSignal,
): Promise<AssetBootstrapHostCheck> {
  await api.connect();

  const internet = await probeBrowserAssetConnectivity(signal);
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  let remoteCount = 0;
  let indexUnavailable = false;
  try {
    const remote = await api.listFreeAssets();
    remoteCount = remote.entries?.length ?? 0;
  } catch {
    indexUnavailable = true;
  }

  const local = await api.listLocalFreeAssets();
  const localEntries = local.entries ?? [];
  const localSet = new Set(localEntries.map((e) => normalizeRel(e.relativePath)));

  const rows = BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS.map((packRelative) => {
    const rel = normalizeRel(packRelative);
    const existsInFree = localSet.has(rel);
    return {
      packRelative: rel,
      existsInFree,
      existsInLocal: false,
    };
  });

  const missingSample = rows.filter((r) => !r.existsInFree).map((r) => r.packRelative);
  const requiredOk = missingSample.length === 0;
  const localCount = localEntries.length;
  const fullMirrorOk =
    remoteCount > 0 && localCount >= remoteCount && !indexUnavailable;
  const allPresentOnDisk = fullMirrorOk || (requiredOk && localCount > 0 && indexUnavailable);

  let freeRootFs = local.rootFs?.trim() ?? "";
  if (!freeRootFs) {
    try {
      freeRootFs = await api.fetchDefaultBridgeOutputDir();
    } catch {
      freeRootFs = "";
    }
  }

  return {
    freeRootFs,
    allPresentOnDisk,
    internetReachable: internet.reachable,
    internetProbeUrl: internet.probeUrl,
    rows,
    freePackRemoteFileCount: remoteCount,
    freePackLocalFileCount: localCount,
    freePackMissingSample: missingSample.slice(0, 12),
    freePackIndexUnavailable: indexUnavailable,
  };
}
