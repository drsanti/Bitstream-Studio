import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { coerceDashboardPlacementV1 } from "../../../../../../core/dashboard/dashboard-placement";

export function DashboardPlacementSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const placement = coerceDashboardPlacementV1(dc.placement);

  const patchPlacement = (key: string, value: number) => {
    onUpdateConfigField("placement", { ...placement, [key]: value });
  };

  return (
    <InspectorSettingsSectionFrame title="Placement">
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Grid position on the <span className="font-medium text-zinc-400">Dashboard</span> workbench
        pane (1-based row and column). Width and height are cell spans.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <InspectorNumericField
          label="Column"
          value={placement.column}
          min={1}
          max={24}
          step={1}
          onCommit={(v) => patchPlacement("column", v)}
        />
        <InspectorNumericField
          label="Row"
          value={placement.row}
          min={1}
          max={48}
          step={1}
          onCommit={(v) => patchPlacement("row", v)}
        />
        <InspectorNumericField
          label="Width (cols)"
          value={placement.columnSpan}
          min={1}
          max={24}
          step={1}
          onCommit={(v) => patchPlacement("columnSpan", v)}
        />
        <InspectorNumericField
          label="Height (rows)"
          value={placement.rowSpan}
          min={1}
          max={12}
          step={1}
          onCommit={(v) => patchPlacement("rowSpan", v)}
        />
      </div>
    </InspectorSettingsSectionFrame>
  );
}
