import { TRNButton, TRNHintText, TRNToggleSwitch } from "../../../../../ui/TRN";
import {
  DASHBOARD_CONTROL_WIDGET_KINDS,
  DASHBOARD_DISPLAY_WIDGET_KINDS,
  dashboardWidgetKindLabel,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type {
  DashboardSnapshotItemV1,
  DashboardWidgetEntryV1,
} from "../../../../core/dashboard/dashboard-snapshot";
import { dashboardWidgetPanelClass } from "../../../dashboard/dashboard-grid-edit-chrome";
import { DashboardPlotterWidgetBody } from "../../../dashboard/DashboardPlotterWidgetBody";
import { DashboardSliderNodePanel } from "../../../dashboard/DashboardSliderNodePanel";
import { DashboardStatusNodePanel } from "../../../dashboard/DashboardStatusNodePanel";
import { LedIndicatorNodePanel } from "../../nodes/led-indicator/LedIndicatorNodePanel";
import { KnobNodePanel } from "../../nodes/knob/KnobNodePanel";
import { NumericDisplayNodePanel } from "../../nodes/numeric-display/NumericDisplayNodePanel";
import { BarMeterNodePanel } from "../../nodes/bar-meter/BarMeterNodePanel";
import { RadialGaugeNodePanel } from "../../nodes/radial-gauge/RadialGaugeNodePanel";
import { SparklineNodePanel } from "../../nodes/sparkline/SparklineNodePanel";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";

type DashboardInspectorControlsTabProps = {
  displayItems: readonly DashboardSnapshotItemV1[];
  editModeEnabled: boolean;
  onButtonClick: (sourceNodeId: string) => void;
  onKnobValueChange: (sourceNodeId: string, value: number) => void;
  onSwitchValueChange: (sourceNodeId: string, value: boolean) => void;
  onSliderValueChange: (sourceNodeId: string, value: number) => void;
};

function renderControlBody(
  widget: DashboardWidgetEntryV1,
  args: Omit<DashboardInspectorControlsTabProps, "displayItems" | "editModeEnabled"> & {
    editModeEnabled: boolean;
  },
) {
  const disabled = !widget.enabled || args.editModeEnabled;
  const { onButtonClick, onKnobValueChange, onSwitchValueChange, onSliderValueChange } = args;

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
        className={`h-9 w-full border ${toneClass}`}
        disabled={disabled}
        onClick={() => onButtonClick(widget.sourceNodeId)}
        hint="Dashboard button — fires the wired Click event output."
      >
        {widget.label}
      </TRNButton>
    );
  }

  if (widget.widgetKind === "switch") {
    const checked = widget.liveValue === true;
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-700/50 bg-zinc-900/50 px-2.5 py-2">
        <span className="truncate text-[12px] text-zinc-200">{widget.label}</span>
        <TRNToggleSwitch
          checked={checked}
          disabled={disabled}
          ariaLabel={`${widget.label} switch`}
          onCheckedChange={(next) => onSwitchValueChange(widget.sourceNodeId, next)}
        />
      </div>
    );
  }

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
          onValueChange={(next) => onSliderValueChange(widget.sourceNodeId, next)}
        />
      </div>
    );
  }

  if (widget.widgetKind === "knob") {
    return (
      <div
        className={`min-h-[120px] rounded-md border border-zinc-700/50 bg-zinc-900/50 ${
          disabled ? "pointer-events-none opacity-80" : ""
        }`}
      >
        <KnobNodePanel
          className="relative box-border h-[120px] w-full min-w-0"
          nodeId={widget.sourceNodeId}
          defaultConfig={widget.style}
          updateValue={(nodeId, value) => onKnobValueChange(nodeId, value)}
        />
      </div>
    );
  }

  return null;
}

function renderDisplayBody(widget: DashboardWidgetEntryV1, panelClass: string) {
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
      <DashboardPlotterWidgetBody
        widget={widget}
        shellClassName={`${panelClass} min-h-[140px]`}
      />
    );
  }

  return null;
}

function WidgetControlCard(props: {
  widget: DashboardWidgetEntryV1;
  groupLabel: string | null;
  editModeEnabled: boolean;
  handlers: Omit<DashboardInspectorControlsTabProps, "displayItems" | "editModeEnabled">;
}) {
  const { widget, groupLabel, editModeEnabled, handlers } = props;
  const panelClass = dashboardWidgetPanelClass(editModeEnabled, {
    nestedInGroup: groupLabel != null,
  });
  const isControl = DASHBOARD_CONTROL_WIDGET_KINDS.has(widget.widgetKind);
  const body = isControl
    ? renderControlBody(widget, { ...handlers, editModeEnabled })
    : renderDisplayBody(widget, panelClass);

  if (body == null) {
    return null;
  }

  return (
    <InspectorSettingsSectionFrame
      title={widget.label}
      collapsible
      defaultExpanded={isControl}
    >
      <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">
        {dashboardWidgetKindLabel(widget.widgetKind)}
        {groupLabel != null ? ` · ${groupLabel}` : ""}
      </p>
      {body}
    </InspectorSettingsSectionFrame>
  );
}

export function DashboardInspectorControlsTab(props: DashboardInspectorControlsTabProps) {
  const { displayItems, editModeEnabled, ...handlers } = props;

  const sections: Array<{ key: string; label: string; widgets: DashboardWidgetEntryV1[] }> = [];

  for (const item of displayItems) {
    if (item.kind === "group") {
      const controls = item.group.children.filter(
        (w) =>
          DASHBOARD_CONTROL_WIDGET_KINDS.has(w.widgetKind) ||
          DASHBOARD_DISPLAY_WIDGET_KINDS.has(w.widgetKind),
      );
      if (controls.length > 0) {
        sections.push({
          key: item.group.sourceNodeId,
          label: item.group.label,
          widgets: controls,
        });
      }
      continue;
    }
    if (
      DASHBOARD_CONTROL_WIDGET_KINDS.has(item.widget.widgetKind) ||
      DASHBOARD_DISPLAY_WIDGET_KINDS.has(item.widget.widgetKind)
    ) {
      sections.push({
        key: item.widget.sourceNodeId,
        label: "",
        widgets: [item.widget],
      });
    }
  }

  const controlCount = sections.reduce(
    (sum, section) =>
      sum + section.widgets.filter((w) => DASHBOARD_CONTROL_WIDGET_KINDS.has(w.widgetKind)).length,
    0,
  );

  return (
    <div className="space-y-3">
      {editModeEnabled ? (
        <TRNHintText className="text-amber-200/85">
          Edit mode is on — controls are disabled. Switch to Preview to operate widgets here or on
          the Dashboard pane.
        </TRNHintText>
      ) : (
        <TRNHintText className="text-zinc-500">
          Live operator panel — {controlCount} interactive control
          {controlCount === 1 ? "" : "s"} mirror the Dashboard pane.
        </TRNHintText>
      )}

      {sections.length === 0 ? (
        <p className="text-[11px] text-zinc-500">No dashboard controls on this page.</p>
      ) : (
        sections.map((section) => (
          <div key={section.key} className="space-y-2">
            {section.label.length > 0 ? (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">
                Group · {section.label}
              </p>
            ) : null}
            {section.widgets.map((widget) => (
              <WidgetControlCard
                key={widget.sourceNodeId}
                widget={widget}
                groupLabel={section.label.length > 0 ? section.label : null}
                editModeEnabled={editModeEnabled}
                handlers={handlers}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
