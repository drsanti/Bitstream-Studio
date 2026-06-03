import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FolderOpen,
  LayoutGrid,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../TRN/TRNButton.js";
import { TRNFormField } from "../TRN/TRNForm.js";
import { TRNMessageDialog } from "../TRN/TRNMessageDialog.js";
import { TRNSelect } from "../TRN/TRNSelect.js";
import { TRNWindow, type TRNWindowRect } from "../TRN/TRNWindow.js";
import {
  computeCenteredWorkbenchDialogRect,
  WORKBENCH_LAYOUT_FIELD_INPUT_CLASS,
} from "./workbench-layout-dialog-chrome.js";
import {
  deleteNamedWorkbenchLayout,
  duplicateNamedWorkbenchLayout,
  listNamedWorkbenchLayouts,
  MAX_NAMED_WORKBENCH_LAYOUTS,
  normalizeWorkbenchLayoutName,
  readWorkbenchStartupPreference,
  renameNamedWorkbenchLayout,
  reorderNamedWorkbenchLayout,
  summarizeWorkbenchLayoutPanes,
  writeWorkbenchStartupPreference,
  type WorkbenchLayoutAppId,
  type WorkbenchLayoutPreset,
  type WorkbenchStartupPreference,
} from "./workbench-layout-library";

const MANAGE_LAYOUT_DIALOG_WIDTH_PX = 520;
const MANAGE_LAYOUT_DIALOG_HEIGHT_PX = 520;
const RENAME_LAYOUT_DIALOG_WIDTH_PX = 400;
const RENAME_LAYOUT_DIALOG_HEIGHT_PX = 220;

type WorkbenchLayoutLibraryPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: WorkbenchLayoutAppId;
  presets: readonly WorkbenchLayoutPreset[];
  revision: number;
  onRevisionChange: () => void;
  onLoadNamed: (layoutId: string) => void;
  onExportSnapshot: (layoutId: string) => void;
  onImportPick: () => void;
  importError?: string | null;
};

function startupLabel(
  preference: WorkbenchStartupPreference,
  presets: readonly WorkbenchLayoutPreset[],
  namedLayouts: ReturnType<typeof listNamedWorkbenchLayouts>,
): string {
  if (preference.kind === "session") {
    return "Last session layout";
  }
  if (preference.kind === "preset") {
    return presets.find((row) => row.id === preference.presetId)?.label ?? preference.presetId;
  }
  return namedLayouts.find((row) => row.id === preference.layoutId)?.name ?? "Saved layout";
}

