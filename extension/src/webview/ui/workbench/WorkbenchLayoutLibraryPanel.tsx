import { ArrowDown, ArrowUp, Copy, Download, Pencil, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNButton } from "../TRN/TRNButton.js";
import { TRNFormField } from "../TRN/TRNForm.js";
import { TRNHintText } from "../TRN/TRNHintText.js";
import { TRNMessageDialog } from "../TRN/TRNMessageDialog.js";
import { TRNSelect } from "../TRN/TRNSelect.js";
import { TRNWindow } from "../TRN/TRNWindow.js";
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

  const namedLayouts = useMemo(
    () => listNamedWorkbenchLayouts(appId),
    [appId, revision],
  );
  const startupPreference = useMemo(
    () => readWorkbenchStartupPreference(appId),
    [appId, revision],
  );

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

  if (!open) {
    return null;
  }

  return (
    <>
      <TRNWindow
        open={open && renameTargetId == null}
        onOpenChange={onOpenChange}
        title="Manage workbench layouts"
        initialRect={{ width: 560, height: 480 }}
        zIndex={6200}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <TRNFormField label="Startup layout">
            <TRNSelect
              value={startupSelectValue}
              options={startupOptions}
              onValueChange={handleStartupChange}
            />
          </TRNFormField>
          <TRNHintText>
            Startup: {startupLabel(startupPreference, presets, namedLayouts)}. Up to{" "}
            {MAX_NAMED_WORKBENCH_LAYOUTS} saved layouts.
          </TRNHintText>
          {importError ? (
            <TRNHintText className="text-amber-300/90">{importError}</TRNHintText>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide rounded border border-white/10">
            {namedLayouts.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-zinc-500">
                No saved layouts yet. Use “Save current layout as…” from the Layout menu.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {namedLayouts.map((row, index) => {
                  const isStartup =
                    startupPreference.kind === "named" && startupPreference.layoutId === row.id;
                  return (
                    <li key={row.id} className="flex items-start gap-2 px-2 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm text-zinc-100">
                          {isStartup ? (
                            <Star className="size-3 shrink-0 text-amber-300/90" aria-hidden />
                          ) : null}
                          <span className="truncate font-medium">{row.name}</span>
                        </div>
                        <TRNHintText className="truncate">
                          {summarizeWorkbenchLayoutPanes(row.layout)}
                        </TRNHintText>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          onClick={() => onLoadNamed(row.id)}
                        >
                          Load
                        </TRNButton>
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          onClick={() => {
                            setRenameTargetId(row.id);
                            setRenameValue(row.name);
                            setRenameError(null);
                          }}
                        >
                          <Pencil className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          onClick={() => {
                            duplicateNamedWorkbenchLayout(appId, row.id);
                            onRevisionChange();
                          }}
                        >
                          <Copy className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          onClick={() => onExportSnapshot(row.id)}
                        >
                          <Download className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          disabled={index === 0}
                          onClick={() => {
                            reorderNamedWorkbenchLayout(appId, row.id, -1);
                            onRevisionChange();
                          }}
                        >
                          <ArrowUp className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          disabled={index === namedLayouts.length - 1}
                          onClick={() => {
                            reorderNamedWorkbenchLayout(appId, row.id, 1);
                            onRevisionChange();
                          }}
                        >
                          <ArrowDown className="size-3" aria-hidden />
                        </TRNButton>
                        <TRNButton
                          className="px-1.5 py-0.5 text-[10px]"
                          onClick={() => setDeleteTargetId(row.id)}
                        >
                          <Trash2 className="size-3" aria-hidden />
                        </TRNButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <TRNButton onClick={onImportPick}>Import layout…</TRNButton>
            <TRNButton onClick={() => onOpenChange(false)}>Close</TRNButton>
          </div>
        </div>
      </TRNWindow>

      <TRNWindow
        open={renameTargetId != null}
        onOpenChange={(next) => {
          if (!next) {
            setRenameTargetId(null);
          }
        }}
        title="Rename layout"
        initialRect={{ width: 380, height: 200 }}
        zIndex={6300}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <TRNFormField label="Layout name">
            <input
              type="text"
              value={renameValue}
              autoFocus
              maxLength={48}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500/50"
              onChange={(event) => {
                setRenameValue(event.target.value);
                setRenameError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleRename();
                }
              }}
            />
          </TRNFormField>
          {renameError ? <TRNHintText className="text-amber-300/90">{renameError}</TRNHintText> : null}
          <div className="mt-auto flex justify-end gap-2">
            <TRNButton onClick={() => setRenameTargetId(null)}>Cancel</TRNButton>
            <TRNButton
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
        Remove <strong>{deleteTargetName}</strong> from your layout library?
      </TRNMessageDialog>
    </>
  );
}
