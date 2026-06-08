import { Crosshair, LayoutGrid, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TRNButton, TRNFormField } from "../../../../../ui/TRN";
import {
  dashboardWidgetKindLabel,
  flattenDashboardInspectorWidgets,
  formatDashboardPlacementSummary,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type { DashboardSnapshotItemV1 } from "../../../../core/dashboard/dashboard-snapshot";
import { useStudioWorkbenchShell } from "../../workbench/studio-workbench-context";
import { openDashboard } from "../../../dashboard/dashboard-navigation";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

type DashboardInspectorWidgetsTabProps = {
  displayItems: readonly DashboardSnapshotItemV1[];
  highlightedWidgetSourceNodeId: string | null;
  onSelectWidget: (sourceNodeId: string) => void;
  onFocusWidgetInGraph: (sourceNodeId: string) => void;
  onInspectWidgetInGraph: (sourceNodeId: string) => void;
};

export function DashboardInspectorWidgetsTab(props: DashboardInspectorWidgetsTabProps) {
  const {
    displayItems,
    highlightedWidgetSourceNodeId,
    onSelectWidget,
    onFocusWidgetInGraph,
    onInspectWidgetInGraph,
  } = props;
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => flattenDashboardInspectorWidgets(displayItems), [displayItems]);
  const needle = filter.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (needle.length === 0) {
      return rows;
    }
    return rows.filter((row) => {
      const hay = [
        row.widget.label,
        row.widget.catalogNodeId,
        row.widget.widgetKind,
        row.group?.label ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [needle, rows]);

  return (
    <div className="space-y-2">
      <TRNFormField label="Search" hint="Filter by label, kind, or group name">
        <input
          className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter widgets…"
        />
      </TRNFormField>

      {filteredRows.length === 0 ? (
        <p className="text-[11px] text-zinc-500">No widgets match this filter.</p>
      ) : (
        filteredRows.map((row) => {
          const { widget, group } = row;
          const selected = highlightedWidgetSourceNodeId === widget.sourceNodeId;
          return (
            <InspectorSettingsSectionFrame
              key={widget.sourceNodeId}
              title={widget.label}
              collapsible
              defaultExpanded={selected}
              className={selected ? "border-cyan-700/40" : undefined}
            >
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {dashboardWidgetKindLabel(widget.widgetKind)}
                  {group != null ? ` · in ${group.label}` : ""}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {formatDashboardPlacementSummary(widget)}
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {onFocusWorkbenchPane != null ? (
                    <TRNButton
                      type="button"
                      size="compact"
                      selected={selected}
                      hint="Highlight on the Dashboard grid"
                      onClick={() => {
                        onSelectWidget(widget.sourceNodeId);
                        openDashboard(onFocusWorkbenchPane, { sourceNodeId: widget.sourceNodeId });
                      }}
                    >
                      <LayoutGrid className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
                      Select
                    </TRNButton>
                  ) : (
                    <TRNButton
                      type="button"
                      size="compact"
                      selected={selected}
                      hint="Highlight on the Dashboard grid"
                      onClick={() => onSelectWidget(widget.sourceNodeId)}
                    >
                      <LayoutGrid className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
                      Select
                    </TRNButton>
                  )}
                  <TRNButton
                    type="button"
                    size="compact"
                    hint="Select flow node and zoom the graph"
                    onClick={() => onFocusWidgetInGraph(widget.sourceNodeId)}
                  >
                    <Crosshair className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
                    Graph
                  </TRNButton>
                  <TRNButton
                    type="button"
                    size="compact"
                    hint="Open this widget's flow node settings in the inspector"
                    onClick={() => onInspectWidgetInGraph(widget.sourceNodeId)}
                  >
                    <Settings2 className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
                    Settings
                  </TRNButton>
                </div>
              </div>
            </InspectorSettingsSectionFrame>
          );
        })
      )}

      {displayItems.map((item) =>
        item.kind === "group" ? (
          <div
            key={`group-meta-${item.group.sourceNodeId}`}
            className="rounded-md border border-zinc-800/80 bg-zinc-950/30 px-2 py-1.5 text-[10px] text-zinc-500"
          >
            Group shell{" "}
            <span className="font-medium text-zinc-300">{item.group.label}</span> · col{" "}
            {item.group.placement.column}, row {item.group.placement.row} ·{" "}
            {item.group.placement.columnSpan}×{item.group.placement.rowSpan} ·{" "}
            {item.group.children.length} child{item.group.children.length === 1 ? "" : "ren"}
          </div>
        ) : null,
      )}
    </div>
  );
}