export function WorkbenchLayoutLibraryPanel({
  open,
  onOpenChange,
  appId,
  presets,
  revision,
  onRevisionChange,
  onLoadNamed,
  onExportSnapshot,
  onImportPick,
  importError,
}: WorkbenchLayoutLibraryPanelProps) {
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [manageRect, setManageRect] = useState<Partial<TRNWindowRect>>(() =>
    computeCenteredWorkbenchDialogRect(
      MANAGE_LAYOUT_DIALOG_WIDTH_PX,
      MANAGE_LAYOUT_DIALOG_HEIGHT_PX,
    ),
  );
  const [renameRect, setRenameRect] = useState<Partial<TRNWindowRect>>(() =>
    computeCenteredWorkbenchDialogRect(
      RENAME_LAYOUT_DIALOG_WIDTH_PX,
      RENAME_LAYOUT_DIALOG_HEIGHT_PX,
    ),
  );

  const namedLayouts = useMemo(
    () => listNamedWorkbenchLayouts(appId),
    [appId, revision],
  );
  const startupPreference = useMemo(
    () => readWorkbenchStartupPreference(appId),
    [appId, revision],
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setManageRect(
      computeCenteredWorkbenchDialogRect(
        MANAGE_LAYOUT_DIALOG_WIDTH_PX,
        MANAGE_LAYOUT_DIALOG_HEIGHT_PX,
      ),
    );
  }, [open]);

  useLayoutEffect(() => {
    if (renameTargetId == null) {
      return;
    }
    setRenameRect(
      computeCenteredWorkbenchDialogRect(
        RENAME_LAYOUT_DIALOG_WIDTH_PX,
        RENAME_LAYOUT_DIALOG_HEIGHT_PX,
      ),
    );
  }, [renameTargetId]);

  useEffect(() => {
    if (!open) {
      setRenameTargetId(null);
      setRenameValue("");
      setRenameError(null);
      setDeleteTargetId(null);
    }
  }, [open]);

  const startupOptions = useMemo(() => {
    const rows = [{ value: "session", label: "Last session layout" }];
    for (const preset of presets) {
      rows.push({ value: `preset:${preset.id}`, label: `Preset: ${preset.label}` });
    }
    for (const layout of namedLayouts) {
      rows.push({ value: `named:${layout.id}`, label: `Saved: ${layout.name}` });
    }
    return rows;
  }, [namedLayouts, presets]);

  const startupSelectValue = useMemo(() => {
    if (startupPreference.kind === "session") {
      return "session";
    }
    if (startupPreference.kind === "preset") {
      return `preset:${startupPreference.presetId}`;
    }
    return `named:${startupPreference.layoutId}`;
  }, [startupPreference]);

  const closeDialog = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleStartupChange = useCallback(
    (value: string) => {
      if (value === "session") {
        writeWorkbenchStartupPreference(appId, { kind: "session" });
      } else if (value.startsWith("preset:")) {
        writeWorkbenchStartupPreference(appId, {
          kind: "preset",
          presetId: value.slice("preset:".length),
        });
      } else if (value.startsWith("named:")) {
        writeWorkbenchStartupPreference(appId, {
          kind: "named",
          layoutId: value.slice("named:".length),
        });
      }
      onRevisionChange();
    },
    [appId, onRevisionChange],
  );

  const handleRename = useCallback(() => {
    if (!renameTargetId) {
      return;
    }
    const result = renameNamedWorkbenchLayout({
      appId,
      layoutId: renameTargetId,
      name: renameValue,
    });
    if (!result.ok) {
      if (result.reason === "name_conflict") {
        setRenameError(`Name already used by “${result.existing?.name}”.`);
        return;
      }
      setRenameError("Enter a layout name.");
      return;
    }
    setRenameTargetId(null);
    onRevisionChange();
  }, [appId, onRevisionChange, renameTargetId, renameValue]);

  const deleteTargetName =
    namedLayouts.find((row) => row.id === deleteTargetId)?.name ?? "layout";

  const savedCount = namedLayouts.length;
  const libraryFull = savedCount >= MAX_NAMED_WORKBENCH_LAYOUTS;
  const activeStartupLabel = startupLabel(startupPreference, presets, namedLayouts);

  if (!open) {
    return null;
  }

  return (
    <>
      <TRNWindow
        open={open && renameTargetId == null}
        title="Manage layouts"
        prefixIcon={
          <LayoutGrid className="h-4 w-4 text-cyan-300/90" strokeWidth={2} aria-hidden />
        }
        onClose={closeDialog}
        initialRect={manageRect}
        minWidth={400}
        minHeight={360}
        modal
        modalBackdropCloses={false}
        draggable={false}
        resizable={false}
        showMaximize={false}
        showFooter={false}
        glass
        glassPreset="medium"
        zIndex={6200}
        contentClassName="min-h-0 overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-md border border-zinc-700/70 bg-zinc-950/55 p-2.5">
            <TRNFormField
              label="Startup layout"
              hint="Applied when this workspace opens (after built-in presets and saved layouts)."
            >
              <TRNSelect
                ariaLabel="Startup layout"
                size="sm"
                value={startupSelectValue}
                options={startupOptions}
                onValueChange={handleStartupChange}
              />
            </TRNFormField>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
              <span className="truncate text-[10px] text-zinc-500">
                Active: <span className="text-zinc-300">{activeStartupLabel}</span>
              </span>
              <span
                className={twMerge(
                  "shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold tracking-wide",
                  libraryFull
                    ? "border-amber-500/35 bg-amber-950/40 text-amber-200/90"
                    : "border-zinc-600/80 bg-zinc-900/80 text-zinc-300",
                )}
              >
                {savedCount} / {MAX_NAMED_WORKBENCH_LAYOUTS} saved
              </span>
            </div>
          </div>

          {importError ? (
            <p className="text-[11px] leading-snug text-amber-300/90">{importError}</p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide rounded-md border border-zinc-700/70 bg-zinc-950/40">
            {namedLayouts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <FolderOpen className="h-8 w-8 text-zinc-600" strokeWidth={1.5} aria-hidden />
                <p className="text-[12px] font-medium text-zinc-400">No saved layouts yet</p>
                <p className="max-w-xs text-[11px] leading-snug text-zinc-500">
                  Use Layout → Save current layout as… to add one, then load or set it as startup
                  here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800/80">
                {namedLayouts.map((row, index) => {
                  const isStartup =
                    startupPreference.kind === "named" && startupPreference.layoutId === row.id;
                  const paneSummary = summarizeWorkbenchLayoutPanes(row.layout);
                  return (
                    <li
                      key={row.id}
                      className={twMerge(
                        "flex items-start gap-2 px-2.5 py-2 transition-colors",
                        isStartup ? "bg-amber-950/15" : "hover:bg-zinc-900/35",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isStartup ? (
                            <Star
                              className="size-3 shrink-0 text-amber-300/90"
                              aria-hidden
                            />
                          ) : (
                            <span className="size-3 shrink-0" aria-hidden />
                          )}
                          <span className="truncate text-[12px] font-medium text-zinc-100">
                            {row.name}
                          </span>
                          {isStartup ? (
                            <span className="shrink-0 rounded border border-amber-500/30 bg-amber-950/40 px-1 py-px text-[8px] font-semibold tracking-wide text-amber-200/90">
                              Startup
                            </span>
                          ) : null}
                        </div>
                        {paneSummary.length > 0 ? (
                          <p className="truncate pl-4 text-[10px] text-zinc-500">{paneSummary}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5">
                        <TRNButton
                          size="compact"
                          selected
                          className="px-2"
                          onClick={() => onLoadNamed(row.id)}
                        >
                          Load
                        </TRNButton>
                        <TRNButton
                          size="compact"
                          className="px-1.5"
                          hint="Rename"
                          onClick={() => {
                            setRenameTargetId(row.id);
                            setRenameValue(row.name);
                            setRenameError(null);
                          }}
                        >
                          <Pencil className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          size="compact"
                          className="px-1.5"
                          hint="Duplicate"
                          disabled={libraryFull}
                          onClick={() => {
                            duplicateNamedWorkbenchLayout(appId, row.id);
                            onRevisionChange();
                          }}
                        >
                          <Copy className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          size="compact"
                          className="px-1.5"
                          hint="Export JSON"
                          onClick={() => onExportSnapshot(row.id)}
                        >
                          <Download className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          size="compact"
                          className="px-1.5"
                          hint="Move up"
                          disabled={index === 0}
                          onClick={() => {
                            reorderNamedWorkbenchLayout(appId, row.id, -1);
                            onRevisionChange();
                          }}
                        >
                          <ArrowUp className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          size="compact"
                          className="px-1.5"
                          hint="Move down"
                          disabled={index === namedLayouts.length - 1}
                          onClick={() => {
                            reorderNamedWorkbenchLayout(appId, row.id, 1);
                            onRevisionChange();
                          }}
                        >
                          <ArrowDown className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          size="compact"
                          className="px-1.5"
                          hint="Delete"
                          onClick={() => setDeleteTargetId(row.id)}
                        >
                          <Trash2 className="size-3 text-rose-300/90" aria-hidden />
                        </TRNButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
            <TRNButton size="compact" onClick={onImportPick}>
              Import layout…
            </TRNButton>
            <TRNButton size="compact" onClick={closeDialog}>
              Close
            </TRNButton>
          </div>
        </div>
      </TRNWindow>

      <TRNWindow
        open={renameTargetId != null}
        title="Rename layout"
        prefixIcon={
          <Pencil className="h-4 w-4 text-cyan-300/90" strokeWidth={2} aria-hidden />
        }
        onClose={() => setRenameTargetId(null)}
        initialRect={renameRect}
        minWidth={320}
        minHeight={200}
        modal
        modalBackdropCloses={false}
        draggable={false}
        resizable={false}
        showMaximize={false}
        showFooter={false}
        glass
        glassPreset="medium"
        zIndex={6300}
        contentClassName="min-h-0 overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <TRNFormField
            id="workbench-rename-layout-name"
            label="Layout name"
            required
            error={renameError ?? undefined}
          >
            <input
              id="workbench-rename-layout-name"
              type="text"
              value={renameValue}
              autoFocus
              maxLength={48}
              className={WORKBENCH_LAYOUT_FIELD_INPUT_CLASS}
              onChange={(event) => {
                setRenameValue(event.target.value);
                setRenameError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && normalizeWorkbenchLayoutName(renameValue)) {
                  event.preventDefault();
                  handleRename();
                }
              }}
            />
          </TRNFormField>
          <div className="mt-auto flex justify-end gap-2 border-t border-zinc-800/80 pt-2">
            <TRNButton size="compact" onClick={() => setRenameTargetId(null)}>
              Cancel
            </TRNButton>
            <TRNButton
              size="compact"
              selected
              disabled={!normalizeWorkbenchLayoutName(renameValue)}
              onClick={handleRename}
            >
              Rename
            </TRNButton>
          </div>
        </div>
      </TRNWindow>

      <TRNMessageDialog
        open={deleteTargetId != null}
        onOpenChange={(next) => {
          if (!next) {
            setDeleteTargetId(null);
          }
        }}
        title="Delete saved layout?"
        variant="warning"
        primaryTone="danger"
        primaryAction={{
          label: "Delete",
          onClick: () => {
            if (deleteTargetId) {
              deleteNamedWorkbenchLayout(appId, deleteTargetId);
              if (
                startupPreference.kind === "named" &&
                startupPreference.layoutId === deleteTargetId
              ) {
                writeWorkbenchStartupPreference(appId, { kind: "session" });
              }
              onRevisionChange();
            }
            setDeleteTargetId(null);
          },
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setDeleteTargetId(null),
        }}
      >
        Remove <strong className="text-zinc-100">{deleteTargetName}</strong> from your layout
        library?
      </TRNMessageDialog>
    </>
  );
}
