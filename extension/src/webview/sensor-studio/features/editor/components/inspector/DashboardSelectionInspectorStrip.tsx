import { Crosshair, LayoutGrid, X } from "lucide-react";
import { TRNButton, TRNIconButton } from "../../../../../ui/TRN";
import {
  dashboardWidgetKindLabel,
  formatDashboardPlacementSummary,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type {
  DashboardGroupEntryV1,
  DashboardWidgetEntryV1,
} from "../../../../core/dashboard/dashboard-snapshot";
import { useStudioWorkbenchShell } from "../../workbench/studio-workbench-context";
import { openDashboard } from "../../../dashboard/dashboard-navigation";

export type DashboardSelectionInspectorStripProps = {
  widget: DashboardWidgetEntryV1 | null;
  group: DashboardGroupEntryV1 | null;
  groupLabel: string | null;
  nodeLabel: string | null;
  onFocusInGraph: () => void;
  onClearSelection: () => void;
};

export function DashboardSelectionInspectorStrip(props: DashboardSelectionInspectorStripProps) {
  const { widget, group, groupLabel, nodeLabel, onFocusInGraph, onClearSelection } = props;
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();

  const targetId = widget?.sourceNodeId ?? group?.sourceNodeId ?? null;
  if (targetId == null) {
    return null;
  }

  const title =
    nodeLabel != null && nodeLabel.trim().length > 0
      ? nodeLabel.trim()
      : (widget?.label ?? group?.label ?? targetId);

  return (
    <div className="mb-2 shrink-0 rounded-lg border border-cyan-800/45 bg-cyan-950/20 px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300/90">
            Dashboard selection · {group != null ? "Group" : "Widget"}
          </p>
          <p className="truncate text-[11px] font-medium text-zinc-100">{title}</p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
            {group != null
              ? `Group · ${group.children.length} widgets · col ${group.placement.column}, row ${group.placement.row}`
              : `${dashboardWidgetKindLabel(widget!.widgetKind)} · ${widget!.catalogNodeId} · ${formatDashboardPlacementSummary(widget!)}${groupLabel != null ? ` · in ${groupLabel}` : ""}`}
          </p>
        </div>
        <TRNIconButton
          icon={<X size={14} className="text-zinc-400" />}
          label="Clear selection"
          hint="Clear Dashboard widget selection"
          onClick={onClearSelection}
          className="!h-7 !w-7 shrink-0"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {onFocusWorkbenchPane != null ? (
          <TRNButton
            type="button"
            size="compact"
            className="h-8 border border-cyan-700/50 bg-cyan-950/35 text-[11px] text-cyan-100 hover:bg-cyan-900/45"
            hint="Focus the Dashboard pane and highlight this widget"
            onClick={() => {
              openDashboard(onFocusWorkbenchPane, { sourceNodeId: targetId });
            }}
          >
            <LayoutGrid size={14} className="mr-1.5 inline opacity-90" aria-hidden />
            On Dashboard
          </TRNButton>
        ) : null}
        <TRNButton
          type="button"
          size="compact"
          className="h-8 flex-1 border border-cyan-700/50 bg-cyan-950/35 text-[11px] text-cyan-100 hover:bg-cyan-900/45"
          hint="Select the bound flow node and zoom the graph to it"
          onClick={onFocusInGraph}
        >
          <Crosshair size={14} className="mr-1.5 inline opacity-90" aria-hidden />
          Focus in graph
        </TRNButton>
      </div>
    </div>
  );
}
