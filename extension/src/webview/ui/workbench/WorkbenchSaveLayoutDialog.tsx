import { LayoutTemplate, PanelsTopLeft } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../TRN/TRNButton.js";
import { TRNFormField } from "../TRN/TRNForm.js";
import { TRNMessageDialog } from "../TRN/TRNMessageDialog.js";
import { TRNWindow, type TRNWindowRect } from "../TRN/TRNWindow.js";
import {
  computeCenteredWorkbenchDialogRect,
  WORKBENCH_LAYOUT_FIELD_INPUT_CLASS,
} from "./workbench-layout-dialog-chrome.js";
import {
  listNamedWorkbenchLayouts,
  MAX_NAMED_WORKBENCH_LAYOUTS,
  normalizeWorkbenchLayoutName,
  saveNamedWorkbenchLayout,
  summarizeWorkbenchLayoutPanes,
  type WorkbenchLayoutAppId,
} from "./workbench-layout-library";
import type { LayoutNode } from "./types";
import type { WorkbenchDockSizeMemory } from "./workbench-dock-size-memory";

const SAVE_LAYOUT_DIALOG_WIDTH_PX = 420;
const SAVE_LAYOUT_DIALOG_HEIGHT_PX = 340;

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
  const [initialRect, setInitialRect] = useState<Partial<TRNWindowRect>>(() =>
    computeCenteredWorkbenchDialogRect(
      SAVE_LAYOUT_DIALOG_WIDTH_PX,
      SAVE_LAYOUT_DIALOG_HEIGHT_PX,
    ),
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setInitialRect(
      computeCenteredWorkbenchDialogRect(
        SAVE_LAYOUT_DIALOG_WIDTH_PX,
        SAVE_LAYOUT_DIALOG_HEIGHT_PX,
      ),
    );
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
      setOverwriteName(null);
    }
  }, [open]);

  const savedCount = useMemo(
    () => (open ? listNamedWorkbenchLayouts(appId).length : 0),
    [appId, open],
  );

  const paneSummary = useMemo(() => summarizeWorkbenchLayoutPanes(layout), [layout]);
  const libraryFull = savedCount >= MAX_NAMED_WORKBENCH_LAYOUTS;
  const canSave = normalizeWorkbenchLayoutName(name).length > 0 && !libraryFull;

  const closeDialog = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

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
          setError(`Library full (${MAX_NAMED_WORKBENCH_LAYOUTS} layouts). Delete one in Manage layouts.`);
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

  return (
    <>
      <TRNWindow
        open={open && overwriteName == null}
        title="Save layout"
        prefixIcon={
          <LayoutTemplate className="h-4 w-4 text-cyan-300/90" strokeWidth={2} aria-hidden />
        }
        onClose={closeDialog}
        initialRect={initialRect}
        minWidth={320}
        minHeight={280}
        modal
        modalBackdropCloses={false}
        draggable={false}
        resizable={false}
        showMaximize={false}
        showFooter={false}
        glass
        glassPreset="medium"
        zIndex={6100}
        contentClassName="min-h-0 overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-md border border-zinc-700/70 bg-zinc-950/55 p-2.5">
            <div className="flex items-start gap-2.5">
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-500/25 bg-cyan-950/35 text-cyan-200/90"
                aria-hidden
              >
                <PanelsTopLeft className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] font-medium text-zinc-100">Current arrangement</p>
                <p className="text-[11px] leading-snug text-zinc-400">
                  Saves open panes, tab groups, split ratios, and dock sizes for this workspace.
                </p>
                {paneSummary.length > 0 ? (
                  <p className="truncate text-[10px] text-zinc-500">{paneSummary}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
              <span className="text-[10px] text-zinc-500">Named layouts</span>
              <span
                className={twMerge(
                  "rounded border px-1.5 py-px text-[10px] font-semibold tracking-wide",
                  libraryFull
                    ? "border-amber-500/35 bg-amber-950/40 text-amber-200/90"
                    : "border-zinc-600/80 bg-zinc-900/80 text-zinc-300",
                )}
              >
                {savedCount} / {MAX_NAMED_WORKBENCH_LAYOUTS}
              </span>
            </div>
          </div>

          <TRNFormField
            id="workbench-save-layout-name"
            label="Layout name"
            required
            hint="Shown in Layout → Manage layouts and startup picker."
            error={error ?? undefined}
          >
            <input
              id="workbench-save-layout-name"
              type="text"
              value={name}
              autoFocus
              maxLength={48}
              disabled={libraryFull}
              className={WORKBENCH_LAYOUT_FIELD_INPUT_CLASS}
              placeholder="e.g. Graph authoring"
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) {
                  e.preventDefault();
                  attemptSave(false);
                }
              }}
            />
          </TRNFormField>

          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-800/80 pt-2">
            <TRNButton size="compact" onClick={closeDialog}>
              Cancel
            </TRNButton>
            <TRNButton
              size="compact"
              selected
              disabled={!canSave}
              onClick={() => attemptSave(false)}
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
        A layout named <strong className="text-zinc-100">{overwriteName}</strong> already exists.
        Replace it with the current pane arrangement?
      </TRNMessageDialog>
    </>
  );
}
