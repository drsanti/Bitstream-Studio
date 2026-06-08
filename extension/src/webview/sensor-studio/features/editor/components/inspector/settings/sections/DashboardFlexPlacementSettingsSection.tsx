import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { coerceDashboardFlexPlacementV1 } from "../../../../../../core/dashboard/dashboard-flex-placement";

export function DashboardFlexPlacementSettingsSection(
  props: NodeInspectorSettingsSectionProps,
) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const flex = coerceDashboardFlexPlacementV1(dc.flex);

  const patchFlex = (key: string, value: number | string) => {
    onUpdateConfigField("flex", { ...flex, [key]: value });
  };

  return (
    <InspectorSettingsSectionFrame title="Flex placement">
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Flex order and sizing on the <span className="font-medium text-zinc-400">Dashboard</span>{" "}
        pane when the root layout mode is <span className="font-medium text-zinc-400">Flex</span>.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <InspectorNumericField
          label="Order"
          value={flex.order}
          min={-24}
          max={48}
          step={1}
          onCommit={(v) => patchFlex("order", v)}
        />
        <InspectorNumericField
          label="Grow"
          value={flex.grow}
          min={0}
          max={8}
          step={1}
          onCommit={(v) => patchFlex("grow", v)}
        />
        <InspectorNumericField
          label="Shrink"
          value={flex.shrink}
          min={0}
          max={8}
          step={1}
          onCommit={(v) => patchFlex("shrink", v)}
        />
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Basis
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
            value={flex.basis}
            onChange={(e) => patchFlex("basis", e.target.value)}
          />
        </div>
      </div>
    </InspectorSettingsSectionFrame>
  );
}
