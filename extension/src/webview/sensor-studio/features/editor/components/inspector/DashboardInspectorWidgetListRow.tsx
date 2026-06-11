import { Crosshair, LayoutGrid, Settings2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNIconButton } from "../../../../../ui/TRN";
import {
  dashboardWidgetKindLabel,
  formatDashboardPlacementSummary,
  formatDashboardWidgetLivePreview,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import { dashboardWidgetKindIcon } from "../../../../core/dashboard/dashboard-widget-kind-icons";
import type {
  DashboardGroupEntryV1,
  DashboardWidgetEntryV1,
} from "../../../../core/dashboard/dashboard-snapshot";

export type DashboardInspectorWidgetListRowProps = {
  widget: DashboardWidgetEntryV1;
  group: DashboardGroupEntryV1 | null;
  selected: boolean;
  onSelect: () => void;
  onFocusInGraph: () => void;
  onInspectInGraph: () => void;
};

export function DashboardInspectorWidgetListRow(props: DashboardInspectorWidgetListRowProps) {
  const { widget, group, selected, onSelect, onFocusInGraph, onInspectInGraph } = props;
  const KindIcon = dashboardWidgetKindIcon(widget.widgetKind);
  const livePreview = formatDashboardWidgetLivePreview(widget.liveValue);
  const kindLabel = dashboardWidgetKindLabel(widget.widgetKind);

  return (
    <li
      className={twMerge(
        "flex min-w-0 items-start gap-2 px-1 py-2",
        selected ? "bg-cyan-950/25 ring-1 ring-inset ring-cyan-700/35" : "hover:bg-zinc-900/40",
      )}
    >
      <div
        className={twMerge(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
          selected
            ? "border-cyan-700/40 bg-cyan-950/40 text-cyan-200/90"
            : "border-zinc-800/80 bg-zinc-950/50 text-zinc-400",
        )}
        aria-hidden
      >
        <KindIcon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <p className="truncate text-[11px] font-medium text-zinc-100">{widget.label}</p>
          {livePreview != null ? (
            <span
              className={twMerge(
                "shrink-0 text-[13px]",
                typeof widget.liveValue === "boolean"
                  ? widget.liveValue
                    ? "text-emerald-300/95"
                    : "text-zinc-500"
                  : "text-emerald-50/95",
              )}
            >
              {livePreview}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-zinc-600">—</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[10px] text-zinc-500">
          {kindLabel}
          {group != null ? ` · ${group.label}` : ""}
          {" · "}
          {formatDashboardPlacementSummary(widget)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <TRNIconButton
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
          label="Select on Dashboard"
          variant={selected ? "default" : "ghost"}
          hint="Highlight on the Dashboard grid"
          nativeTitle={false}
          className={selected ? "!border-cyan-700/50 !bg-cyan-950/40" : undefined}
          onClick={onSelect}
        />
        <TRNIconButton
          icon={<Crosshair className="h-3.5 w-3.5" />}
          label="Focus in graph"
          variant="ghost"
          hint="Select flow node and zoom the graph"
          nativeTitle={false}
          onClick={onFocusInGraph}
        />
        <TRNIconButton
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Widget settings"
          variant="ghost"
          hint="Open this widget's flow node settings"
          nativeTitle={false}
          onClick={onInspectInGraph}
        />
      </div>
    </li>
  );
}
