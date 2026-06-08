import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlignVerticalJustifyCenter,
  Download,
  FolderOpen,
  Maximize2,
  Pencil,
  Play,
  Upload,
} from "lucide-react";
import type { DashboardLayoutModeV1 } from "../../core/dashboard/dashboard-layout";
import { TRNButton, TRNFormField, TRNHintText, TRNSelect } from "../../../ui/TRN";
import type { DashboardSnapshotV1 } from "../../core/dashboard/dashboard-snapshot";
import { downloadDashboardLayoutJson } from "../../core/dashboard/dashboard-layout-export";
import {
  listDashboardLayoutLibraryEntries,
  loadDashboardLayoutLibraryEntry,
  saveDashboardLayoutToLibrary,
} from "../../core/dashboard/dashboard-layout-library";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { useStudioWorkbenchShell } from "../editor/workbench/studio-workbench-context";
import { openDashboardOperatorLayout } from "./dashboard-navigation";

type DashboardViewportToolbarProps = {
  editMode: boolean;
  layoutMode: DashboardLayoutModeV1;
  snapshot: DashboardSnapshotV1;
  onEditModeChange: (next: boolean) => void;
  onStackLayout?: () => void;
};

export function DashboardViewportToolbar(props: DashboardViewportToolbarProps) {
  const { editMode, layoutMode, snapshot, onEditModeChange, onStackLayout } = props;
  const { onFocusWorkbenchPane, onApplyWorkbenchPreset } = useStudioWorkbenchShell();
  const importDashboardLayoutJson = useFlowEditorStore((state) => state.importDashboardLayoutJson);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [showSaveField, setShowSaveField] = useState(false);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [selectedLibraryId, setSelectedLibraryId] = useState("");

  const libraryEntries = useMemo(() => {
    void libraryVersion;
    return listDashboardLayoutLibraryEntries();
  }, [libraryVersion]);

  const libraryOptions = useMemo(
    () =>
      libraryEntries.map((entry) => ({
        value: entry.id,
        label: entry.name,
      })),
    [libraryEntries],
  );

  const reportImportResult = useCallback(
    (result: ReturnType<typeof importDashboardLayoutJson>) => {
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }
      const missing =
        result.missingNodeIds.length > 0
          ? ` ${result.missingNodeIds.length} node id(s) not found on this canvas.`
          : "";
      setFeedback(
        `Applied layout to ${result.matchedNodes} node(s).${missing}`,
      );
    },
    [],
  );

  const onImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        reportImportResult(importDashboardLayoutJson(text));
      };
      reader.readAsText(file);
    },
    [importDashboardLayoutJson, reportImportResult],
  );

  const onApplyLibraryEntry = useCallback(() => {
    if (selectedLibraryId.length === 0) {
      setFeedback("Choose a saved layout first.");
      return;
    }
    const entry = loadDashboardLayoutLibraryEntry(selectedLibraryId);
    if (entry == null) {
      setFeedback("Saved layout not found.");
      setLibraryVersion((v) => v + 1);
      return;
    }
    reportImportResult(importDashboardLayoutJson(JSON.stringify(entry.export)));
  }, [importDashboardLayoutJson, reportImportResult, selectedLibraryId]);

  const onSaveToLibrary = useCallback(() => {
    const entry = saveDashboardLayoutToLibrary(saveName, snapshot);
    setLibraryVersion((v) => v + 1);
    setSelectedLibraryId(entry.id);
    setSaveName("");
    setShowSaveField(false);
    setFeedback(`Saved layout "${entry.name}" to library.`);
  }, [saveName, snapshot]);

  return (
    <div className="flex shrink-0 flex-col border-b border-zinc-800/80 bg-zinc-950/90">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Dashboard
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-700/70 bg-zinc-900/50 p-0.5">
            <TRNButton
              type="button"
              size="compact"
              selected={!editMode}
              hint="Preview mode — interact with buttons, knobs, and switches."
              onClick={() => onEditModeChange(false)}
            >
              <Play className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
              Preview
            </TRNButton>
            <TRNButton
              type="button"
              size="compact"
              selected={editMode}
              hint="Edit mode — select, drag, and resize widgets. Gauges and readouts still show live graph data; controls are disabled until Preview."
              onClick={() => onEditModeChange(true)}
            >
              <Pencil className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
              Edit
            </TRNButton>
          </div>
          {editMode && layoutMode === "grid" && onStackLayout != null ? (
            <TRNButton
              type="button"
              size="compact"
              hint="Stack visible widgets in column 1 — top to bottom, preserving spans."
              onClick={onStackLayout}
            >
              <AlignVerticalJustifyCenter className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
              Stack
            </TRNButton>
          ) : null}
          <span className="mx-0.5 hidden h-4 w-px bg-zinc-700/80 sm:inline" aria-hidden />
          {onApplyWorkbenchPreset != null && onFocusWorkbenchPane != null ? (
            <TRNButton
              type="button"
              size="compact"
              hint="Full-screen operator layout — Dashboard only, no flow or library panes."
              onClick={() => {
                openDashboardOperatorLayout(onApplyWorkbenchPreset, onFocusWorkbenchPane);
              }}
            >
              <Maximize2 className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
              Operator
            </TRNButton>
          ) : null}
          <TRNButton
            type="button"
            size="compact"
            hint="Download the committed dashboard layout snapshot as JSON."
            onClick={() => downloadDashboardLayoutJson(snapshot)}
          >
            <Download className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Export
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            hint="Import layout JSON — updates placement, flex, publish flags, and Dashboard Output grid on matching flow nodes."
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Import
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            selected={showSaveField}
            hint="Save the current committed layout to a local library (browser storage)."
            onClick={() => setShowSaveField((open) => !open)}
          >
            <FolderOpen className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Save
          </TRNButton>
          {libraryOptions.length > 0 ? (
            <>
              <TRNSelect
                size="sm"
                className="min-w-[9rem]"
                value={selectedLibraryId}
                ariaLabel="Saved dashboard layout"
                sectionTitle="Saved layouts"
                options={libraryOptions}
                onValueChange={(next) => setSelectedLibraryId(next)}
              />
              <TRNButton
                type="button"
                size="compact"
                hint="Apply the selected saved layout to matching flow nodes."
                onClick={onApplyLibraryEntry}
              >
                Apply
              </TRNButton>
            </>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file != null) {
              onImportFile(file);
            }
            event.target.value = "";
          }}
        />
      </div>
      {showSaveField ? (
        <div className="flex items-end gap-2 border-t border-zinc-800/60 px-2 py-1.5">
          <TRNFormField
            className="min-w-0 flex-1"
            label="Layout name"
            hint="Stored in browser localStorage for quick reuse on this machine."
          >
            <input
              className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSaveToLibrary();
                }
              }}
            />
          </TRNFormField>
          <TRNButton type="button" size="compact" onClick={onSaveToLibrary}>
            Save layout
          </TRNButton>
        </div>
      ) : null}
      {feedback != null ? (
        <TRNHintText className="border-t border-zinc-800/60 px-2 py-1 text-[11px] text-zinc-400">
          {feedback}
        </TRNHintText>
      ) : null}
    </div>
  );
}
