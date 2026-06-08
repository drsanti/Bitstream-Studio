import { memo, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNToggleSwitch } from "../../../ui/TRN";
import type { DashboardLayoutModeV1 } from "../../core/dashboard/dashboard-layout";
import { dashboardFlexPlacementStyle } from "../../core/dashboard/dashboard-flex-placement";
import {
  dashboardPlacementGridStyle,
  type DashboardPlacementV1,
} from "../../core/dashboard/dashboard-placement";
import type { DashboardWidgetEntryV1 } from "../../core/dashboard/dashboard-snapshot";
import {
  dashboardGridEditChromeClass,
  dashboardPreviewRadiusClass,
  dashboardWidgetPanelClass,
} from "./dashboard-grid-edit-chrome";
import { DashboardStatusNodePanel } from "./DashboardStatusNodePanel";
import { LedIndicatorNodePanel } from "../editor/nodes/led-indicator/LedIndicatorNodePanel";
import { KnobNodePanel } from "../editor/nodes/knob/KnobNodePanel";
import { NumericDisplayNodePanel } from "../editor/nodes/numeric-display/NumericDisplayNodePanel";
import { DashboardPlotterWidgetBody } from "./DashboardPlotterWidgetBody";
import { DashboardSliderNodePanel } from "./DashboardSliderNodePanel";
import { SparklineNodePanel } from "../editor/nodes/sparkline/SparklineNodePanel";
import { BarMeterNodePanel } from "../editor/nodes/bar-meter/BarMeterNodePanel";
import { RadialGaugeNodePanel } from "../editor/nodes/radial-gauge/RadialGaugeNodePanel";
import { useDashboardWidgetLive } from "./use-dashboard-widget-live";

type DashboardWidgetCellProps = {
  widget: DashboardWidgetEntryV1;
  layoutMode: DashboardLayoutModeV1;
  editMode: boolean;
  highlighted: boolean;
  onButtonClick?: (sourceNodeId: string) => void;
  onKnobValueChange?: (sourceNodeId: string, value: number) => void;
  onSwitchValueChange?: (sourceNodeId: string, value: boolean) => void;
  onSliderValueChange?: (sourceNodeId: string, value: number) => void;
  onSelectWidget?: (sourceNodeId: string) => void;
  placementOverride?: Partial<DashboardPlacementV1>;
  onGridDragPointerDown?: (
    event: PointerEvent<HTMLDivElement>,
    placement: DashboardPlacementV1,
  ) => void;
  isGridDragging?: boolean;
  /** Widgets inside a dashboard-group use a tighter corner radius in Preview. */
  nestedInGroup?: boolean;
};

function effectivePlacement(
  widget: DashboardWidgetEntryV1,
  placementOverride?: Partial<DashboardPlacementV1>,
): DashboardPlacementV1 {
  return placementOverride == null
    ? widget.placement
    : { ...widget.placement, ...placementOverride };
}

function widgetLayoutStyle(
  widget: DashboardWidgetEntryV1,
  layoutMode: DashboardLayoutModeV1,
  placementOverride?: Partial<DashboardPlacementV1>,
): CSSProperties {
  if (layoutMode === "flex") {
    return dashboardFlexPlacementStyle(widget.flexPlacement);
  }
  return dashboardPlacementGridStyle(effectivePlacement(widget, placementOverride));
}

