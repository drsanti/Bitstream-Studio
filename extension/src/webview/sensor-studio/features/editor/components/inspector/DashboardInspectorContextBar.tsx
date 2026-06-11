import { ListTree, SlidersHorizontal } from "lucide-react";
import { TRNInspectorContextBar } from "../../../../../ui/TRN";
import { summarizeDashboardInspectorInventory } from "../../../../core/dashboard/dashboard-inspector-helpers";
import type { DashboardSnapshotItemV1, DashboardSnapshotV1 } from "../../../../core/dashboard/dashboard-snapshot";
import type { DashboardInspectorTab } from "./dashboard-inspector-ui-persistence";

export type DashboardInspectorContextBarProps = {
  activeTab: DashboardInspectorTab;
  snapshot: DashboardSnapshotV1;
  displayItems: readonly DashboardSnapshotItemV1[];
  editModeEnabled: boolean;
  activePageLabel: string | null;
  dashboardOutputLabel: string | null;
  pageLayoutWarningCount: number;
};

export function DashboardInspectorContextBar(props: DashboardInspectorContextBarProps) {
  const {
    activeTab,
    snapshot,
    displayItems,
    editModeEnabled,
    activePageLabel,
    dashboardOutputLabel,
    pageLayoutWarningCount,
  } = props;

  const inventory = summarizeDashboardInspectorInventory(displayItems);
  const widgetTotal = inventory.controlCount + inventory.displayCount;
  const layout = snapshot.layout;

  if (activeTab === "layout") {
    const layoutSubtitle =
      layout.mode === "grid"
        ? `Grid · ${layout.grid.columns} cols · ${layout.grid.rowHeightPx}px cells${
            pageLayoutWarningCount > 0 ? ` · ${pageLayoutWarningCount} warning${pageLayoutWarningCount === 1 ? "" : "s"}` : ""
          }`
        : `Flex · ${layout.flex.direction} · ${layout.flex.gapPx}px gap${
            pageLayoutWarningCount > 0 ? ` · ${pageLayoutWarningCount} warning${pageLayoutWarningCount === 1 ? "" : "s"}` : ""
          }`;

    return (
      <TRNInspectorContextBar
        title="Layout"
        subtitle={layoutSubtitle}
        icon={SlidersHorizontal}
        iconShellClass="border-violet-500/30 bg-violet-950/25 text-violet-300/95"
      />
    );
  }

  const modeLabel = editModeEnabled ? "Edit" : "Preview";
  const outputPart =
    snapshot.dashboardOutputNodeId == null
      ? "No Dashboard Output wired"
      : (dashboardOutputLabel ?? "Dashboard Output");
  const pagePart = activePageLabel != null ? ` · ${activePageLabel}` : "";
  const widgetPart = ` · ${widgetTotal} widget${widgetTotal === 1 ? "" : "s"}`;

  return (
    <TRNInspectorContextBar
      title="Widgets"
      subtitle={`${modeLabel} · ${outputPart}${pagePart}${widgetPart}`}
      icon={ListTree}
      iconShellClass="border-cyan-500/30 bg-cyan-950/25 text-cyan-300/95"
      trailing={
        pageLayoutWarningCount > 0 ? (
          <span className="shrink-0 rounded-full border border-amber-500/35 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-200/90">
            {pageLayoutWarningCount} warn
          </span>
        ) : null
      }
    />
  );
}
