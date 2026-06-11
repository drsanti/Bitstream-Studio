import { Activity, Crosshair, ListTree, Pencil, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { TRNButton, TRNFormField, TRNHintText, TRNInput, TRNSelect } from "../../../../../ui/TRN";
import {
  dashboardEnabledTabSelectOptions,
  flattenDashboardInspectorWidgets,
  summarizeDashboardInspectorInventory,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type { DashboardSnapshotItemV1, DashboardSnapshotV1 } from "../../../../core/dashboard/dashboard-snapshot";
import { writeDashboardEditModeEnabled } from "../../../dashboard/dashboard-viewport-ui-persistence";
import { useDashboardSceneStore } from "../../../../state/dashboard-scene.store";
import { useStudioWorkbenchShell } from "../../workbench/studio-workbench-context";
import { openDashboard } from "../../../dashboard/dashboard-navigation";
import { DashboardInspectorControlsTab } from "./DashboardInspectorControlsTab";
import { DashboardInspectorLayoutWarningsSection } from "./DashboardInspectorLayoutWarningsSection";
import { DashboardInspectorWidgetListRow } from "./DashboardInspectorWidgetListRow";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

type DashboardInspectorWidgetsTabProps = {
  snapshot: DashboardSnapshotV1;
  displayItems: readonly DashboardSnapshotItemV1[];
  activeTabLabel: string | null;
  activeTabSourceNodeId: string | null;
  pageLayoutWarnings: readonly string[];
  dashboardOutputLabel: string | null;
  editModeEnabled: boolean;
  highlightedWidgetSourceNodeIds: readonly string[];
  onFocusOutputInGraph: () => void;
  onEditModeChange: (next: boolean) => void;
  onActiveDashboardTabChange: (sourceNodeId: string) => void;
  onSelectWidget: (sourceNodeId: string) => void;
  onFocusWidgetInGraph: (sourceNodeId: string) => void;
  onInspectWidgetInGraph: (sourceNodeId: string) => void;
  onButtonClick: (sourceNodeId: string) => void;
  onKnobValueChange: (sourceNodeId: string, value: number) => void;
  onSwitchValueChange: (sourceNodeId: string, value: boolean) => void;
  onSelectValueChange: (sourceNodeId: string, value: string) => void;
  onSliderValueChange: (sourceNodeId: string, value: number) => void;
};

export function DashboardInspectorWidgetsTab(props: DashboardInspectorWidgetsTabProps) {
  const {
    snapshot,
    displayItems,
    activeTabLabel,
    activeTabSourceNodeId,
    pageLayoutWarnings,
    dashboardOutputLabel,
    editModeEnabled,
    highlightedWidgetSourceNodeIds,
    onFocusOutputInGraph,
    onEditModeChange,
    onActiveDashboardTabChange,
    onSelectWidget,
    onFocusWidgetInGraph,
    onInspectWidgetInGraph,
    onButtonClick,
    onKnobValueChange,
    onSwitchValueChange,
    onSelectValueChange,
    onSliderValueChange,
  } = props;

  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();
  const [filter, setFilter] = useState("");
  const setEditModeEnabled = useDashboardSceneStore((s) => s.setEditModeEnabled);

  const tabOptions = dashboardEnabledTabSelectOptions(snapshot.tabs);
  const inventory = useMemo(
    () => summarizeDashboardInspectorInventory(displayItems),
    [displayItems],
  );
  const widgetTotal = inventory.controlCount + inventory.displayCount;

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

  const commitEditMode = (next: boolean) => {
    writeDashboardEditModeEnabled(next);
    setEditModeEnabled(next);
    onEditModeChange(next);
  };

  return (
    <div className="space-y-2">
      <InspectorSettingsSectionFrame title="Operator" collapsible defaultExpanded>
        <div className="flex gap-1 rounded-md border border-zinc-700/70 bg-zinc-900/50 p-0.5">
          <TRNButton
            type="button"
            size="compact"
            selected={!editModeEnabled}
            className="flex-1"
            hint="Preview — interact with dashboard controls"
            onClick={() => commitEditMode(false)}
          >
            <Play className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Preview
          </TRNButton>
          <TRNButton
            type="button"
            size="compact"
            selected={editModeEnabled}
            className="flex-1"
            hint="Edit — move and resize widgets on the grid"
            onClick={() => commitEditMode(true)}
          >
            <Pencil className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
            Edit
          </TRNButton>
        </div>

        {snapshot.tabs.length > 0 ? (
          <div className="mt-2 space-y-1">
            <TRNSelect
              size="sm"
              className="w-full"
              value={activeTabSourceNodeId ?? tabOptions[0]?.value ?? ""}
              ariaLabel="Active dashboard tab"
              sectionTitle="Dashboard pages"
              options={tabOptions}
              onValueChange={onActiveDashboardTabChange}
            />
          </div>
        ) : null}

        {snapshot.dashboardOutputNodeId != null ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[10px] text-zinc-500">
              <span className="font-medium text-zinc-300">
                {dashboardOutputLabel ?? "Dashboard Output"}
              </span>
              {activeTabLabel != null ? ` · ${activeTabLabel}` : ""} · {widgetTotal} widget
              {widgetTotal === 1 ? "" : "s"}
            </p>
            <TRNButton
              type="button"
              size="compact"
              className="shrink-0"
              hint="Select Dashboard Output in the flow graph"
              onClick={onFocusOutputInGraph}
            >
              <Crosshair size={14} className="opacity-90" aria-hidden />
            </TRNButton>
          </div>
        ) : (
          <TRNHintText className="mt-2 text-zinc-500">
            Wire a <span className="font-medium text-zinc-400">Dashboard Output</span> node to
            commit widgets.
          </TRNHintText>
        )}
      </InspectorSettingsSectionFrame>

      <DashboardInspectorLayoutWarningsSection warnings={pageLayoutWarnings} />

      <InspectorSettingsSectionFrame
        title="Widget list"
        hint="Navigate widgets on the active dashboard page"
        titleLeadingSlot={<ListTree className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />}
        collapsible
        defaultExpanded
      >
        {rows.length > 5 ? (
          <TRNFormField label="Search" hint="Filter by label, kind, or group name">
            <TRNInput
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter widgets…"
            />
          </TRNFormField>
        ) : null}

        <p className="text-[10px] text-zinc-500">
          {filteredRows.length === rows.length
            ? `${rows.length} widget${rows.length === 1 ? "" : "s"} on this page`
            : `${filteredRows.length} of ${rows.length} widgets`}
        </p>

        {filteredRows.length === 0 ? (
          <TRNHintText>
            {rows.length === 0
              ? "No widgets on this page yet — add nodes and enable Show on Dashboard."
              : "No widgets match this filter."}
          </TRNHintText>
        ) : (
          <ul className="scrollbar-hide max-h-[min(42vh,380px)] divide-y divide-zinc-800/60 overflow-y-auto overflow-x-hidden rounded-md border border-zinc-800/70 bg-zinc-950/35">
            {filteredRows.map((row) => {
              const { widget, group } = row;
              const selected = highlightedWidgetSourceNodeIds.includes(widget.sourceNodeId);
              return (
                <DashboardInspectorWidgetListRow
                  key={widget.sourceNodeId}
                  widget={widget}
                  group={group}
                  selected={selected}
                  onSelect={() => {
                    onSelectWidget(widget.sourceNodeId);
                    if (onFocusWorkbenchPane != null) {
                      openDashboard(onFocusWorkbenchPane, {
                        sourceNodeId: widget.sourceNodeId,
                      });
                    }
                  }}
                  onFocusInGraph={() => onFocusWidgetInGraph(widget.sourceNodeId)}
                  onInspectInGraph={() => onInspectWidgetInGraph(widget.sourceNodeId)}
                />
              );
            })}
          </ul>
        )}
      </InspectorSettingsSectionFrame>

      <InspectorSettingsSectionFrame
        title="Live controls"
        hint="Operate widgets from the inspector — expand rows for full previews"
        titleLeadingSlot={<Activity className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />}
        collapsible
        defaultExpanded={!editModeEnabled}
      >
        <DashboardInspectorControlsTab
          displayItems={displayItems}
          editModeEnabled={editModeEnabled}
          onButtonClick={onButtonClick}
          onKnobValueChange={onKnobValueChange}
          onSwitchValueChange={onSwitchValueChange}
          onSelectValueChange={onSelectValueChange}
          onSliderValueChange={onSliderValueChange}
        />
      </InspectorSettingsSectionFrame>
    </div>
  );
}
