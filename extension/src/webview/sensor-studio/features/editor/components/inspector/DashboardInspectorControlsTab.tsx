import { Activity } from "lucide-react";
import { useMemo } from "react";
import { TRNHintText } from "../../../../../ui/TRN";
import {
  DASHBOARD_CONTROL_WIDGET_KINDS,
  DASHBOARD_DISPLAY_WIDGET_KINDS,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type {
  DashboardSnapshotItemV1,
  DashboardWidgetEntryV1,
} from "../../../../core/dashboard/dashboard-snapshot";
import { DashboardInspectorLiveControlRow } from "./DashboardInspectorLiveControlRow";

type DashboardInspectorControlsTabProps = {
  displayItems: readonly DashboardSnapshotItemV1[];
  editModeEnabled: boolean;
  onButtonClick: (sourceNodeId: string) => void;
  onKnobValueChange: (sourceNodeId: string, value: number) => void;
  onSwitchValueChange: (sourceNodeId: string, value: boolean) => void;
  onSelectValueChange: (sourceNodeId: string, value: string) => void;
  onSliderValueChange: (sourceNodeId: string, value: number) => void;
};

type WidgetSection = {
  key: string;
  label: string;
  widgets: DashboardWidgetEntryV1[];
};

function collectWidgetSections(displayItems: readonly DashboardSnapshotItemV1[]): WidgetSection[] {
  const sections: WidgetSection[] = [];

  for (const item of displayItems) {
    if (item.kind === "group") {
      const widgets = item.group.children.filter(
        (w) =>
          DASHBOARD_CONTROL_WIDGET_KINDS.has(w.widgetKind) ||
          DASHBOARD_DISPLAY_WIDGET_KINDS.has(w.widgetKind),
      );
      if (widgets.length > 0) {
        sections.push({
          key: item.group.sourceNodeId,
          label: item.group.label,
          widgets,
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

  return sections;
}

export function DashboardInspectorControlsTab(props: DashboardInspectorControlsTabProps) {
  const { displayItems, editModeEnabled, ...handlers } = props;

  const sections = useMemo(() => collectWidgetSections(displayItems), [displayItems]);

  const controlCount = useMemo(
    () =>
      sections.reduce(
        (sum, section) =>
          sum +
          section.widgets.filter((w) => DASHBOARD_CONTROL_WIDGET_KINDS.has(w.widgetKind)).length,
        0,
      ),
    [sections],
  );

  const widgetCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.widgets.length, 0),
    [sections],
  );

  if (sections.length === 0) {
    return <TRNHintText>No dashboard widgets on this page.</TRNHintText>;
  }

  return (
    <div className="space-y-2">
      {editModeEnabled ? (
        <TRNHintText tone="warn">
          Edit mode is on — controls are disabled. Switch to Preview to operate widgets here or on
          the Dashboard pane.
        </TRNHintText>
      ) : (
        <TRNHintText>
          {controlCount} interactive control{controlCount === 1 ? "" : "s"} · expand rows for
          gauges, plots, sliders, and knobs.
        </TRNHintText>
      )}

      <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
        <Activity className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
        {widgetCount} live widget{widgetCount === 1 ? "" : "s"}
      </p>

      <div className="scrollbar-hide max-h-[min(48vh,440px)] overflow-y-auto overflow-x-hidden rounded-md border border-zinc-800/70 bg-zinc-950/35">
        {sections.map((section) => (
          <div key={section.key}>
            {section.label.length > 0 ? (
              <p className="border-b border-zinc-800/60 bg-zinc-900/50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">
                Group · {section.label}
              </p>
            ) : null}
            <ul className="divide-y divide-zinc-800/60">
              {section.widgets.map((widget) => (
                <DashboardInspectorLiveControlRow
                  key={widget.sourceNodeId}
                  widget={widget}
                  groupLabel={section.label.length > 0 ? section.label : null}
                  editModeEnabled={editModeEnabled}
                  {...handlers}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
