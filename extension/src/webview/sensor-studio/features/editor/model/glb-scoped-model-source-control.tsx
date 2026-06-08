import { Link2 } from "lucide-react";
import type { TRNSelectOption } from "../../../../ui/TRN";
import { TRNSelect } from "../../../../ui/TRN";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS } from "../components/inspector/inspector-dense-select-button";
import { STUDIO_MODEL_SELECT_CUSTOM } from "../../asset-browser/studio-model-scene-bindings";

export type GlbScopedModelSourceControlProps = {
  isModelWired: boolean;
  wiredModelDisplayLabel: string | null;
  modelSourceOptions: TRNSelectOption[];
  modelSourceValue: string;
  modelSourceDisabled: boolean;
  onCatalogSelect: (catalogAssetId: string) => void;
  /** Canvas card uses compact label row; inspector uses TRNFormField wrapper externally. */
  variant?: "canvas" | "inspector-inline";
};

export function GlbScopedModelSourceControl(props: GlbScopedModelSourceControlProps) {
  const {
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    onCatalogSelect,
    variant = "canvas",
  } = props;

  if (isModelWired) {
    return (
      <div
        className={
          variant === "canvas"
            ? "flex items-center gap-1 text-[9px] text-zinc-500"
            : "mb-2 space-y-1.5"
        }
      >
        {variant === "canvas" ? <span className="shrink-0">Model</span> : null}
        <span
          className={`inline-flex min-w-0 flex-1 items-center gap-0.5 truncate rounded border px-1 py-px ${
            variant === "canvas" ? "min-h-7 px-1.5 py-1 text-[10px]" : "min-h-7 px-2 py-1.5 text-[10px]"
          } border-emerald-800/60 bg-emerald-950/30 text-emerald-200/90`}
        >
          <Link2 className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span className="truncate">{wiredModelDisplayLabel ?? "Linked model"}</span>
        </span>
      </div>
    );
  }

  const select = (
    <TRNSelect
      ariaLabel="GLB model"
      value={modelSourceValue}
      options={modelSourceOptions}
      disabled={modelSourceDisabled}
      size="sm"
      className="min-w-0 w-full"
      buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
      panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
      onValueChange={(next) => {
        if (next === STUDIO_MODEL_SELECT_CUSTOM) {
          return;
        }
        onCatalogSelect(next);
      }}
    />
  );

  if (variant === "canvas") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
          <span>Model</span>
        </div>
        {select}
      </div>
    );
  }

  return select;
}
