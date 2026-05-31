import type { ModelEntry } from "../../model-catalog/modelCatalog-types.js";
import type { AssetSource } from "./asset.types.js";

/**
 * Maps a merged catalog {@link ModelEntry} to Asset Browse source badges.
 * Lists are expected from globalStorage scans (`free/models`, `tesaiot/models`), not repo globs.
 */
export function inferModelAssetSource(m: ModelEntry): AssetSource {
  const k = m.dedupeKey.replace(/\\/g, "/").toLowerCase();

  if (m.catalogCategory === "downloaded" || m.modelSource === "dynamic") {
    if (k.startsWith("free/models/")) {
      return "pack";
    }
    return "downloaded";
  }

  if (k.startsWith("free/models/") || k.includes("/assets/free/models/")) {
    return "pack";
  }

  return "bundled";
}
