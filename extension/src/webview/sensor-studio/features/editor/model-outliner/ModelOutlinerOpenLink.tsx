import { ListTree } from "lucide-react";
import { TRNButton } from "../../../../ui/TRN";
import { useStudioWorkbenchShell } from "../workbench/studio-workbench-context";
import {
  buildCanvasModelOutlinerNavigate,
  buildCatalogOutlinerNavigate,
  openModelOutliner,
  type ModelOutlinerNavigatePayload,
} from "./model-outliner-navigation";
import type { ModelOutlinerTypeFilter } from "./model-outliner-type-filter";

export type ModelOutlinerOpenLinkProps = {
  label?: string;
  canvasModelId?: string | null;
  catalogAssetId?: string | null;
  typeFilter?: ModelOutlinerTypeFilter;
  className?: string;
};

function resolveNavigatePayload(props: ModelOutlinerOpenLinkProps): ModelOutlinerNavigatePayload | null {
  const catalogId = props.catalogAssetId?.trim() ?? "";
  if (catalogId.length > 0) {
    return buildCatalogOutlinerNavigate(catalogId, props.typeFilter);
  }
  const canvasId = props.canvasModelId?.trim() ?? "";
  if (canvasId.length > 0) {
    return buildCanvasModelOutlinerNavigate(canvasId, props.typeFilter);
  }
  return props.typeFilter != null ? { typeFilter: props.typeFilter } : {};
}

export function ModelOutlinerOpenLink(props: ModelOutlinerOpenLinkProps) {
  const { label = "Open Model Outliner", className } = props;
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();

  if (onFocusWorkbenchPane == null) {
    return null;
  }

  const payload = resolveNavigatePayload(props) ?? {};

  return (
    <TRNButton
      type="button"
      size="compact"
      className={className}
      hint="Browse this model in the Model Outliner — hierarchy, drag-spawn, and detail strip."
      onClick={() => {
        openModelOutliner(onFocusWorkbenchPane, payload);
      }}
    >
      <ListTree className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
      {label}
    </TRNButton>
  );
}
