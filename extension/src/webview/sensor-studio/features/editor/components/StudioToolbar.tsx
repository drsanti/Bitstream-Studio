import { FolderOpen } from "lucide-react";
import { useBitstreamTransportActions } from "../../../../bitstream-app/context/bitstreamTransportActions.context";
import { BitstreamSensorSampleRxBadge } from "../../../../bitstream-shell/ui/BitstreamTelemetryRxBadges";
import { useOpenAssetManager } from "../../../../assets-manager/hooks/useOpenAssetManager.js";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import type { StudioDemoTemplateId } from "../store/flow-editor.store";

type StudioToolbarProps = {
  borderColor: string;
  onResetWorkspaceLayout?: () => void;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
  onOpenDeviceSensorSettings?: () => void;
  templateId: StudioDemoTemplateId;
  onTemplateIdChange: (templateId: StudioDemoTemplateId) => void;
  onRunTemplate: () => void;
  onClearCanvas: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onFitView?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
};

export function StudioToolbar(props: StudioToolbarProps) {
  const {
    borderColor,
    entries,
    onAddNode,
    onOpenDeviceSensorSettings,
    templateId,
    onTemplateIdChange,
    onRunTemplate,
    onClearCanvas,
    onDuplicateSelection,
    onDeleteSelection,
    onFitView,
    onSelectAllNodes,
    onClearCanvasSelection,
    onExportFlow,
    onImportFlowPick,
    onResetWorkspaceLayout,
  } = props;
  const { openAssetManager } = useOpenAssetManager();
  const { reconnectTelemetry } = useBitstreamTransportActions();
  const sensorEntry = entries.find((entry) => entry.id === "bmi270-input");
  const thresholdEntry = entries.find((entry) => entry.id === "threshold");
  return (
    <header
      className="relative flex flex-wrap items-center gap-3 border-b px-3 py-2"
      style={{ borderColor }}
    >
      <div className="shrink-0 text-sm font-semibold">Sensor Studio</div>
      <div className="ml-auto flex min-w-0 shrink items-center">
        <BitstreamSensorSampleRxBadge
          variant="chip"
          chipMetric="aggregateFps"
          onReconnectTelemetry={reconnectTelemetry}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          title="Open Asset Manager (floating window)"
          className="inline-flex items-center gap-1 rounded border border-cyan-900/50 bg-cyan-950/20 px-2 py-1 text-[11px] text-cyan-100/90 hover:bg-cyan-950/35"
          onClick={() => {
            openAssetManager({ globalDirectoriesTab: "overview" });
          }}
        >
          <FolderOpen className="size-3 shrink-0 opacity-90" aria-hidden />
          Asset Manager
        </button>
        <button
          type="button"
          className="rounded border border-amber-700/50 bg-amber-950/25 px-2 py-1 text-[11px] text-amber-100/90 hover:bg-amber-900/20"
          onClick={() => {
            onOpenDeviceSensorSettings?.();
          }}
        >
          Device sensors…
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            if (sensorEntry != null) {
              onAddNode(sensorEntry);
            }
          }}
        >
          Add BMI270
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            if (thresholdEntry != null) {
              onAddNode(thresholdEntry);
            }
          }}
        >
          Add Threshold
        </button>
        <button
          type="button"
          title="Duplicate selection (Ctrl+D)"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            onDuplicateSelection?.();
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          title="Delete selected nodes"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            onDeleteSelection?.();
          }}
        >
          Delete
        </button>
        <button
          type="button"
          title="Fit view (Ctrl+Shift+F)"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            onFitView?.();
          }}
        >
          Fit view
        </button>
        <button
          type="button"
          title="Select all nodes"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            onSelectAllNodes?.();
          }}
        >
          Select all
        </button>
        <button
          type="button"
          title="Clear selection (Esc)"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={() => {
            onClearCanvasSelection?.();
          }}
        >
          Clear sel.
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={onClearCanvas}
        >
          Clear graph
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={onExportFlow}
        >
          Export JSON
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] hover:bg-zinc-800/80"
          onClick={onImportFlowPick}
        >
          Import JSON
        </button>
        {onResetWorkspaceLayout != null ? (
          <button
            type="button"
            title="Reset workbench panes to default (clears saved split layout)"
            className="rounded border border-sky-800/60 bg-sky-950/30 px-2 py-1 text-[11px] text-sky-100/90 hover:bg-sky-900/25"
            onClick={() => {
              onResetWorkspaceLayout();
            }}
          >
            Reset workspace
          </button>
        ) : null}
      </div>
    </header>
  );
}
