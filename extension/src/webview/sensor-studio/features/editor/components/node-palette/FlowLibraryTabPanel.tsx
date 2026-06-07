import { Download, FolderInput, Save, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { TRNButton, TRNHintText } from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  parseStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "../../flow-library/studio-flow-preset-file";
import { FlowLoadModeDialog, type FlowLoadMode } from "../flow-library/FlowLoadModeDialog";
import { SaveToLibraryDialog } from "../flow-library/SaveToLibraryDialog";
import {
  resolveSaveToLibraryTarget,
  saveToLibraryTargetLabel,
} from "../../flow-library/resolve-save-to-library-target";
import { STUDIO_ROOT_GRAPH_ID } from "../../subgraphs/studio-subgraph.types";

type FlowLibraryTabPanelProps = {
  dense?: boolean;
  query: string;
  borderColor?: string;
};

function filterPresets(presets: StudioFlowPresetFile[], query: string): StudioFlowPresetFile[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return presets;
  }
  return presets.filter((preset) => {
    const hay = [
      preset.meta.name,
      preset.meta.description ?? "",
      preset.meta.category,
      ...(preset.meta.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function presetSummary(preset: StudioFlowPresetFile): string {
  const nodeCount = preset.document.nodes.length;
  const edgeCount = preset.document.edges.length;
  const kind = preset.meta.presetKind === "flowPartial" ? "Selection" : "Full flow";
  return `${kind} · ${nodeCount} nodes · ${edgeCount} edges`;
}

function FlowPresetRow(props: {
  preset: StudioFlowPresetFile;
  borderColor?: string;
  dense?: boolean;
  onLoad: () => void;
  onExport: () => void;
  onRemove: () => void;
}) {
  const { preset, borderColor, dense, onLoad, onExport, onRemove } = props;
  return (
    <li>
      <div
        className="group flex items-start gap-2 rounded border border-zinc-800/80 bg-zinc-950/40 px-2 py-2 transition-colors hover:border-cyan-500/35 hover:bg-cyan-950/15"
        style={borderColor != null ? { borderColor } : undefined}
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onLoad}
        >
          <div className="truncate font-medium text-zinc-100">{preset.meta.name}</div>
          <div className="mt-0.5 text-[10px] text-zinc-500">{presetSummary(preset)}</div>
          {preset.meta.description ? (
            <div className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{preset.meta.description}</div>
          ) : null}
        </button>
        <div className="flex shrink-0 flex-col gap-1 opacity-80 group-hover:opacity-100">
          <button
            type="button"
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
            aria-label="Export flow preset"
            onClick={onExport}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-950/40 hover:text-red-200"
            aria-label="Remove flow preset"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export function FlowLibraryTabPanel(props: FlowLibraryTabPanelProps) {
  const { dense = false, query, borderColor } = props;
  const library = useFlowEditorStore((s) => s.flowPresetLibrary);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const saveToLibrary = useFlowEditorStore((s) => s.saveToLibrary);
  const loadFlowPresetFromLibrary = useFlowEditorStore((s) => s.loadFlowPresetFromLibrary);
  const importFlowPresetToLibrary = useFlowEditorStore((s) => s.importFlowPresetToLibrary);
  const exportFlowPresetById = useFlowEditorStore((s) => s.exportFlowPresetById);
  const removeFlowPresetFromLibrary = useFlowEditorStore((s) => s.removeFlowPresetFromLibrary);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadPresetId, setLoadPresetId] = useState<string | null>(null);

  const saveTarget = useMemo(() => resolveSaveToLibraryTarget(nodes), [nodes]);
  const filtered = useMemo(() => filterPresets(library, query), [library, query]);
  const loadPreset = loadPresetId != null ? library.find((p) => p.meta.id === loadPresetId) : undefined;

  const scopeHint =
    activeGraphId === STUDIO_ROOT_GRAPH_ID
      ? "Root graph"
      : `Graph ${activeGraphId}`;

  const onImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        const parsed = parseStudioFlowPresetFile(text);
        if (parsed == null) {
          return;
        }
        importFlowPresetToLibrary(parsed);
      };
      reader.readAsText(file);
    },
    [importFlowPresetToLibrary],
  );

  const applyLoad = useCallback(
    (mode: FlowLoadMode) => {
      if (loadPresetId == null) {
        return;
      }
      loadFlowPresetFromLibrary(loadPresetId, mode);
      setLoadPresetId(null);
    },
    [loadFlowPresetFromLibrary, loadPresetId],
  );

  return (
    <div className={dense ? "space-y-2 pt-2" : "space-y-3 pt-3"}>
      <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
        Save the current canvas or selection as a reusable flow. Load replaces or merges the graph.
        Project presets are stored locally on this machine.
      </TRNHintText>

      <div className="flex flex-wrap gap-2">
        <TRNButton
          type="button"
          size="compact"
          prefixIcon={<Save className="h-3.5 w-3.5" aria-hidden />}
          hint={`Saves as ${saveToLibraryTargetLabel(saveTarget).toLowerCase()} (${scopeHint}).`}
          onClick={() => setSaveOpen(true)}
        >
          Save to library
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          prefixIcon={<FolderInput className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => fileInputRef.current?.click()}
        >
          Import preset
        </TRNButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.trn-flow-preset.json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file != null) {
              onImportFile(file);
            }
            e.target.value = "";
          }}
        />
      </div>

      <section className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Project
          {filtered.length > 0 ? (
            <span className="ml-1 font-normal normal-case text-zinc-500">({filtered.length})</span>
          ) : null}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-4 text-center text-[11px] text-zinc-500">
            {library.length === 0
              ? "No saved flows yet. Use Save to library on the current graph."
              : "No flow presets match your search."}
          </div>
        ) : (
          <ul className={`space-y-1.5 ${dense ? "text-[10px]" : "text-[11px]"}`}>
            {filtered.map((preset) => (
              <FlowPresetRow
                key={preset.meta.id}
                preset={preset}
                borderColor={borderColor}
                dense={dense}
                onLoad={() => setLoadPresetId(preset.meta.id)}
                onExport={() => exportFlowPresetById(preset.meta.id)}
                onRemove={() => removeFlowPresetFromLibrary(preset.meta.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <SaveToLibraryDialog
        open={saveOpen}
        target={saveTarget}
        scopeHint={scopeHint}
        onCancel={() => setSaveOpen(false)}
        onConfirm={(args) => {
          saveToLibrary(args);
          setSaveOpen(false);
        }}
      />

      <FlowLoadModeDialog
        open={loadPreset != null}
        presetName={loadPreset?.meta.name ?? "Flow preset"}
        onCancel={() => setLoadPresetId(null)}
        onChoose={applyLoad}
      />
    </div>
  );
}
