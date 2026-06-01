import { useCallback, useEffect, useState } from "react";
import { TRNButton } from "../TRN/TRNButton.js";
import { TRNFormField } from "../TRN/TRNForm.js";
import { TRNHintText } from "../TRN/TRNHintText.js";
import { TRNMessageDialog } from "../TRN/TRNMessageDialog.js";
import { TRNWindow } from "../TRN/TRNWindow.js";
import {
  MAX_NAMED_WORKBENCH_LAYOUTS,
  normalizeWorkbenchLayoutName,
  saveNamedWorkbenchLayout,
  summarizeWorkbenchLayoutPanes,
  type WorkbenchLayoutAppId,
} from "./workbench-layout-library";
import type { LayoutNode } from "./types";
import type { WorkbenchDockSizeMemory } from "./workbench-dock-size-memory";

type WorkbenchSaveLayoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: WorkbenchLayoutAppId;
  layout: LayoutNode;
  dockMemory: WorkbenchDockSizeMemory;
  onSaved: (name: string) => void;
};

export function WorkbenchSaveLayoutDialog({
  open,
  onOpenChange,
  appId,
  layout,
  dockMemory,
  onSaved,
}: WorkbenchSaveLayoutDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [overwriteName, setOverwriteName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
      setOverwriteName(null);
    }
  }, [open]);

  const attemptSave = useCallback(
    (allowOverwrite: boolean) => {
      const result = saveNamedWorkbenchLayout({
        appId,
        name,
        layout,
        dockMemory,
        allowOverwrite,
      });
      if (!result.ok) {
        if (result.reason === "name_conflict" && result.existing) {
          setOverwriteName(result.existing.name);
          return;
        }
        if (result.reason === "library_full") {
          setError(`Library full (${MAX_NAMED_WORKBENCH_LAYOUTS} layouts). Delete one first.`);
          return;
        }
        setError("Enter a layout name.");
        return;
      }
      onSaved(result.snapshot.name);
      onOpenChange(false);
    },
    [appId, dockMemory, layout, name, onOpenChange, onSaved],
  );

  if (!open) {
    return null;
  }

  const paneSummary = summarizeWorkbenchLayoutPanes(layout);

  return (
    <>
      <TRNWindow
        open={open && overwriteName == null}
        onOpenChange={onOpenChange}
        title="Save workbench layout"
        initialRect={{ width: 420, height: 260 }}
        zIndex={6100}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <TRNHintText>
            Saves pane arrangement and split ratios ({paneSummary || "panes"}). Up to{" "}
            {MAX_NAMED_WORKBENCH_LAYOUTS} named layouts per workspace.
          </TRNHintText>
          <TRNFormField label="Layout name">
            <input
              type="text"
              value={name}
              autoFocus
              maxLength={48}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500/50"
              placeholder="e.g. Graph authoring"
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  attemptSave(false);
                }
              }}
            />
          </TRNFormField>
          {error ? <TRNHintText className="text-amber-300/90">{error}</TRNHintText> : null}
          <div className="mt-auto flex justify-end gap-2">
            <TRNButton onClick={() => onOpenChange(false)}>Cancel</TRNButton>
            <TRNButton
              selected
              onClick={() => attemptSave(false)}
              disabled={!normalizeWorkbenchLayoutName(name)}
            >
              Save layout
            </TRNButton>
          </div>
        </div>
      </TRNWindow>

      <TRNMessageDialog
        open={overwriteName != null}
        onOpenChange={(next) => {
          if (!next) {
            setOverwriteName(null);
          }
        }}
        title="Replace saved layout?"
        variant="warning"
        primaryTone="default"
        primaryAction={{
          label: "Replace",
          onClick: () => {
            attemptSave(true);
            setOverwriteName(null);
          },
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setOverwriteName(null),
        }}
      >
        A layout named <strong>{overwriteName}</strong> already exists. Replace it with the current
        arrangement?
      </TRNMessageDialog>
    </>
  );
}
