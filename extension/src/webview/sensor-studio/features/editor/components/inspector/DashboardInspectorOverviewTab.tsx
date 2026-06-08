import { Crosshair, Pencil, Play } from "lucide-react";
import { TRNButton, TRNHintText, TRNSelect } from "../../../../../ui/TRN";
import {
  dashboardEnabledTabSelectOptions,
  summarizeDashboardInspectorInventory,
  type DashboardInspectorInventoryV1,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type { DashboardLayoutModeV1 } from "../../../../core/dashboard/dashboard-layout";
import type { DashboardSnapshotItemV1, DashboardSnapshotV1 } from "../../../../core/dashboard/dashboard-snapshot";
import { writeDashboardEditModeEnabled } from "../../../dashboard/dashboard-viewport-ui-persistence";
import { useDashboardSceneStore } from "../../../../state/dashboard-scene.store";
import { DashboardInspectorLayoutWarningsSection } from "./DashboardInspectorLayoutWarningsSection";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

type DashboardInspectorOverviewTabProps = {
  snapshot: DashboardSnapshotV1;
  displayItems: readonly DashboardSnapshotItemV1[];
  inventory: DashboardInspectorInventoryV1;
  layoutMode: DashboardLayoutModeV1;
  activeTabLabel: string | null;
  activeTabSourceNodeId: string | null;
  pageLayoutWarnings: readonly string[];
  dashboardOutputLabel: string | null;
  editModeEnabled: boolean;
  onFocusOutputInGraph: () => void;
  onEditModeChange: (next: boolean) => void;
  onActiveDashboardTabChange: (sourceNodeId: string) => void;
};

export function DashboardInspectorOverviewTab(props: DashboardInspectorOverviewTabProps) {
  const {
    snapshot,
    displayItems,
    inventory,
    layoutMode,
    activeTabLabel,
    activeTabSourceNodeId,
    pageLayoutWarnings,
    dashboardOutputLabel,
    editModeEnabled,
    onFocusOutputInGraph,
    onEditModeChange,
    onActiveDashboardTabChange,
  } = props;

  const tabOptions = dashboardEnabledTabSelectOptions(snapshot.tabs);

  const widgetTotal =
    inventory.controlCount + inventory.displayCount;
  const { grid } = snapshot.layout;

  const setEditModeEnabled = useDashboardSceneStore((s) => s.setEditModeEnabled);

  const commitEditMode = (next: boolean) => {
    writeDashboardEditModeEnabled(next);
    setEditModeEnabled(next);
    onEditModeChange(next);
  };

  return (
    <div className="space-y-2">
      <InspectorSettingsSectionFrame title="Commit source" collapsible defaultExpanded>
        {snapshot.dashboardOutputNodeId == null ? (
          <TRNHintText className="text-zinc-500">
            Wire a <span className="font-medium text-zinc-400">Dashboard Output</span> node to
            commit widgets to this pane.
          </TRNHintText>
        ) : (
          <>
            <p className="text-[11px] font-medium text-zinc-200">
              {dashboardOutputLabel ?? "Dashboard Output"}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">{snapshot.dashboardOutputNodeId}</p>
            <TRNButton
              type="button"
              size="compact"
              className="mt-2 h-8 w-full border border-cyan-700/50 bg-cyan-950/35 text-[11px] text-cyan-100 hover:bg-cyan-900/45"
              hint="Select the Dashboard Output flow node and zoom the graph"
              onClick={onFocusOutputInGraph}
            >
              <Crosshair size={14} className="mr-1.5 inline opacity-90" aria-hidden />
              Focus in graph
            </TRNButton>
          </>
        )}
      </InspectorSettingsSectionFrame>

      <DashboardInspectorLayoutWarningsSection warnings={pageLayoutWarnings} />

      <InspectorSettingsSectionFrame title="Current page" collapsible defaultExpanded>
        {snapshot.tabs.length > 0 ? (
          <div className="space-y-2">
            <TRNSelect
              size="sm"
              className="w-full"
              value={activeTabSourceNodeId ?? tabOptions[0]?.value ?? ""}
              ariaLabel="Active dashboard tab"
              sectionTitle="Dashboard pages"
              options={tabOptions}
              onValueChange={onActiveDashboardTabChange}
            />
            <p className="text-[10px] text-zinc-500">
              {tabOptions.length} enabled tab{tabOptions.length === 1 ? "" : "s"} · switches the
              Dashboard pane and inspector lists together.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400">Single-page layout (no Dashboard Tab nodes)</p>
        )}
        <p className="mt-2 text-[10px] text-zinc-500">
          {activeTabLabel != null ? (
            <>
              Page <span className="font-medium text-zinc-300">{activeTabLabel}</span> ·{" "}
            </>
          ) : null}
          {widgetTotal} widget{widgetTotal === 1 ? "" : "s"} · {displayItems.length} top-level
          slot{displayItems.length === 1 ? "" : "s"}
        </p>
      </InspectorSettingsSectionFrame>

      <InspectorSettingsSectionFrame title="Inventory" collapsible defaultExpanded>
        <ul className="space-y-1 text-[11px] text-zinc-300">
          <li>
            <span className="font-medium text-zinc-100">{inventory.controlCount}</span> controls
            <span className="text-zinc-500"> — buttons, switches, sliders, knobs</span>
          </li>
          <li>
            <span className="font-medium text-zinc-100">{inventory.displayCount}</span> displays
            <span className="text-zinc-500"> — LED, text, gauges, status, trends</span>
          </li>
          <li>
            <span className="font-medium text-zinc-100">{inventory.groupCount}</span> group
            {inventory.groupCount === 1 ? "" : "s"}
          </li>
          {inventory.publishedCount > 0 ? (
            <li>
              <span className="font-medium text-zinc-100">{inventory.publishedCount}</span> published
              from flow outputs
            </li>
          ) : null}
        </ul>
      </InspectorSettingsSectionFrame>

      <InspectorSettingsSectionFrame title="Mode" collapsible defaultExpanded>
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
        <p className="mt-2 text-[10px] leading-snug text-zinc-500">
          Layout: {layoutMode === "grid" ? `grid · ${grid.columns} columns` : "flex"} · row{" "}
          {grid.rowHeightPx}px
        </p>
      </InspectorSettingsSectionFrame>
    </div>
  );
}
