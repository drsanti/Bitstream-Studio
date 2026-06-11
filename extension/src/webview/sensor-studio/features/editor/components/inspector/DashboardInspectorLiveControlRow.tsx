import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton, TRNIconButton, TRNSelect, TRNToggleSwitch } from "../../../../../ui/TRN";
import {
  coerceDashboardSelectOptions,
  readDashboardSelectValue,
} from "../../../../core/dashboard/dashboard-select-options";
import {
  DASHBOARD_CONTROL_WIDGET_KINDS,
  DASHBOARD_DISPLAY_WIDGET_KINDS,
  dashboardWidgetKindLabel,
  formatDashboardWidgetLivePreview,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import { dashboardWidgetKindIcon } from "../../../../core/dashboard/dashboard-widget-kind-icons";
import type { DashboardWidgetEntryV1 } from "../../../../core/dashboard/dashboard-snapshot";
import { dashboardWidgetPanelClass } from "../../../dashboard/dashboard-grid-edit-chrome";
import { DashboardFormattedTextPanel } from "../../../dashboard/DashboardFormattedTextPanel";
import { DashboardImageTilePanel } from "../../../dashboard/DashboardImageTilePanel";
import { DashboardPlotterWidgetBody } from "../../../dashboard/DashboardPlotterWidgetBody";
import { DashboardSliderNodePanel } from "../../../dashboard/DashboardSliderNodePanel";
import { DashboardStatusNodePanel } from "../../../dashboard/DashboardStatusNodePanel";
import { LedIndicatorNodePanel } from "../../nodes/led-indicator/LedIndicatorNodePanel";
import { KnobNodePanel } from "../../nodes/knob/KnobNodePanel";
import { NumericDisplayNodePanel } from "../../nodes/numeric-display/NumericDisplayNodePanel";
import { BarMeterNodePanel } from "../../nodes/bar-meter/BarMeterNodePanel";
import { RadialGaugeNodePanel } from "../../nodes/radial-gauge/RadialGaugeNodePanel";
import { SparklineNodePanel } from "../../nodes/sparkline/SparklineNodePanel";

type LiveControlHandlers = {
  editModeEnabled: boolean;
  onButtonClick: (sourceNodeId: string) => void;
  onKnobValueChange: (sourceNodeId: string, value: number) => void;
  onSwitchValueChange: (sourceNodeId: string, value: boolean) => void;
  onSelectValueChange: (sourceNodeId: string, value: string) => void;
  onSliderValueChange: (sourceNodeId: string, value: number) => void;
};

export type DashboardInspectorLiveControlRowProps = {
  widget: DashboardWidgetEntryV1;
  groupLabel: string | null;
} & LiveControlHandlers;

function widgetNeedsExpandPreview(widget: DashboardWidgetEntryV1): boolean {
  if (DASHBOARD_DISPLAY_WIDGET_KINDS.has(widget.widgetKind)) {
    return true;
  }
  return widget.widgetKind === "slider" || widget.widgetKind === "knob";
}

function renderExpandedPreview(
  widget: DashboardWidgetEntryV1,
  args: LiveControlHandlers & { groupLabel: string | null },
) {
  const disabled = !widget.enabled || args.editModeEnabled;
  const panelClass = dashboardWidgetPanelClass(args.editModeEnabled, {
    nestedInGroup: args.groupLabel != null,
  });

  if (widget.widgetKind === "slider") {
    const numeric =
      typeof widget.liveValue === "number" && Number.isFinite(widget.liveValue)
        ? widget.liveValue
        : 0;
    return (
      <div className="rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <DashboardSliderNodePanel
          defaultConfig={widget.style}
          value={numeric}
          disabled={disabled}
          onValueChange={(next) => args.onSliderValueChange(widget.sourceNodeId, next)}
        />
      </div>
    );
  }

  if (widget.widgetKind === "knob") {
    return (
      <div
        className={twMerge(
          "min-h-[120px] rounded-md border border-zinc-700/50 bg-zinc-900/50",
          disabled ? "pointer-events-none opacity-80" : "",
        )}
      >
        <KnobNodePanel
          className="relative box-border h-[120px] w-full min-w-0"
          nodeId={widget.sourceNodeId}
          defaultConfig={widget.style}
          updateValue={(nodeId, value) => args.onKnobValueChange(nodeId, value)}
        />
      </div>
    );
  }

  if (widget.widgetKind === "led") {
    return (
      <div className="rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <LedIndicatorNodePanel
          value={widget.liveValue}
          defaultConfig={widget.style}
          sensorHealth={widget.sensorHealth}
        />
      </div>
    );
  }

  if (widget.widgetKind === "text") {
    const numeric =
      typeof widget.liveValue === "number" && Number.isFinite(widget.liveValue)
        ? widget.liveValue
        : null;
    return (
      <div className="rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <NumericDisplayNodePanel
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={widget.sensorHealth}
        />
      </div>
    );
  }

  if (widget.widgetKind === "formatted-text") {
    const numeric =
      typeof widget.liveValue === "number" && Number.isFinite(widget.liveValue)
        ? widget.liveValue
        : null;
    return (
      <div className="rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <DashboardFormattedTextPanel
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={widget.sensorHealth}
        />
      </div>
    );
  }

  if (widget.widgetKind === "image") {
    return (
      <div className="min-h-[96px] overflow-hidden rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <DashboardImageTilePanel wiredUrl={widget.liveValue} defaultConfig={widget.style} />
      </div>
    );
  }

  if (widget.widgetKind === "gauge") {
    const numeric =
      typeof widget.liveValue === "number" && Number.isFinite(widget.liveValue)
        ? widget.liveValue
        : null;
    return (
      <div className="min-h-[120px] rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <RadialGaugeNodePanel
          className="relative box-border h-[120px] w-full min-w-0"
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={widget.sensorHealth}
        />
      </div>
    );
  }

  if (widget.widgetKind === "bar") {
    const numeric =
      typeof widget.liveValue === "number" && Number.isFinite(widget.liveValue)
        ? widget.liveValue
        : null;
    return (
      <div className="min-h-[100px] rounded-md border border-zinc-700/50 bg-zinc-900/50">
        <BarMeterNodePanel
          className="relative box-border h-[100px] w-full min-w-0"
          value={numeric}
          defaultConfig={widget.style}
          sensorHealth={widget.sensorHealth}
        />
      </div>
    );
  }

  if (widget.widgetKind === "status") {
    return (
      <DashboardStatusNodePanel
        label={widget.label}
        active={widget.liveValue === true}
        defaultConfig={widget.style}
      />
    );
  }

  if (widget.widgetKind === "sparkline") {
    return (
      <div className="min-h-[72px] rounded-md border border-zinc-700/50 bg-zinc-900/50 p-1">
        <SparklineNodePanel
          className="min-h-[64px] flex-1"
          history={widget.liveHistory ?? []}
          defaultConfig={widget.style}
          sensorHealth={widget.sensorHealth}
        />
      </div>
    );
  }

  if (widget.widgetKind === "plotter") {
    return (
      <DashboardPlotterWidgetBody widget={widget} shellClassName={`${panelClass} min-h-[140px]`} />
    );
  }

  return null;
}

function renderInlineControl(
  widget: DashboardWidgetEntryV1,
  args: LiveControlHandlers,
): ReactNode {
  const disabled = !widget.enabled || args.editModeEnabled;

  if (widget.widgetKind === "button") {
    const variantRaw = widget.style.variant;
    const toneClass =
      variantRaw === "danger"
        ? "border-red-500/50 bg-red-950/40 text-red-100 hover:bg-red-900/50"
        : variantRaw === "secondary"
          ? "border-zinc-600/80 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-700/60"
          : "border-[color:var(--dashboard-accent,#22d3ee)]/40 bg-[color:var(--dashboard-accent,#22d3ee)]/10 text-zinc-100 hover:bg-[color:var(--dashboard-accent,#22d3ee)]/20";
    return (
      <TRNButton
        type="button"
        className={`h-8 w-full border text-[11px] ${toneClass}`}
        disabled={disabled}
        onClick={() => args.onButtonClick(widget.sourceNodeId)}
        hint="Dashboard button — fires the wired Click event output."
      >
        {widget.label}
      </TRNButton>
    );
  }

  if (widget.widgetKind === "select") {
    const options = coerceDashboardSelectOptions(widget.style.options);
    const selected =
      typeof widget.liveValue === "string" && widget.liveValue.length > 0
        ? widget.liveValue
        : readDashboardSelectValue(widget.style, options);
    return (
      <TRNSelect
        variant="field"
        size="sm"
        ariaLabel={`${widget.label} select`}
        value={selected}
        options={options.map((opt) => ({ value: opt.value, label: opt.label }))}
        disabled={disabled}
        triggerClassName="w-full"
        onValueChange={(next) => args.onSelectValueChange(widget.sourceNodeId, next)}
      />
    );
  }

  return null;
}

export function DashboardInspectorLiveControlRow(props: DashboardInspectorLiveControlRowProps) {
  const { widget, groupLabel, editModeEnabled, ...handlers } = props;
  const KindIcon = dashboardWidgetKindIcon(widget.widgetKind);
  const isControl = DASHBOARD_CONTROL_WIDGET_KINDS.has(widget.widgetKind);
  const isSwitch = widget.widgetKind === "switch";
  const isButton = widget.widgetKind === "button";
  const needsExpand = widgetNeedsExpandPreview(widget);
  const livePreview = formatDashboardWidgetLivePreview(widget.liveValue);
  const disabled = !widget.enabled || editModeEnabled;

  const [expanded, setExpanded] = useState(() => {
    if (isButton || widget.widgetKind === "select") {
      return true;
    }
    return !needsExpand;
  });

  const inlineControl = isControl && !needsExpand ? renderInlineControl(widget, { editModeEnabled, ...handlers }) : null;
  const expandedPreview =
    needsExpand && expanded
      ? renderExpandedPreview(widget, { editModeEnabled, groupLabel, ...handlers })
      : null;

  const showHeader = !isButton;

  return (
    <li className="px-1 py-2 hover:bg-zinc-900/35">
      {showHeader ? (
        <div className="flex min-w-0 items-start gap-2">
          <div
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/50 text-zinc-400"
            aria-hidden
          >
            <KindIcon className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="truncate text-[11px] font-medium text-zinc-100">{widget.label}</p>
              <div className="flex shrink-0 items-center gap-1">
                {livePreview != null && !isSwitch ? (
                  <span
                    className={twMerge(
                      "text-[13px]",
                      typeof widget.liveValue === "boolean"
                        ? widget.liveValue
                          ? "text-emerald-300/95"
                          : "text-zinc-500"
                        : "text-emerald-50/95",
                    )}
                  >
                    {livePreview}
                  </span>
                ) : null}
                {isSwitch ? (
                  <TRNToggleSwitch
                    checked={widget.liveValue === true}
                    disabled={disabled}
                    ariaLabel={`${widget.label} switch`}
                    onCheckedChange={(next) => handlers.onSwitchValueChange(widget.sourceNodeId, next)}
                  />
                ) : null}
                {needsExpand ? (
                  <TRNIconButton
                    icon={
                      expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )
                    }
                    label={expanded ? "Collapse preview" : "Expand preview"}
                    variant="ghost"
                    hint={expanded ? "Hide widget preview" : "Show widget preview"}
                    nativeTitle={false}
                    onClick={() => setExpanded((open) => !open)}
                  />
                ) : null}
              </div>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-zinc-500">
              {dashboardWidgetKindLabel(widget.widgetKind)}
              {groupLabel != null ? ` · ${groupLabel}` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {isButton ? (
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/50 text-zinc-400"
            aria-hidden
          >
            <KindIcon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">{inlineControl}</div>
        </div>
      ) : null}

      {inlineControl != null && !isButton ? (
        <div className={showHeader ? "mt-2 pl-9" : ""}>{inlineControl}</div>
      ) : null}

      {expandedPreview != null ? <div className="mt-2 pl-9">{expandedPreview}</div> : null}
    </li>
  );
}
