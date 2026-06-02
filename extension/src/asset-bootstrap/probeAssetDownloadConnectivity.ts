import * as https from "node:https";
import { GlobalConfig } from "../GlobalConfig.js";

function headRequest(url: string, timeoutMs: number): Promise<{ ok: boolean; status?: number }> {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      { method: "HEAD", timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve({ ok: res.statusCode != null && res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false });
    });
    req.on("error", () => resolve({ ok: false }));
    req.end();
  });
}

/**
 * Cheap reachability check for GitHub raw assets (used before offering free-pack sync).
 */
export async function probeAssetDownloadConnectivity(options?: {
  onlineAssetsBaseUrl?: string;
  timeoutMs?: number;
}): Promise<{ reachable: boolean; probeUrl: string; status?: number }> {
  const base = (options?.onlineAssetsBaseUrl ?? GlobalConfig.ONLINE_ASSETS_BASE_URI).replace(
    /\/+$/,
    "",
  );
  const probeUrl = `${base}/textures/cubemap/bridge/posx.jpg`;
  const timeoutMs = options?.timeoutMs ?? 8_000;
  const result = await headRequest(probeUrl, timeoutMs);
  return { reachable: result.ok, probeUrl, status: result.status };
}
