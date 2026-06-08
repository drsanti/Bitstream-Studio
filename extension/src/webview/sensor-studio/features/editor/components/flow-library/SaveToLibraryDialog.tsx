import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TRNButton, TRNFormField, TRNHintText, TRNSelect } from "../../../../../ui/TRN";
import {
  STUDIO_FLOW_PRESET_CATEGORIES,
  type StudioFlowPresetCategory,
} from "../../flow-library/studio-flow-preset-file";
import type { SaveToLibraryTarget } from "../../flow-library/resolve-save-to-library-target";
import { saveToLibraryTargetLabel } from "../../flow-library/resolve-save-to-library-target";
import {
  STUDIO_NODE_ASSET_CATEGORIES,
  type StudioNodeAssetCategory,
} from "../../subgraphs/node-library/studio-node-asset-file";

const FLOW_CATEGORY_OPTIONS = STUDIO_FLOW_PRESET_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const GROUP_CATEGORY_OPTIONS = STUDIO_NODE_ASSET_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export type SaveToLibraryDialogProps = {
  open: boolean;
  target: SaveToLibraryTarget;
  mode?: "save" | "edit";
  defaultName?: string;
  defaultFlowCategory?: StudioFlowPresetCategory;
  defaultGroupCategory?: StudioNodeAssetCategory;
  defaultDescription?: string;
  linkedPresetName?: string | null;
  scopeHint?: string;
  onConfirm: (args: {
    name: string;
    flowCategory?: StudioFlowPresetCategory;
    groupCategory?: StudioNodeAssetCategory;
    description?: string;
  }) => void;
  onCancel: () => void;
};

export function SaveToLibraryDialog(props: SaveToLibraryDialogProps) {
  const {
    open,
    target,
    mode = "save",
    defaultName = "",
    defaultFlowCategory = "custom",
    defaultGroupCategory = "composition",
    defaultDescription = "",
    linkedPresetName = null,
    scopeHint,
    onConfirm,
    onCancel,
  } = props;
  const titleId = useId();
  const isGroupTarget = target === "group";
  const categoryOptions = isGroupTarget ? GROUP_CATEGORY_OPTIONS : FLOW_CATEGORY_OPTIONS;
  const defaultCategory = isGroupTarget ? defaultGroupCategory : defaultFlowCategory;

  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [description, setDescription] = useState(defaultDescription);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setCategory(defaultCategory);
      setDescription(defaultDescription);
    }
  }, [open, defaultCategory, defaultDescription, defaultName]);

  const dialogTitle = useMemo(() => {
    if (mode === "edit") {
      return isGroupTarget ? "Edit group preset" : "Edit flow preset";
    }
    return "Save to library";
  }, [isGroupTarget, mode]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-zinc-700/70 bg-zinc-950/90 px-5 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-sm font-semibold text-zinc-100">
          {dialogTitle}
        </h2>
        {mode === "save" ? (
          <p className="mt-1 text-[11px] text-zinc-500">
            Target: <span className="text-zinc-300">{saveToLibraryTargetLabel(target)}</span>
            {scopeHint != null && scopeHint.length > 0 ? (
              <span className="text-zinc-500"> · {scopeHint}</span>
            ) : null}
          </p>
        ) : null}

        {mode === "save" && linkedPresetName != null && linkedPresetName.length > 0 ? (
          <TRNHintText tone="muted" className="mt-2 text-[11px] leading-relaxed">
            This {isGroupTarget ? "group" : "canvas"} is already saved as{" "}
            <span className="text-zinc-200">{linkedPresetName}</span>. Saving will update that
            library entry with the current {isGroupTarget ? "inner graph" : "graph"}.
          </TRNHintText>
        ) : null}

        <div className="mt-3 space-y-2.5">
          <TRNFormField label="Name">
            <input
              className="w-full rounded-md border border-zinc-700/70 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Preset name"
            />
          </TRNFormField>
          <TRNFormField label="Category">
            <TRNSelect
              ariaLabel={isGroupTarget ? "Group preset category" : "Flow preset category"}
              value={category}
              options={categoryOptions}
              size="sm"
              onValueChange={setCategory}
            />
          </TRNFormField>
          <TRNFormField label="Description">
            <textarea
              className="min-h-[56px] w-full resize-y rounded-md border border-zinc-700/70 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Preset description"
            />
          </TRNFormField>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <TRNButton size="compact" onClick={onCancel}>
            Cancel
          </TRNButton>
          <TRNButton
            size="compact"
            selected
            disabled={!canSave}
            onClick={() => {
              if (!canSave) {
                return;
              }
              const trimmedDescription =
                description.trim().length > 0 ? description.trim() : undefined;
              onConfirm({
                name: trimmedName,
                description: trimmedDescription,
                ...(isGroupTarget
                  ? { groupCategory: category as StudioNodeAssetCategory }
                  : { flowCategory: category as StudioFlowPresetCategory }),
              });
            }}
          >
            {mode === "edit" ? "Update" : linkedPresetName != null ? "Update library" : "Save"}
          </TRNButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
