import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlignVerticalJustifyCenter,
  Check,
  Download,
  FolderOpen,
  Layers,
  Library,
  MonitorPlay,
  Pencil,
  Play,
  Upload,
} from "lucide-react";
import type { DashboardLayoutModeV1 } from "../../core/dashboard/dashboard-layout";
import { TRNFormField, TRNHintText, TRNSelect } from "../../../ui/TRN";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../../ui/TRN/TRNTooltip";
import type { DashboardSnapshotV1 } from "../../core/dashboard/dashboard-snapshot";
import { downloadDashboardLayoutJson } from "../../core/dashboard/dashboard-layout-export";
import {
  listDashboardLayoutLibraryEntries,
  loadDashboardLayoutLibraryEntry,
  saveDashboardLayoutToLibrary,
} from "../../core/dashboard/dashboard-layout-library";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import {
  FLOW_TOOLBAR_DIVIDER_CLASS,
  FLOW_TOOLBAR_PILL_CLASS,
  flowToolbarBtnClass,
} from "../editor/components/flow-toolbar/flow-toolbar-tokens";
import type { DashboardDisplayTarget } from "./dashboard-viewport-ui-persistence";

type DashboardViewportToolbarProps = {
  editMode: boolean;
  displayTarget: DashboardDisplayTarget;
  layoutMode: DashboardLayoutModeV1;
  snapshot: DashboardSnapshotV1;
  onEditModeChange: (next: boolean) => void;
  onDisplayTargetChange: (target: DashboardDisplayTarget) => void;
  onStackLayout?: () => void;
};

function ToolbarIconButton(props: {
  label: string;
  hint: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const { label, hint, active = false, onClick, children } = props;
  return (
    <TRNTooltip
      placement="bottom"
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
      triggerWrapper="span"
      content={hint}
      trigger={
        <button
          type="button"
          className={flowToolbarBtnClass(false, active)}
          aria-label={label}
          aria-pressed={active}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
        >
          {children}
        </button>
      }
    />
  );
}

export function DashboardViewportToolbar(props: DashboardViewportToolbarProps) {
  const {
    editMode,
    displayTarget,
    layoutMode,
    snapshot,
    onEditModeChange,
    onDisplayTargetChange,
    onStackLayout,
  } = props;
  const importDashboardLayoutJson = useFlowEditorStore((state) => state.importDashboardLayoutJson);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [showSaveField, setShowSaveField] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
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
      setFeedback(`Applied layout to ${result.matchedNodes} node(s).${missing}`);
    },
    [importDashboardLayoutJson],
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
    setShowLibraryPicker(false);
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
    <div
      className="pointer-events-none absolute top-3 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5"
      role="toolbar"
      aria-label="Dashboard controls"
    >
      <div
        className={`${FLOW_TOOLBAR_PILL_CLASS} nodrag`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ToolbarIconButton
          label="Preview mode"
          hint="Preview mode — interact with buttons, knobs, and switches."
          active={!editMode}
          onClick={() => onEditModeChange(false)}
        >
          <Play size={14} />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Edit mode"
          hint="Edit mode — select, drag, and resize widgets. Controls are disabled until Preview."
          active={editMode}
          onClick={() => onEditModeChange(true)}
        >
          <Pencil size={14} />
        </ToolbarIconButton>
        {editMode && layoutMode === "grid" && onStackLayout != null ? (
          <>
            <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
            <ToolbarIconButton
              label="Stack widgets"
              hint="Stack visible widgets in column 1 — top to bottom, preserving spans."
              onClick={onStackLayout}
            >
              <AlignVerticalJustifyCenter size={14} />
            </ToolbarIconButton>
          </>
        ) : null}
        {!editMode ? (
          <>
            <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
            <ToolbarIconButton
              label="Dashboard pane"
              hint="Preview on the Dashboard workbench pane."
              active={displayTarget === "pane"}
              onClick={() => onDisplayTargetChange("pane")}
            >
              <Layers size={14} />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Stage HUD"
              hint="Preview as a HUD overlay on the Stage viewport (open Stage pane)."
              active={displayTarget === "stage-hud"}
              onClick={() => onDisplayTargetChange("stage-hud")}
            >
              <MonitorPlay size={14} />
            </ToolbarIconButton>
          </>
        ) : null}
        <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
        <ToolbarIconButton
          label="Export layout"
          hint="Download the committed dashboard layout snapshot as JSON."
          onClick={() => downloadDashboardLayoutJson(snapshot)}
        >
          <Download size={14} />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Import layout"
          hint="Import layout JSON — updates placement and publish flags on matching flow nodes."
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Save layout to library"
          hint="Save the current committed layout to a local library (browser storage)."
          active={showSaveField}
          onClick={() => {
            setShowSaveField((open) => !open);
            if (showSaveField) {
              return;
            }
            setShowLibraryPicker(false);
          }}
        >
          <FolderOpen size={14} />
        </ToolbarIconButton>
        {libraryOptions.length > 0 ? (
          <ToolbarIconButton
            label="Saved layouts"
            hint="Pick a saved layout from the library and apply it."
            active={showLibraryPicker}
            onClick={() => {
              setShowLibraryPicker((open) => !open);
              if (showLibraryPicker) {
                return;
              }
              setShowSaveField(false);
            }}
          >
            <Library size={14} />
          </ToolbarIconButton>
        ) : null}
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
        <div className="pointer-events-auto nodrag flex w-full min-w-[min(96vw,20rem)] max-w-md items-end gap-2 rounded-xl border border-white/10 bg-zinc-950/92 px-2.5 py-2 shadow-lg ring-1 ring-white/5 backdrop-blur-md">
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
          <ToolbarIconButton label="Confirm save" hint="Save layout to library" onClick={onSaveToLibrary}>
            <Check size={14} />
          </ToolbarIconButton>
        </div>
      ) : null}
      {showLibraryPicker && libraryOptions.length > 0 ? (
        <div className="pointer-events-auto nodrag flex w-full min-w-[min(96vw,20rem)] max-w-md items-end gap-2 rounded-xl border border-white/10 bg-zinc-950/92 px-2.5 py-2 shadow-lg ring-1 ring-white/5 backdrop-blur-md">
          <TRNFormField className="min-w-0 flex-1" label="Saved layout">
            <TRNSelect
              size="sm"
              value={selectedLibraryId}
              ariaLabel="Saved dashboard layout"
              sectionTitle="Saved layouts"
              options={libraryOptions}
              onValueChange={(next) => setSelectedLibraryId(next)}
            />
          </TRNFormField>
          <ToolbarIconButton
            label="Apply saved layout"
            hint="Apply the selected saved layout to matching flow nodes."
            onClick={onApplyLibraryEntry}
          >
            <Check size={14} />
          </ToolbarIconButton>
        </div>
      ) : null}
      {feedback != null ? (
        <TRNHintText className="pointer-events-auto nodrag max-w-md rounded-lg border border-white/10 bg-zinc-950/92 px-2.5 py-1.5 text-[11px] text-zinc-400 shadow-md ring-1 ring-white/5 backdrop-blur-md">
          {feedback}
        </TRNHintText>
      ) : null}
    </div>
  );
}
