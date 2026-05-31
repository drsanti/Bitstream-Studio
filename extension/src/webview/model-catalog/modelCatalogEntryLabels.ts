import { formatModelDisplayName } from "./formatModelDisplayName.js";

export type ModelCatalogEntryLabelInput = {
  metadataName?: string;
  metadataCategory?: string;
  nameWithoutExt: string;
  parentDir: string | null;
};

/**
 * User-facing model name + metadata category for catalog / Asset Browse rows.
 * Prefers filename over parent folder; uses folder as category when it groups many GLBs.
 */
export function resolveModelCatalogEntryLabels(input: ModelCatalogEntryLabelInput): {
  name: string;
  modelCategory: string;
} {
  const metaName = input.metadataName?.trim();
  const fileStem = input.nameWithoutExt.trim();
  const folder = input.parentDir?.trim() ?? "";

  const name =
    metaName && metaName.length > 0
      ? metaName
      : formatModelDisplayName(fileStem || folder || "Model");

  const metaCategory = input.metadataCategory?.trim();
  if (metaCategory) {
    return { name, modelCategory: metaCategory };
  }

  if (folder.length > 0 && folder.toLowerCase() !== fileStem.toLowerCase()) {
    return { name, modelCategory: formatModelDisplayName(folder) };
  }

  return { name, modelCategory: "Uncategorized" };
}
