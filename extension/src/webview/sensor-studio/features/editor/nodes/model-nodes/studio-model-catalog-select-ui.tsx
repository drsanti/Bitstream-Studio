import { assetSourceBadgeClasses } from "../../../../../assets-manager/browse/asset-source-badge.js";
import { assetSourceLabel } from "../../../../../assets-manager/browse/asset-source-label.js";
import type { AssetSource } from "../../../../../assets-manager/registry/asset.types.js";
import type { ReactNode } from "react";
import type { TRNSelectOption } from "../../../../../ui/TRN";
import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import {
  listStudioModelDescriptors,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../../asset-browser/studio-model-scene-bindings";
import { Box, CircleSlash, Globe2, HardDrive, Link2, Package } from "lucide-react";

const OPTION_ICON_CLASS = "h-3.5 w-3.5 shrink-0 text-zinc-400";

export function studioModelCatalogSourceIcon(
  source: AssetSource | "custom" | "none",
): ReactNode {
  switch (source) {
    case "pack":
      return <Package className={OPTION_ICON_CLASS} aria-hidden />;
    case "bundled":
      return <Box className={OPTION_ICON_CLASS} aria-hidden />;
    case "downloaded":
      return <HardDrive className={OPTION_ICON_CLASS} aria-hidden />;
    case "external":
      return <Globe2 className={OPTION_ICON_CLASS} aria-hidden />;
    case "custom":
      return <Link2 className={OPTION_ICON_CLASS} aria-hidden />;
    case "none":
      return <CircleSlash className={OPTION_ICON_CLASS} aria-hidden />;
    default:
      return <Box className={OPTION_ICON_CLASS} aria-hidden />;
  }
}

export function StudioModelCatalogSourceBadge(props: { source: AssetSource }): ReactNode {
  const { source } = props;
  return (
    <span
      className={`shrink-0 rounded border px-1 py-px text-[8px] font-semibold tracking-wide ${assetSourceBadgeClasses(source)}`}
    >
      {assetSourceLabel(source)}
    </span>
  );
}

function catalogModelSelectOption(d: StudioAssetDescriptor): TRNSelectOption {
  return {
    value: d.id,
    label: d.label,
    icon: studioModelCatalogSourceIcon(d.source),
    rightSlot: <StudioModelCatalogSourceBadge source={d.source} />,
  };
}

function mapCatalogModelOptions(descriptors: readonly StudioAssetDescriptor[]): TRNSelectOption[] {
  return listStudioModelDescriptors(descriptors).map(catalogModelSelectOption);
}

/** Catalog GLB rows only — no None / Custom URL sentinel. */
export function buildStudioModelCatalogOnlySelectOptions(
  descriptors: readonly StudioAssetDescriptor[],
): TRNSelectOption[] {
  return mapCatalogModelOptions(descriptors);
}

/** Flow **model-select** node and Stage toolbar — includes **None**. */
export function buildStudioModelCatalogSelectOptions(
  descriptors: readonly StudioAssetDescriptor[],
): TRNSelectOption[] {
  return [
    {
      value: STUDIO_MODEL_SELECT_CUSTOM,
      label: "None",
      icon: studioModelCatalogSourceIcon("none"),
    },
    ...mapCatalogModelOptions(descriptors),
  ];
}

/** Scene3D inspector (node + Stage) — **Custom URL…** instead of None. */
export function buildScene3dInspectorModelCatalogSelectOptions(
  descriptors: readonly StudioAssetDescriptor[],
): TRNSelectOption[] {
  return [
    {
      value: STUDIO_MODEL_SELECT_CUSTOM,
      label: "Custom URL…",
      icon: studioModelCatalogSourceIcon("custom"),
    },
    ...mapCatalogModelOptions(descriptors),
  ];
}

/** @deprecated Use {@link buildScene3dInspectorModelCatalogSelectOptions}. */
export const buildRotationInspectorModelCatalogSelectOptions =
  buildScene3dInspectorModelCatalogSelectOptions;
