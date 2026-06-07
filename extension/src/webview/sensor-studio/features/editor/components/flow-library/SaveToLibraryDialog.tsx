import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { TRNButton, TRNFormField, TRNSelect } from "../../../../../ui/TRN";
import {
  STUDIO_FLOW_PRESET_CATEGORIES,
  type StudioFlowPresetCategory,
} from "../../flow-library/studio-flow-preset-file";
import type { SaveToLibraryTarget } from "../../flow-library/resolve-save-to-library-target";
import { saveToLibraryTargetLabel } from "../../flow-library/resolve-save-to-library-target";

const CATEGORY_OPTIONS = STUDIO_FLOW_PRESET_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export type SaveToLibraryDialogProps = {
  open: boolean;
  target: SaveToLibraryTarget;
  mode?: "save" | "edit";
  defaultName?: string;
  defaultCategory?: StudioFlowPresetCategory;
  defaultDescription?: string;
  scopeHint?: string;
  onConfirm: (args: {
    name: string;
    category: StudioFlowPresetCategory;
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
    defaultCategory = "custom",
    defaultDescription = "",
    scopeHint,
    onConfirm,
    onCancel,
  } = props;
  const titleId = useId();
  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState<StudioFlowPresetCategory>(defaultCategory);
  const [description, setDescription] = useState(defaultDescription);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setCategory(defaultCategory);
      setDescription(defaultDescription);
    }
  }, [open, defaultCategory, defaultDescription, defaultName]);

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
          {mode === "edit" ? "Edit flow preset" : "Save to library"}
        </h2>
        {mode === "save" ? (
          <p className="mt-1 text-[11px] text-zinc-500">
            Target: <span className="text-zinc-300">{saveToLibraryTargetLabel(target)}</span>
            {scopeHint != null && scopeHint.length > 0 ? (
              <span className="text-zinc-500"> · {scopeHint}</span>
            ) : null}
          </p>
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
          {target !== "group" || mode === "edit" ? (
            <TRNFormField label="Category">
              <TRNSelect
                ariaLabel="Flow preset category"
                value={category}
                options={CATEGORY_OPTIONS}
                size="sm"
                onValueChange={(v) => setCategory(v as StudioFlowPresetCategory)}
              />
            </TRNFormField>
          ) : null}
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
              onConfirm({
                name: trimmedName,
                category,
                description: description.trim().length > 0 ? description.trim() : undefined,
              });
            }}
          >
            {mode === "edit" ? "Update" : "Save"}
          </TRNButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