export const DashboardWidgetCell = memo(function DashboardWidgetCell(
  props: DashboardWidgetCellProps,
) {
  const {
    widget,
    layoutMode,
    editMode,
    highlighted,
    onButtonClick,
    onKnobValueChange,
    onSwitchValueChange,
    onSliderValueChange,
    onSelectWidget,
    placementOverride,
    onGridDragPointerDown,
    isGridDragging = false,
    nestedInGroup = false,
  } = props;
  const live = useDashboardWidgetLive(widget);
  const placement = effectivePlacement(widget, placementOverride);
  const layoutStyle = widgetLayoutStyle(widget, layoutMode, placementOverride);
  const chrome = dashboardGridEditChromeClass(editMode, highlighted, {
    dragging: isGridDragging,
    gridLayout: editMode && layoutMode === "grid" && onGridDragPointerDown != null,
    nestedInGroup,
  });
  const panelClass = dashboardWidgetPanelClass(editMode, { nestedInGroup });
  const previewRadius = dashboardPreviewRadiusClass(editMode, { nestedInGroup });
  const gridDragEnabled =
    editMode && layoutMode === "grid" && onGridDragPointerDown != null;

  const wrapEdit = (child: ReactNode) => (
    <div
      className={`flex items-stretch justify-stretch ${chrome}`}
      style={layoutStyle}
      data-dashboard-widget-id={widget.sourceNodeId}
      onPointerDown={
        gridDragEnabled
          ? (event) => {
              event.stopPropagation();
              onGridDragPointerDown(event, placement);
            }
          : editMode
            ? (event) => {
                event.stopPropagation();
                onSelectWidget?.(widget.sourceNodeId);
              }
            : undefined
      }
    >
      <div
        className={`min-h-0 min-w-0 flex-1 overflow-hidden ${previewRadius} ${editMode ? "pointer-events-none" : ""}`}
      >
        {child}
      </div>
    </div>
  );

  if (widget.widgetKind === "button") {
    const variantRaw = widget.style.variant;
    const toneClass =
      variantRaw === "danger"
        ? "border-red-500/50 bg-red-950/40 text-red-100 hover:bg-red-900/50"
        : variantRaw === "secondary"
          ? "border-zinc-600/80 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-700/60"
          : "border-[color:var(--dashboard-accent,#22d3ee)]/40 bg-[color:var(--dashboard-accent,#22d3ee)]/10 text-zinc-100 hover:bg-[color:var(--dashboard-accent,#22d3ee)]/20";
    return wrapEdit(
      <TRNButton
        type="button"
        className={`h-full w-full min-h-[var(--dashboard-row-height,48px)] overflow-hidden border ${toneClass} ${previewRadius}`}
        disabled={!widget.enabled || editMode}
        onClick={() => onButtonClick?.(widget.sourceNodeId)}
        hint="Dashboard button — fires the wired Click event output."
      >
        {widget.label}
      </TRNButton>,
    );
  }

  if (widget.widgetKind === "led") {
    return wrapEdit(
      <div className={`flex items-center ${panelClass}`}>
        <LedIndicatorNodePanel
          value={live.liveValue}
          defaultConfig={widget.style}
          sensorHealth={live.sensorHealth}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "text") {
    const numeric =
      typeof live.liveValue === "number" && Number.isFinite(live.liveValue)
        ? live.liveValue
        : null;
    return wrapEdit(
      <div className={`flex items-stretch ${panelClass}`}>
        <NumericDisplayNodePanel
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={live.sensorHealth}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "bar") {
    const numeric =
      typeof live.liveValue === "number" && Number.isFinite(live.liveValue)
        ? live.liveValue
        : null;
    return wrapEdit(
      <div className={`flex min-h-[var(--dashboard-row-height,120px)] ${panelClass}`}>
        <BarMeterNodePanel
          className="relative box-border h-full min-h-0 w-full min-w-0 flex-1"
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={live.sensorHealth}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "gauge") {
    const numeric =
      typeof live.liveValue === "number" && Number.isFinite(live.liveValue)
        ? live.liveValue
        : null;
    return wrapEdit(
      <div className={`flex min-h-[var(--dashboard-row-height,120px)] ${panelClass}`}>
        <RadialGaugeNodePanel
          className="relative box-border h-full min-h-0 w-full min-w-0 flex-1"
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={live.sensorHealth}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "sparkline") {
    return wrapEdit(
      <div className={`flex min-h-[var(--dashboard-row-height,80px)] p-1 ${panelClass}`}>
        <SparklineNodePanel
          className="min-h-0 flex-1"
          history={live.liveHistory ?? []}
          defaultConfig={widget.style}
          sensorHealth={live.sensorHealth}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "plotter") {
    return wrapEdit(
      <DashboardPlotterWidgetBody
        widget={widget}
        livePlotHistory={live.livePlotHistory}
        shellClassName={panelClass}
      />,
    );
  }

  if (widget.widgetKind === "switch") {
    const checked = live.liveValue === true;
    return wrapEdit(
      <div
        className={`flex min-h-[var(--dashboard-row-height,48px)] items-center justify-between gap-3 px-3 py-2 ${panelClass}`}
      >
        <span className="truncate text-[12px] font-medium text-zinc-200">{widget.label}</span>
        <TRNToggleSwitch
          checked={checked}
          disabled={!widget.enabled || editMode}
          ariaLabel={`${widget.label} switch`}
          onCheckedChange={(next) => onSwitchValueChange?.(widget.sourceNodeId, next)}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "slider") {
    const numeric =
      typeof live.liveValue === "number" && Number.isFinite(live.liveValue)
        ? live.liveValue
        : 0;
    return wrapEdit(
      <div className={`flex ${panelClass}`}>
        <DashboardSliderNodePanel
          defaultConfig={widget.style}
          value={numeric}
          disabled={!widget.enabled || editMode}
          onValueChange={(next) => onSliderValueChange?.(widget.sourceNodeId, next)}
        />
      </div>,
    );
  }

  if (widget.widgetKind === "status") {
    const active = live.liveValue === true;
    return wrapEdit(
      <DashboardStatusNodePanel
        className={panelClass}
        label={widget.label}
        active={active}
        defaultConfig={widget.style}
      />,
    );
  }

  if (widget.widgetKind === "knob") {
    return wrapEdit(
      <div
        className={`flex min-h-[var(--dashboard-row-height,120px)] ${panelClass} ${
          editMode ? "pointer-events-none opacity-80" : ""
        }`}
      >
        <KnobNodePanel
          className="relative box-border h-full min-h-0 w-full min-w-0 flex-1"
          nodeId={widget.sourceNodeId}
          defaultConfig={widget.style}
          updateValue={(nodeId, value) => onKnobValueChange?.(nodeId, value)}
        />
      </div>,
    );
  }

  return null;
});
