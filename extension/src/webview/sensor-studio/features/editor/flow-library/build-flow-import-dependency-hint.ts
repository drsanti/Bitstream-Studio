import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import { persistedModelUrlFromStudioDescriptor } from "../../asset-browser/studio-model-scene-bindings";
import type { StudioFlowPresetDependencies } from "./studio-flow-preset-file";

function knownModelUrls(catalog: readonly StudioAssetDescriptor[]): Set<string> {
  const urls = new Set<string>();
  for (const d of catalog) {
    urls.add(persistedModelUrlFromStudioDescriptor(d));
  }
  return urls;
}

/** Human-readable hint when imported flow references assets missing from the catalog. */
export function buildFlowImportDependencyHint(
  dependencies: StudioFlowPresetDependencies | undefined,
  catalog: readonly StudioAssetDescriptor[],
): string | null {
  if (dependencies == null) {
    return null;
  }

  const known = knownModelUrls(catalog);
  const missingModels = (dependencies.modelUrls ?? []).filter((url) => !known.has(url.trim()));
  const missingChannels = dependencies.dataChannels ?? [];

  if (missingModels.length === 0 && missingChannels.length === 0) {
    return null;
  }

  const parts: string[] = [];
  if (missingModels.length > 0) {
    const preview = missingModels.slice(0, 2).join(", ");
    const extra = missingModels.length > 2 ? ` +${missingModels.length - 2}` : "";
    parts.push(`${missingModels.length} model${missingModels.length === 1 ? "" : "s"} not in Asset Manager (${preview}${extra})`);
  }
  if (missingChannels.length > 0) {
    parts.push(
      `${missingChannels.length} telemetry channel${missingChannels.length === 1 ? "" : "s"} may need device setup`,
    );
  }

  return `${parts.join(". ")}. Open Asset Manager or Devices to restore bindings.`;
}
