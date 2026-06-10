import { REPO_ASSET_STATIC_SCAN_ENABLED } from "../../../assetLayout";
import { resolveCatalogModelUrlInExtensionWebview } from "../../model-catalog/modelCatalogMerge";
import { scanModelCatalogAssets } from "../../model-catalog/modelCatalog-asset-scan";
import { resolveWebviewModelAssetUrl } from "../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl";
import type { Diagram3dModelIdV1 } from "../../schemas/diagram.v1";
import {
  catalogKeyFromDiagram3dModelId,
  diagram3dModelIdLabel,
  isCatalogDiagram3dModelId,
  toCatalogDiagram3dModelId,
} from "../runtime/diagram/diagram3dModelId";

export type CourseDiagramModelSelectOption = {
  value: Diagram3dModelIdV1;
  label: string;
};

const PROCEDURAL_MODEL_OPTIONS: CourseDiagramModelSelectOption[] = [
  { value: "procedural-pcb", label: diagram3dModelIdLabel("procedural-pcb") },
  { value: "procedural-axis-triad", label: diagram3dModelIdLabel("procedural-axis-triad") },
  { value: "procedural-gyro-gimbal", label: diagram3dModelIdLabel("procedural-gyro-gimbal") },
  { value: "procedural-box", label: diagram3dModelIdLabel("procedural-box") },
  { value: "procedural-sphere", label: diagram3dModelIdLabel("procedural-sphere") },
  { value: "procedural-cylinder", label: diagram3dModelIdLabel("procedural-cylinder") },
  { value: "procedural-cone", label: diagram3dModelIdLabel("procedural-cone") },
  { value: "procedural-plane", label: diagram3dModelIdLabel("procedural-plane") },
  { value: "procedural-torus", label: diagram3dModelIdLabel("procedural-torus") },
  { value: "procedural-capsule", label: diagram3dModelIdLabel("procedural-capsule") },
  { value: "procedural-ring", label: diagram3dModelIdLabel("procedural-ring") },
  { value: "procedural-icosahedron", label: diagram3dModelIdLabel("procedural-icosahedron") },
  { value: "procedural-torus-knot", label: diagram3dModelIdLabel("procedural-torus-knot") },
];

/** Packaged GLB entries from the build-time model catalog scan (dev + VSIX). */
export function buildCourseDiagramCatalogModelOptions(
  limit = 24,
): CourseDiagramModelSelectOption[] {
  if (!REPO_ASSET_STATIC_SCAN_ENABLED) {
    return [];
  }

  return scanModelCatalogAssets()
    .filter((entry) => entry.catalogCategory === "packaged")
    .slice(0, limit)
    .map((entry) => ({
      value: toCatalogDiagram3dModelId(entry.dedupeKey) as Diagram3dModelIdV1,
      label: `Catalog · ${entry.name}`,
    }));
}

export function buildCourseDiagramModelSelectOptions(): CourseDiagramModelSelectOption[] {
  return [...PROCEDURAL_MODEL_OPTIONS, ...buildCourseDiagramCatalogModelOptions()];
}

/** Resolve a catalog model id to a fetchable GLB URL in the webview. */
export function resolveCourseDiagramCatalogGlbUrl(modelId: Diagram3dModelIdV1): string | null {
  if (!isCatalogDiagram3dModelId(modelId)) {
    return null;
  }

  const catalogKey = catalogKeyFromDiagram3dModelId(modelId);
  const fromExtension = resolveCatalogModelUrlInExtensionWebview(catalogKey);
  if (fromExtension != null && fromExtension.length > 0) {
    return fromExtension;
  }

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    const scanned = scanModelCatalogAssets().find((entry) => entry.dedupeKey === catalogKey);
    if (scanned?.url) {
      return scanned.url;
    }
  }

  if (catalogKey.includes("/")) {
    return resolveWebviewModelAssetUrl(catalogKey);
  }

  return null;
}
